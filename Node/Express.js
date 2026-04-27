const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const pLimit = require("p-limit").default;
const multer = require("multer");
const { Parser } = require("json2csv");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });
const limit = pLimit(5);

// 🔹 Extract title
async function getTitle(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 5000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(data);

    let method = "";
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="og:title"]').attr("content") ||
      $('meta[property="twitter:title"]').attr("content");

    if (title) {
      method = "og:title";
    } else {
      title = $("title").text();
      method = "title";
    }

    if (!title || title.trim() === "") {
      title = "No Title Found";
      method = "fallback";
    }

    title = title.replace(/\s+/g, " ").trim();

    return { url, title, method };
  } catch {
    return { url, title: "Error fetching", method: "error" };
  }
}

// 🔹 Process URLs
async function processUrls(urls) {
  const tasks = urls.map((url) => limit(() => getTitle(url)));
  return Promise.all(tasks);
}

// 🔹 Bulk API
app.post("/api/bulk", async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const results = await processUrls(urls);
  res.json(results);
});

// 🔹 CSV Upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file.buffer.toString("utf-8");

    const urls = file
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && l !== "url");

    const results = await processUrls(urls);
    res.json(results);
  } catch {
    res.status(500).json({ error: "CSV error" });
  }
});

// 🔹 CSV Download
app.post("/api/download", async (req, res) => {
  const { urls } = req.body;

  const results = await processUrls(urls);

  const parser = new Parser({ fields: ["url", "title", "method"] });
  const csv = parser.parse(results);

  res.header("Content-Type", "text/csv");
  res.attachment("titles.csv");
  res.send(csv);
});

app.listen(5000, () => console.log("Server running on port 5000"));