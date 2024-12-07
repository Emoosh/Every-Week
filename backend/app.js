import express from "express";
import cors from "cors";
import fetch from "node-fetch"; 
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";


dotenv.config();

const app = express();
const PORT = 3001;
const STEAM_API_KEY = process.env.STEAM_API_KEY; 

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));


app.get("/", (req, res) => {
  const location = path.join(__dirname, "../frontend/index.html");
  res.sendFile(location);
});

app.get("/get_rank", async (req, res) => {

    const steamCS2AppID = 730;
    const steamId = req.query.steam_id;

  if (!steamId) {
    return res.status(400).json({ error: "Steam ID is required" });
  }
  const validationSteamApiRequest = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${steamCS2AppID}&key=${STEAM_API_KEY}&steamid=${steamId}`

  console.log(validationSteamApiRequest);
  try {
    const response = await fetch(
      `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${steamCS2AppID}&key=${STEAM_API_KEY}&steamid=${steamId}`
    );
    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to fetch Steam stats." });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
