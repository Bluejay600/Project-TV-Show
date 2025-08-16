// ===== Global State =====
let currentView = "shows"; // "shows" | "episodes"
let allShows = [];
let allEpisodes = [];
let selectedShowId = null;

// ===== Create UI Elements =====
const rootElem = document.getElementById("root");

const controlsBar = document.createElement("div");
controlsBar.id = "controls-bar";

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Search shows...";
searchInput.id = "search-input";

const searchCount = document.createElement("span");
searchCount.id = "search-count";

const episodeSelect = document.createElement("select");
episodeSelect.id = "episode-select";
episodeSelect.style.display = "none";

const backBtn = document.createElement("button");
backBtn.id = "back-to-shows";
backBtn.textContent = "← Back to Shows";
backBtn.style.display = "none";

controlsBar.append(backBtn, searchInput, episodeSelect, searchCount);
document.body.insertBefore(controlsBar, rootElem);

// ===== Single-Fetch Caches =====
let showsListPromise = null;
const episodesCache = new Map();
const inFlightEpisodeFetch = new Map();

// Load episodes when the page loads
window.onload = setup;

function setup() {
  setView("shows");
  showLoadingMessage("Loading shows…");

  fetchShowsOnce()
    .then(shows => {
      shows.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "accent" })
      );
      allShows = shows;
      hideMessage();
      renderShows(allShows);
      updateSearchUI();
    })
    .catch(err => {
      showErrorMessage("Failed to load shows. Please try again later.");
      console.error(err);
    });

  backBtn.addEventListener("click", () => {
    setView("shows");
    episodeSelect.value = "all";
    searchInput.value = "";
    renderShows(allShows);
    updateSearchUI();
  });

  searchInput.addEventListener("input", onSearchInput);

  episodeSelect.addEventListener("change", () => {
    if (currentView !== "episodes") return;
    const selectedId = episodeSelect.value;
    const term = searchInput.value.toLowerCase();
    const base = filterEpisodes(allEpisodes, term);

    if (selectedId === "all") {
      displayEpisodes(base);
      updateSearchCount(base.length, allEpisodes.length);
    } else {
      const selectedEpisode = base.find(ep => ep.id.toString() === selectedId);
      displayEpisodes(selectedEpisode ? [selectedEpisode] : []);
      updateSearchCount(selectedEpisode ? 1 : 0, allEpisodes.length);
    }
  });
}
// ===== View Management =====
function setView(view) {
  currentView = view;
  if (view === "shows") {
    backBtn.style.display = "none";
    episodeSelect.style.display = "none";
    searchInput.placeholder = "Search shows (name, genres, summary)…";
    searchCount.textContent = "";
  } else {
    backBtn.style.display = "inline-block";
    episodeSelect.style.display = "inline-block";
    searchInput.placeholder = "Search episodes (name or summary)…";
  }
}

function onSearchInput() {
  const term = searchInput.value.toLowerCase();
  if (currentView === "shows") {
    const filtered = filterShows(allShows, term);
    renderShows(filtered);
    searchCount.textContent = `Showing ${filtered.length} / ${allShows.length} shows`;
  } else {
    const filtered = filterEpisodes(allEpisodes, term);
    displayEpisodes(filtered);
    updateSearchCount(filtered.length, allEpisodes.length);
    episodeSelect.value = "all";
  }
}

function updateSearchUI() {
  if (currentView === "shows") {
    searchCount.textContent = `Showing ${allShows.length} / ${allShows.length} shows`;
  } else {
    searchCount.textContent = `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;
  }
}

// ===== Fetch Helpers =====
function fetchShowsOnce() {
  if (showsListPromise) return showsListPromise;
  showsListPromise = fetch("https://api.tvmaze.com/shows")
    .then(res => {
      if (!res.ok) throw new Error(`Shows HTTP ${res.status}`);
      return res.json();
    });
  return showsListPromise;
}
function populateEpisodeSelect(episodes) {
  if (!episodeSelect) return;
  episodeSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Find episodes";
  episodeSelect.appendChild(defaultOption);


  episodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep.id;
    option.textContent = `${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });
}

