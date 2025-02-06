import express from "express";
import fetch from "node-fetch"; // Fetch kullanımı için
const api_key = process.env.RIOT_APIKEY;

const router = express.Router();

// Riot credentials to get users' PUID
router.post("/riot_credentials", async (req, res) => {
  const { gameName, tagLine } = req.body;

  if (!gameName || !tagLine) {
    return res.status(400).json({ error: "Game name and tag must be entered!" });
  }

  try {
    const puidData = await findPUID(gameName, tagLine);
    res.status(200).json(puidData);
  } catch (error) {
    console.error("PUID API Error:", error);
    res.status(500).json({ error: "There is a problem with the PUID API." });
  }
});

// PUID bulmak için fonksiyon
async function findPUID(gameName, tagLine) {
  const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${api_key}`;

  console.log(url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
}

export default router;
