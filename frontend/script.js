async function checkRank() {
  const steamId = document.getElementById("steamIdInput").value;
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");

  // Önceki sonuçları temizle
  resultDiv.textContent = "";
  errorDiv.textContent = "";

  if (!steamId) {
    errorDiv.textContent = "Please enter a Steam ID.";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3001/get_rank?steam_id=${steamId}`);
    if (response.ok) {
      const data = await response.json();
      resultDiv.textContent = `Rank: ${data.rank}`;
    } else {
      const errorData = await response.json();
      errorDiv.textContent = errorData.error || "Player not found.";
    }
  } catch (error) {
    errorDiv.textContent = "An error occurred while fetching the data.";
  }
}

async function fetchSteamStats() {
  const steamId = document.getElementById("steamIdInput").value;
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");

  resultDiv.textContent = "";
  errorDiv.textContent = "";

  if (!steamId) {
      errorDiv.textContent = "Please enter a Steam ID.";
      return;
  }

  try {
      const response = await fetch(`http://localhost:3001/get_steam_stats?steam_id=${steamId}`);
      if (response.ok) {
          const data = await response.json();

          // İstatistikleri ekranda göster
          resultDiv.innerHTML = `
              <p><strong>Game:</strong> ${data.gameName}</p>
              <p><strong>Steam ID:</strong> ${data.steamID}</p>
              <h3>Stats:</h3>
              <ul>
                  ${data.stats.map(stat => `<li>${stat.name}: ${stat.value}</li>`).join("")}
              </ul>
              <h3>Achievements:</h3>
              <ul>
                  ${data.achievements.map(ach => `<li>${ach.name}: ${ach.achieved ? "Yes" : "No"}</li>`).join("")}
              </ul>
          `;
      } else {
          const errorData = await response.json();
          errorDiv.textContent = errorData.error || "Failed to fetch stats.";
      }
  } catch (error) {
      console.error(error);
      errorDiv.textContent = "An error occurred while fetching the stats.";
  }
}

