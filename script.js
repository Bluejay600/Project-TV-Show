let allEpisodes = []; // Global so it can be used across functions to store API data.
let currentSearchTerm = "";
let showCache = new Map();
let episodeCache = new Map();

// Load episodes when the page loads
window.onload = setup;

async function setup() {
  showLoadingMessage();
  try {
    const shows = await fetchShows();
    const sortedShows = sortShowsAlphabetically(shows);
    populateShowSelect(sortedShows);
    const firstShowId = sortedShows[0].id;
await loadEpisodesForShow(firstShowId);

    addSearchAndFiltersInputs();
    renderFilteredEpisodes();
  } catch (error) {
    showErrorMessage("Failed to load episodes. Please try again later.");
    console.error(error);
  } finally {
    hideLoadingMessage();
  }
}
async function fetchShows() {
  if (showCache.size > 0) return [...showCache.values()];
  const response = await fetch("https://api.tvmaze.com/shows");
  const shows = await response.json();
  shows.forEach(show => showCache.set(show.id, show));
  return shows;
}
async function loadEpisodesForShow(showId) {
  if (episodeCache.has(showId)) {
    allEpisodes = episodeCache.get(showId);
  } else {
    const response = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
    const episodes = await response.json();
    episodeCache.set(showId, episodes);
    allEpisodes = episodes;
  }
  renderFilteredEpisodes();
}
document.getElementById("show-select").addEventListener("change", async (e) => {
  const selectedShowId = Number(e.target.value);
  await loadEpisodesForShow(selectedShowId);
  resetSearchAndEpisodeSelector();
});
function sortShowsAlphabetically(shows) {
  return shows.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}

function populateShowSelect(shows) {
  const select = document.getElementById("show-select");
  select.innerHTML = "";
  shows.forEach(show => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    select.appendChild(option);
  });
}

function makePageForEpisodes(episodeList) {
const rootElem = document.getElementById("root");
 rootElem.innerHTML = "";

// Episode count display
let countDisplay = document.getElementById("episode-count");
if (!countDisplay) {
  countDisplay = document.createElement("div");
  countDisplay.id = "episode-count";
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
  episodeList.forEach((episode) => {
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
    rootElem.appendChild(episodeCard);
  });
}
function addSearchAndFiltersInputs() {
  const controlsContainer = document.createElement("div");
  controlsContainer.id = "controls-container";

  //  Search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search...";
  searchInput.id = "search-input";
  searchInput.setAttribute("aria-label", "Search episodes");
  controlsContainer.appendChild(searchInput);

    // Episode selector
  const episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-selector";
  episodeSelect.setAttribute("aria-label", "Select an episode");

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Find episodes";
  episodeSelect.appendChild(defaultOption);

  allEpisodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep.id;
    option.textContent = `${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });

  controlsContainer.appendChild(episodeSelect);
  document.body.insertBefore(controlsContainer, document.body.firstChild);

  //  Event listeners
  searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value.toLowerCase();
    episodeSelect.value ="";
    renderFilteredEpisodes();
  });

  episodeSelect.addEventListener("change", () => {
    const selectedId = episodeSelect.value;
    searchInput.value = "";  
    currentSearchTerm = "";

    if (!selectedId) {
      renderFilteredEpisodes();
      return;
    }
    // Filter for just that episode
    const selectedEpisode = allEpisodes.find(ep => ep.id.toString() === selectedId);
    makePageForEpisodes(selectedEpisode ? [selectedEpisode] : []);
  });
}
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
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p  class="error" style="color:red;">${message}</p>`;
}


