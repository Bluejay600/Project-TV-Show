//You can edit ALL of the code here
let allEpisodes = [];
let currentSearchTerm = "";

async function setup() {
  showLoadingMessage();
  try {
    const response = await fetch("https://api.tvmaze.com/shows/82/episodes");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    allEpisodes = await response.json();

    hideLoadingMessage();
    addSearchAndFiltersInputs();
    renderFilteredEpisodes();
  } catch (error) {
    showErrorMessage("Failed to load episodes. Please try again later.");
    console.error(error);
  }
}

function makePageForEpisodes(episodeList) {
 const rootElem = document.getElementById("root");
 rootElem.innerHTML = "";

let countDisplay = document.getElementById("episode-count");
if (!countDisplay) {
  countDisplay = document.createElement("div");
  countDisplay.id = "episode-count";
  document.body.insertBefore(countDisplay, rootElem);
}
countDisplay.textContent = `Displaying ${episodeList.length} / ${allEpisodes.length} episodes`;

  if (episodeList.length === 0) {
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "Oops no match found!!!";
    rootElem.appendChild(message);
    return;
  }

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";
    episodeCard.id = `episode-${episode.id}`;

    const title = document.createElement("h3");
    title.textContent = `${episode.name} — ${formatEpisodeCode(episode.season, episode.number)}`;

    const image = document.createElement("img");
    image.src = episode.image?.medium || "";
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
  controlsContainer.appendChild(searchInput);

    // Episode selector
  const episodeSelect = document.createElement("select");
  episodeSelect.id = "episode-selector";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Episode";
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
    searchInput.value = "";  currentSearchTerm = "";
    if (!selectedId) {
      renderFilteredEpisodes();
      return;
    }
    // Filter for just that episode
    const selectedEpisode = allEpisodes.find(ep => ep.id.toString() === selectedId);
    makePageForEpisodes(selectedEpisode ? [selectedEpisode] : []);
  });
}

function formatEpisodeCode(season, number) {
  const seasonStr = season.toString().padStart(2, '0');
  const numberStr = number.toString().padStart(2, '0');
  return `S${seasonStr}E${numberStr}`;
}

window.onload = setup;


