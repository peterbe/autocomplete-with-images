import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Highlighter from "react-highlight-words";
import "./styles.css";

const PUBLIC_URL = process.env.PUBLIC_URL || "";
const lazyloadImage = PUBLIC_URL + "/static/lazyload-thumbnail.png";

function preloadImage(url, cb) {
  const img = new Image();
  img.onload = cb;
  img.src = url;
}
preloadImage(lazyloadImage, () => {});

function App() {
  const [results, setResults] = useState(null);
  const [resultsCount, setResultsCount] = useState(0);
  const [search, setSearch] = useState("");

  // Using sessionStorage is just a trick to avoid having to download
  // all these every time you reload the app.
  const [allPictures, setAllPictures] = useState(
    JSON.parse(sessionStorage.getItem("allPictures") || "null")
  );
  useEffect(() => {
    if (!allPictures) {
      (async url => {
        const res = await fetch(url);
        const pictures = await res.json();
        setAllPictures(pictures);
        sessionStorage.setItem("allPictures", JSON.stringify(pictures));
      })("https://picsum.photos/list");
    }
  }, [allPictures]);

  useEffect(() => {
    if (!search.trim()) {
      return setResults(null);
    }

    const searchFor = search.toLowerCase();
    const found = allPictures.filter(p => {
      return (
        p.author.toLowerCase().includes(searchFor) ||
        (searchFor.length > 2 && p.filename.includes(search))
      );
    });
    setResultsCount(found.length);
    setResults(found.slice(0, 10));
  }, [search]);

  return (
    <div className="App">
      <h1>
        <input
          type="text"
          placeholder="Type your search here..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </h1>

      <ShowAutocompleteResults
        search={search}
        results={results}
        count={resultsCount}
      />
      <hr />
      <p>
        <small>
          {allPictures === null
            ? "Downloading list of pictures..."
            : `Downloaded list of ${allPictures.length.toLocaleString()} pictures`}
        </small>
      </p>
    </div>
  );
}

function ShowAutocompleteResults({ results, count, search }) {
  if (!results) return null;
  return (
    <div className="suggestions">
      <p className="meta">
        Found {count.toLocaleString()}
        {count > results.length && `, only showing first ${results.length}`}
      </p>
      {results.map(p => {
        return (
          <div key={p.id}>
            <p>
              <img
                // src={`https://picsum.photos/1000/1000?image=${p.id}`}
                src={lazyloadImage}
                alt={p.filename}
              />
              <b>
                <Highlighter
                  searchWords={[search]}
                  textToHighlight={p.author}
                />
              </b>
            </p>
            <p>
              <code>
                <Highlighter
                  searchWords={[search]}
                  textToHighlight={p.filename}
                />
              </code>
              <br />
              <small>
                {p.width}x{p.height} ({p.format})
              </small>
            </p>
          </div>
        );
      })}
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
