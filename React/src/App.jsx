import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    const urlList = urls.split("\n").filter((u) => u.trim());

    setLoading(true);
    const res = await axios.post("http://localhost:5000/api/description", {
      urls: urlList,
    });
    setResults(res.data);
    setLoading(false);
  };

  const handleDownload = async () => {
    const urlList = urls.split("\n").filter((u) => u.trim());

    const res = await axios.post(
      "http://localhost:5000/api/download",
      { urls: urlList },
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "titles.csv";
    link.click();
  };

  const handleUpload = async (e) => {
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    setLoading(true);
    const res = await axios.post(
      "http://localhost:5000/api/upload",
      formData
    );
    setResults(res.data);
    setLoading(false);
  };

  return (
    <div className="container">
      <h2>Meta Title Extractor</h2>

      <textarea
        placeholder="Enter URLs (one per line)"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
      />

      <div className="buttons">
        <button onClick={handleFetch}>Fetch Titles</button>
        <button onClick={handleDownload}>Download CSV</button>
        <input type="file" onChange={handleUpload} />
      </div>

      {loading && <p>Loading...</p>}

      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Title</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td>{r.url}</td>
              <td>{r.title}</td>
              <td>{r.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;