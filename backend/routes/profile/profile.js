import express from "express";
import { getFromSteam } from "./profile_information_providers/steam_informations.js";
//import { getFromTrackerGG } from "./profile_information_providers/trackergg_informations.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Profile");
});

router.post("/setSteamId", (req, res) => {
    const { steamId, gameName, platform } = req.body; 
  

    console.log( req.body);
    if (!steamId || !gameName || !platform) {
      return res.status(400).json({ error: "Please enter steamID, game name and platform." });
    }
  
    req.session.user = { steamId, gameName, platform };
  
    res.json({ message: "User informations are successfully updated." });

  });
  
  router.get("/getSessionInfo", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "No session data found. Please login first." });
    }
  
    res.json({
      message: "Session data retrieved successfully!",
      sessionData: req.session.user,
    });
  });  
  
router.get("/details", async (req, res) => {
    try {
      const userSession = req.session.user; 
      if (!userSession || !userSession.steamId) {
        return res.status(401).json({ error: "Error with user session!" });
      }
  
      const steamId = userSession.steamId;
      const { gameName, platform } = req.query;
  
      if (!gameName || !platform) {
        return res.status(400).json({
          error: "gameName and platform are required!",
        });
      }
  
      const [steamData, trackerData] = await Promise.all([
        getFromSteam(steamId),
        getFromTrackerGG(gameName, platform),
      ]);
  
      const combinedData = { steam: steamData, tracker: trackerData };
      res.json(combinedData);
    } catch (error) {
        console.error("Error occured during the providing profile informations!", error);
        res.status(500).json({ error: "Error occured during the providing profile informations!" });
    }
  });
  

export default router;
