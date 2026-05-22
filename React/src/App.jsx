import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import { use } from "react";

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const [urls, setUrls] = useState("");
  const [urlType, setUrlFormate] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("");

  // 🔥 FIX: prevent form reload bug
  const handleFetch = async (e) => {
    e.preventDefault();

    const urlList = urls.split("\n").filter((u) => u.trim());
    const chunkSize = 50;

    let allResults = [];

    setLoading(true);

    try {
      for (let i = 0; i < urlList.length; i += chunkSize) {
        const chunk = urlList.slice(i, i + chunkSize);
        const lasturl = i + chunkSize > urlList.length ? urlList.length : i + chunkSize;
        setRange(`${i+1} - ${lasturl}`);
        const res = await axios.post(`${apiUrl}/api/description`, {
          urls: chunk,
          linkType: urlType,
        });

        allResults = [...allResults, ...res.data];

        // 🔥 FIX: avoid heavy re-render issues
        setResults([...allResults]);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // 🔥 FIX: button type added + safety
  const handleDownload = () => {

  if (results.length === 0) {
    return;
  }

  const headers = [
    "URL",
    "STATUS",
    "TITLE",
    "DESCRIPTION",
  ];

  const csvRows = [];

  // HEADER
  csvRows.push(headers.join(","));

  // DATA
  results.forEach((r) => {

    csvRows.push([
      `"${r.url || ""}"`,
      `"${r.status || ""}"`,
      `"${(r.title || "").replace(/"/g, '""')}"`,
      `"${(r.description || "").replace(/"/g, '""')}"`
    ].join(","));

  });

  const csvContent =
    csvRows.join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const link =
    document.createElement("a");

  link.href =
    window.URL.createObjectURL(blob);

  link.download =
    "results.csv";

  link.click();

  window.URL.revokeObjectURL(
    link.href
  );
};
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/api/upload`, formData);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h2>Meta Title Extractor</h2>

      {/* FIX: form submit handled properly */}
      <form onSubmit={handleFetch}>
        <textarea
          placeholder="Enter URLs (one per line)"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
        />

        <div className="buttons">
          <input
            required
            type="text"
            placeholder="Enter URL format..."
            value={urlType}
            onChange={(e) => setUrlFormate(e.target.value)}
          />

          {/* FIX: type submit */}
          <button type="submit" disabled={loading}>
            Fetch Titles
          </button>

          {/* FIX: prevent form submit */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
          >
            Download CSV
          </button>

          <input type="file" onChange={handleUpload} />
        </div>
      </form>

      {loading && <p>Loading...</p>}
      {loading && <p>{range}</p>}

      <table>
        <thead>
          <tr>
            <th>Sr No.</th>
            <th>URLs</th>
            <th>Title</th>
            <th>Description</th>
            <th>Login</th>
            <th>Format</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.url}</td>
              <td>{r.title}</td>
              <td>{r.description}</td>
              <td>{r.login}</td>
              <td>{r.linkType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;