async function checkRank() {

  const steamId = document.getElementById("steamIdInput").value;
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");

  const gameNameInput = "csgo";
  const platformInput = "steam"; 


  resultDiv.innerHTML = "";
  errorDiv.innerHTML = "";

  if (!steamId) {
    errorDiv.innerHTML = "Please enter a Steam ID!";
    return;
  }

  try {
    const response = await fetch("/routes/profile/setSteamId", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        steamId: steamId,
        gameName: gameNameInput,
        platform: platformInput,
      }),
    });
    

    if (response.ok) {
      // API'den dönen sonucu al
      const data = await response.json();
      // Rank bilgisini ekrana yazdır
      resultDiv.innerHTML = `Player Rank: ${data.rank || "Unknown"}`;
    } else {
      // API'den bir hata dönerse ekrana yazdır
      const errorData = await response.json();
      errorDiv.innerHTML = `Error: ${errorData.error || "Something went wrong!"}`;
    }
  } catch (error) {
    // İstek sırasında bir hata oluşursa kullanıcıya göster
    console.error("Error fetching rank:", error);
    errorDiv.innerHTML = "Failed to fetch the rank. Please try again later.";
  }
}
