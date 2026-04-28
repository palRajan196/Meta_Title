const express = require("express");
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
    methods: ["GET", "POST"],
  })
);

// 🔥 Limit concurrency (VERY IMPORTANT)
const limit = pLimit(10); // only 10 requests at a time

// 🔹 Extract Meta Description
async function getMetaDescription(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(data);

    let method = "";
    let description = "";

    if ($('meta[name="description"]').attr("content")) {
      description = $('meta[name="description"]').attr("content");
      method = "Active";
    } else if ($('meta[property="og:description"]').attr("content")) {
      description = $('meta[property="og:description"]').attr("content");
      method = "og:description";
    } else if ($('meta[name="twitter:description"]').attr("content")) {
      description = $('meta[name="twitter:description"]').attr("content");
      method = "twitter:description";
    } else {
      description = "No Description Found";
      method = "Dead";
    }

    description = description.replace(/\s+/g, " ").trim();

    return { url, description, method };
  } catch {
    return { url, description: "Error fetching", method: "error" };
  }
}

// 🔥 Batch processor
async function processInBatches(urls) {
  const batchSize = 50; // process 50 URLs per batch
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((url) => limit(() => getMetaDescription(url)))
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

// 🔹 Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});