const express = require("express");
const { Parser } = require("json2csv");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();
const cors = require("cors");
const pLimit = require("p-limit").default;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(
  cors({
    origin: ["https://meta-title-108.onrender.com"],
 // origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  })
);

// 🔥 Limit concurrency (VERY IMPORTANT)
const limit = pLimit(10); // only 10 requests at a time

// 🔹 Extract Meta Description
async function getMetaData(url) {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const { data, status, request } = response;

    // ✅ SAFE
    const html = (data || "").toLowerCase();
    const finalUrl = request?.res?.responseUrl || url;

    const $ = cheerio.load(data || "");

    // ✅ TITLE SAFE
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $('title').text() ||
      $('meta[name="twitter:title"]').attr("content") ||
      "No Title";

    // ✅ DESCRIPTION SAFE
    let description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content");

    description = description
      ? description.replace(/\s+/g, " ").trim()
      : "No Description";

    title = title.replace(/\s+/g, " ").trim();

    let LoginType = "unknown";
    let Status = "";

    // 🔴 DEAD
    if (
      status === 404 ||
      status === 410 ||
      html.includes("page not found") ||
      html.includes("content unavailable")
    ) {
      Status = "Dead";
    }

    // ⚠️ BLOCKED (SAFE CHECKS)
    else if (
      finalUrl.includes("login") ||
      html.includes("login") ||
      html.includes("sign in") ||
      description?.includes("Join Instagram") // ✅ SAFE
    ) {
      if(description.includes("Create an account") || description.includes("log in to")){
        LoginType = "blocked";
        Status = "Login";
      }
      else{
        LoginType = "No Blocked";
      }
      if(LoginType === "No Blocked" && description === "No Description"){
        Status = "Dead";
      }
      
     
    //  console.log(html.includes("login"));
    }

    // 🟢 ACTIVE
    else if (description !== "No Description") {
      Status = "Active";
    }

    else if (status === 200 && html.length > 500) {
      Status = "Active";
    }

    return {
      url,
      title,
      description,
      Login:LoginType,
      status: Status,
    };

  } catch (err) {
    console.error("URL ERROR:", url, err.message); // 🔥 IMPORTANT LOG

    return {
      url,
      title: "Error",
      description: "Error fetching",
      status: "error",
    };
  }
}
// 🔥 Batch processor
async function processInBatches(urls) {
  const batchSize = 50; // process 50 URLs per batch
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((url) => limit(() => getMetaData(url)))
    );

    results.push(...batchResults);
  }

  return results;
}

// 🔹 API Route
app.post("/api/description", async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: "urls must be an array" });
  }

  if (urls.length > 2000) {
    return res.status(400).json({ error: "Max 2000 URLs allowed" });
  }

  try {
    const results = await processInBatches(urls);
    res.json(results);
  } catch {
    res.status(500).json({ error: "Processing failed" });
  }
});

// Download API 


app.post("/api/download-csv", async (req, res) => {
  try {
    const { urls } = req.body;

    const results = await processInBatches(urls);

    const fields = [
      { label: "URL", value: "url" },
      { label: "TITLE", value: "title" },
      { label: "DESCRIPTION", value: "description" },
      { label: "STATUS", value: "status" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(results);

    res.header("Content-Type", "text/csv");
    res.attachment("results.csv");

    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "CSV error" });
  }
});

// 🔹 Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});