const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cors());

// 🔹 Extract Meta Description
async function getMetaDescription(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 5000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(data);

    let method = "";
    let description = "";

    if ($('meta[name="description"]').attr("content")) {
      description = $('meta[name="description"]').attr("content");
      method = "Active";
    } 
    else if ($('meta[property="og:description"]').attr("content")) {
      description = $('meta[property="og:description"]').attr("content");
      method = "og:description";
    } 
    else if ($('meta[name="twitter:description"]').attr("content")) {
      description = $('meta[name="twitter:description"]').attr("content");
      method = "twitter:description";
    } 
    else {
      description = "No Description Found";
      method = "Dead";
    }

    // Clean text
    description = description.replace(/\s+/g, " ").trim();

    return { url, description, method };

  } catch (error) {
    return { url, description: "Error fetching", method: "error" };
  }
}

// 🔹 API Route
app.post("/api/description", async (req, res) => {
  const { urls } = req.body;

  // 🔴 Validate input
  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: "urls must be an array" });
  }

  const results = await Promise.all(
    urls.map((url) => getMetaDescription(url))
  );

  res.json(results);
});

// 🔹 Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});