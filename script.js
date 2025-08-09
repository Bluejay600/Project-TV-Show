//You can edit ALL of the code here
let allEpisodes = []; // Global so it can be used across functions to store API data.
const rootElem = document.getElementById("root");
const searchInput = document.getElementById("search-input");
const searchCount = document.getElementById("search-count");
const episodeSelect = document.getElementById("episode-select");

function setup() {  
  showLoadingMessage();
  fetch("https://api.tvmaze.com/shows/82/episodes")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      allEpisodes = data;
      hideMessage();
      displayEpisodes(allEpisodes);
      searchCount.textContent = `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;
      // Populate the episode selector with all episodes
      populateEpisodeSelect(allEpisodes);
    })
    .catch((error) => {
      showErrorMessage("Failed to load episodes. Please try again later.");
      console.error(error);
    });
}

function displayEpisodes(episodes) {
  rootElem.innerHTML = ""; // Clear previous content

  episodes.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";
    
    const title = document.createElement("h3");
    title.textContent = `${episode.name} — ${formatEpisodeCode(episode.season, episode.number)}`;

    const image = document.createElement("img");
    image.src = episode.image.medium || "placeholder.jpg"; // optional fallback image

    const summary = document.createElement("div");
    summary.innerHTML = episode.summary|| "No summary available.";

    const link = document.createElement("a");
    link.href = episode.url;
    link.textContent = "View on TVMaze";
    link.target = "_blank";

    
    episodeCard.append(title, image, summary, link);
    rootElem.appendChild(episodeCard);
  });
}
function formatEpisodeCode(season, number) {
  const seasonStr = season.toString().padStart(2, '0');
  const numberStr = number.toString().padStart(2, '0');
  return `S${seasonStr}E${numberStr}`;
}

// === Live Search ===
searchInput.addEventListener("input", function () {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredEpisodes = allEpisodes.filter((episode) => {
    return (
      episode.name.toLowerCase().includes(searchTerm) ||
      episode.summary.toLowerCase().includes(searchTerm)
    );
  });
   displayEpisodes(filteredEpisodes);
  searchCount.textContent = `Showing ${filteredEpisodes.length} / ${allEpisodes.length} episodes`;
});

// === Episode Selector
function populateEpisodeSelect(episodes) {
  episodeSelect.innerHTML = '<option value="all">Show all episodes</option>';
  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `S${String(episode.season).padStart(2, "0")}E${String(
      episode.number
    ).padStart(2, "0")} - ${episode.name}`;
    episodeSelect.appendChild(option);
  });
}
episodeSelect.addEventListener("change", function () {
  const selectedId = episodeSelect.value;

  if (selectedId === "all") {
    displayEpisodes(allEpisodes);
    searchInput.value = ""; // Optional: Clear search input
    searchCount.textContent = `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;
  } else {
    const selectedEpisode = allEpisodes.find(
      (ep) => ep.id.toString() === selectedId
    );
    displayEpisodes([selectedEpisode]);
    searchInput.value = ""; // Clear search when using selector
    searchCount.textContent = `Showing 1 / ${allEpisodes.length} episodes`;
  }
});
// ====== LOADING & ERROR MESSAGES ======
function showLoadingMessage() {
  rootElem.innerHTML = "<p>Loading episodes, please wait...</p>";
}

function showErrorMessage(msg) {
  rootElem.innerHTML = `<p style="color:red;">${msg}</p>`;
}

function hideMessage() {
  rootElem.innerHTML = "";
}
window.onload = setup;
