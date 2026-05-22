const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const { Parser } = require("json2csv");
const he = require("he");
const pLimit = require("p-limit").default;
const http = require("http");
const https = require("https");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

// ================= KEEP ALIVE =================
const httpAgent = new http.Agent({
  keepAlive: true,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
});

// ================= CONCURRENCY =================
const limit = pLimit(10);

// ================= RETRY WRAPPER =================
async function fetchWithRetry(
  url,
  retries = 2
) {

  try {

    // ================= FIX URL =================
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://")
    ) {
      url = "https://" + url;
    }

    return await axios.get(url, {

      timeout: 15000,

      httpAgent,
      httpsAgent,

      headers: {
        "User-Agent":
          "Mozilla/5.0",

        "Accept-Language":
          "en-US,en;q=0.9",

        Connection: "keep-alive",
      },

      maxRedirects: 5,

      validateStatus: () => true,
    });

  } catch (err) {

    if (retries > 0) {

      await new Promise((r) =>
        setTimeout(r, 1000)
      );

      return fetchWithRetry(
        url,
        retries - 1
      );
    }

    throw err;
  }
}

// ================= CORE FUNCTION =================
async function getMetaData(
  url,
  linkType
) {

  let Formate = "";

  if (
    linkType &&
    linkType.length > 0
  ) {

    Formate = url.includes(linkType)
      ? "Correct"
      : "Wrong";
  }

  try {

    const response =
      await fetchWithRetry(url);

    const {
      data,
      status: statusCode,
      request,
      headers,
    } = response;

    // ================= EMPTY DATA =================
    if (!data) {

      return {
        url,
        title: "Empty",
        description: "No Data",
        login: "Unknown",
        status: "Dead",
        linkType: Formate,
      };
    }

    // ================= CONTENT TYPE =================
    const contentType =
      headers["content-type"] || "";

    if (
      !contentType.includes(
        "text/html"
      )
    ) {

      return {
        url,
        title: "Non HTML",
        description:
          "Unsupported Content",
        login: "Unknown",
        status: "Skipped",
        linkType: Formate,
      };
    }

    // ================= HTML =================
    const html =
      typeof data === "string"
        ? data
            .slice(0, 50000)
            .toLowerCase()
        : "";

    // ================= FINAL URL =================
    const finalUrl =
      request?.res?.responseUrl ||
      url;

    // ================= CHEERIO =================
    const $ = cheerio.load(
      typeof data === "string"
        ? data
        : ""
    );

    // ================= TITLE =================
    let title =

      $(
        'meta[property="og:title"]'
      ).attr("content") ||

      $("title").text() ||

      "No Title";

    // ================= DESCRIPTION =================
    let description =

      $(
        'meta[name="description"]'
      ).attr("content") ||

      $(
        'meta[property="og:description"]'
      ).attr("content") ||

      $(
        'meta[name="twitter:description"]'
      ).attr("content") ||

      "No Description";

    // ================= CLEAN TITLE =================
    title = he
      .decode(title)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);

    // ================= CLEAN DESCRIPTION =================
    description = he
      .decode(description)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 250);

    // ================= STATUS =================
    let Status = "Unknown";

    let LoginType =
      "No Blocked";

    // ================= DEAD =================
    if (statusCode >= 400) {

      Status = "Dead";
    }

    // ================= LOGIN =================
    else if (

      finalUrl.includes("login") ||

      finalUrl.includes("auth") ||

      html.includes("login") ||

      html.includes("log in") ||

      html.includes("sign in")

    ) {

      Status = "Login";

      LoginType = "Blocked";
    }

    // ================= LIMITED =================
    else if (

      !description ||

      description ===
        "No Description"

    ) {

      Status = "Limited";
    }

    // ================= ACTIVE =================
    else {

      Status = "Active";
    }

    return {
      url,
      title,
      description,
      login: LoginType,
      status: Status,
      linkType: Formate,
    };

  } catch (err) {

    return {
      url,
      title: "Error",
      description: "Failed",
      login: "Unknown",
      status: "Error",
      linkType: Formate,
      error: err.message,
    };
  }
}

// ================= FAST PROCESS =================
async function processUrls(
  urls,
  linkType = ""
) {

  return Promise.all(

    urls.map((url) =>

      limit(() =>
        getMetaData(
          url,
          linkType
        )
      )
    )
  );
}

// ================= MAIN API =================
app.post(
  "/api/description",
  async (req, res) => {

    try {

      const {
        urls,
        linkType,
      } = req.body;

      if (
        !Array.isArray(urls)
      ) {

        return res
          .status(400)
          .json({
            error:
              "urls must be an array",
          });
      }

      if (urls.length > 2000) {

        return res
          .status(400)
          .json({
            error:
              "Max 2000 URLs allowed",
          });
      }

      const results =
        await processUrls(
          urls,
          linkType
        );

      res.json(results);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:
          "Processing failed",
      });
    }
  }
);

// ================= CSV =================
app.post(
  "/api/download-csv",
  async (req, res) => {

    try {

      const {
        urls,
        linkType,
      } = req.body;

      const results =
        await processUrls(
          urls,
          linkType
        );

      const parser =
        new Parser({
          fields: [
            {
              label: "URL",
              value: "url",
            },
            {
              label: "TITLE",
              value: "title",
            },
            {
              label:
                "DESCRIPTION",
              value:
                "description",
            },
            {
              label: "LOGIN",
              value: "login",
            },
            {
              label: "STATUS",
              value: "status",
            },
            {
              label: "FORMAT",
              value:
                "linkType",
            },
          ],
        });

      const csv =
        parser.parse(results);

      res.header(
        "Content-Type",
        "text/csv"
      );

      res.attachment(
        "results.csv"
      );

      res.send(csv);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "CSV error",
      });
    }
  }
);

// ================= HEALTH =================
app.get("/", (req, res) => {

  res.send(
    "API is running 🚀"
  );
});

// ================= START =================
app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});