function sortShowsAlphabetically(shows) {
  return shows.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  // Episode count display
  let countDisplay = document.getElementById("episode-count");
  if (!countDisplay) {
    countDisplay = document.createElement("div");
    countDisplay.id = "episode-count";
    countDisplay.setAttribute("aria-live", "polite");
    document.body.insertBefore(countDisplay, rootElem);
  }
  countDisplay.textContent = `Displaying ${episodeList.length} / ${allEpisodes.length} episodes`;

  // No results message
  if (episodeList.length === 0) {
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "Oops no match found!!!";
    rootElem.appendChild(message);
    return;
  }
  // Create episode cards
  const fragment = document.createDocumentFragment();
  episodeList.forEach((episode) => {
    const episodeCard = createEpisodeCard(episode);
    fragment.appendChild(episodeCard);
  });
  rootElem.appendChild(fragment);
}

function createEpisodeCard(episode) {
  const episodeCard = document.createElement("div");
  episodeCard.className = "episode-card";
  episodeCard.id = `episode-${episode.id}`;

  const title = document.createElement("h3");
  title.textContent = `${episode.name} — ${formatEpisodeCode(episode.season, episode.number)}`;

  const image = document.createElement("img");
  image.src = episode.image?.medium || "placeholder.jpg"; // placeholder if no image
  image.alt = episode.name;

  const summary = document.createElement("div");
  summary.className = "summary";
  summary.innerHTML = episode.summary || "No summary available.";


  const link = document.createElement("a");
  link.href = episode.url;
  link.textContent = "View on TVMaze";
  link.target = "_blank";

  episodeCard.append(title, image, summary, link);
  return episodeCard;
}

function addSearchAndFiltersInputs() {
  const controlsContainer = document.createElement("div");
  controlsContainer.id = "controls-container";

  showSelect = document.createElement("select");
  showSelect.id = "show-selector";
  showSelect.setAttribute("aria-label", "Select a show");
  controlsContainer.appendChild(showSelect);


  // Search input
  searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search...";
  searchInput.id = "search-input";
  searchInput.setAttribute("aria-label", "Search episodes");
  controlsContainer.appendChild(searchInput);

  // Episode selector
  episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-selector";
  episodeSelect.setAttribute("aria-label", "Select an episode");
  controlsContainer.appendChild(episodeSelect);

  document.body.insertBefore(controlsContainer, document.body.firstChild);

  populateShowSelect([...showCache.values()]);
  populateEpisodeSelect(allEpisodes);

  showSelect.addEventListener("change", async () => {
    const selectedShowId = showSelect.value;
    if (selectedShowId) {
      await loadEpisodesForShow(selectedShowId);
      populateEpisodeSelect(allEpisodes);
      searchInput.value = "";
      currentSearchTerm = "";
      renderFilteredEpisodes();
    }
  });
  searchInput.addEventListener("input", debounce(() => {
    currentSearchTerm = searchInput.value.toLowerCase();
    episodeSelect.value = "";
    renderFilteredEpisodes();
  }, 300));

  episodeSelect.addEventListener("change", () => {
    const selectedId = episodeSelect.value;
    searchInput.value = "";
    currentSearchTerm = "";

    if (!selectedId) {
      renderFilteredEpisodes();
      return;
    }

    const selectedEpisode = allEpisodes.find(ep => ep.id.toString() === selectedId);
    makePageForEpisodes(selectedEpisode ? [selectedEpisode] : []);
  });
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
// Filter for just that episode

function renderFilteredEpisodes() {
  const filteredEpisodes = allEpisodes.filter(episode => {
    const summaryText = episode.summary ? episode.summary.toLowerCase() : "";
    return (
      episode.name.toLowerCase().includes(currentSearchTerm) ||
      summaryText.includes(currentSearchTerm)
    );
  });
  makePageForEpisodes(filteredEpisodes);
}

function formatEpisodeCode(season, number) {
  const seasonStr = season.toString().padStart(2, '0');
  const numberStr = number.toString().padStart(2, '0');
  return `S${seasonStr}E${numberStr}`;
}

// Loading & error messages
function showLoadingMessage() {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "<p>Loading episodes...</p>";
}

function hideLoadingMessage() {
  document.getElementById("root").innerHTML = "";
}

function showErrorMessage(message) {
  let rootElem = document.getElementById("root");
  if (!rootElem) {
    rootElem = document.createElement("div");
    rootElem.id = "root";
    document.body.appendChild(rootElem);
  }
  rootElem.innerHTML = `<p class="error" style="color:red;">${message}</p>`;
}


