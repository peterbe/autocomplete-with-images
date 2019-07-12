import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Highlighter from "react-highlight-words";
import "./styles.css";

const PUBLIC_URL = process.env.PUBLIC_URL || "";
const lazyloadImage = PUBLIC_URL + "/static/lazyload-thumbnail.png";

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
        const imgUrl = `https://picsum.photos/1000/1000?image=${p.id}`;
        return (
          <div key={p.id}>
            <p>
              <ShowImage url={imgUrl} alt={p.filename} />
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
              <br />
              <code>{imgUrl}</code>
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Module level "cache" of which image URLs have been successfully inserted
// into the DOM at least once.
// By knowing these, we can, on repeat URLs, avoid the whole lazy-load
// image swapping trick.
const loadedOnce = new Set();

new Image().src = lazyloadImage;

const ShowImage = React.memo(({ url, alt }) => {
  const [src, setSrc] = useState(loadedOnce.has(url) ? url : lazyloadImage);

  useEffect(() => {
    let preloadImg = null;
    let dismounted = false;

    if (src === lazyloadImage) {
      // We need to preload the eventually needed image.
      preloadImg = new Image();

      function cb() {
        if (!dismounted) {
          setSrc(url);
        }
        // XXX not sure it's worth keeping this
        if (loadedOnce.has(url)) {
          throw new Error(`${url} has already been loaded once!`);
        }
        loadedOnce.add(url);
      }
      // This must come before .decode() otherwise Safari will
      // raise an EncodingError.
      preloadImg.src = url;
      // https://html.spec.whatwg.org/multipage/embedded-content.html#dom-img-decode
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode#Browser_compatibility
      preloadImg.decode
        ? preloadImg.decode().then(cb)
        : (preloadImg.onload = cb);
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding
      preloadImg.decoding = "sync";
    }

    return () => {
      if (preloadImg) {
        // Immediately undo the preloading since we might not need this image.
        // See https://jsfiddle.net/nw34gLgt/ for demo of this technique.
        preloadImg.src = "";
      }
      dismounted = true;
    };
  }, []);
  return <img src={src} alt={alt} />;
});

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
