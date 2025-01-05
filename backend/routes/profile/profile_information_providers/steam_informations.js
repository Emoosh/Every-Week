import fetch from "node-fetch";

const steamCS2AppID = 730; 
const STEAM_API_KEY = process.env.STEAM_API_KEY;

/**
 * 
 * @param {string} steamId
 * @returns {Object} 
 */

export async function getFromSteam(steamId) {
  if (!steamId) {
    throw new Error("Steam ID is required.");
  }

  const url = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${steamCS2AppID}&key=${STEAM_API_KEY}&steamid=${steamId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Steam API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Steam API Error:", error);
    throw error;
  }
}

