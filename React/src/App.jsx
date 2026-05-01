import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const [urls, setUrls] = useState("");
  const [urlType, setUrlFormate] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 FIX: prevent form reload bug
  const handleFetch = async (e) => {
    e.preventDefault();

    const urlList = urls.split("\n").filter((u) => u.trim());
    const chunkSize = 100;

    let allResults = [];

    setLoading(true);

    try {
      for (let i = 0; i < urlList.length; i += chunkSize) {
        const chunk = urlList.slice(i, i + chunkSize);

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
  const handleDownload = async () => {
    const urlList = urls.split("\n").filter((u) => u.trim());

    try {
      const res = await axios.post(
        `${apiUrl}/api/download-csv`,
        {
          urls: urlList,
          linkType: urlType,
        },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "text/csv" });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "results.csv";
      link.click();
    } catch (err) {
      console.error(err);
    }
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