/* import fetch from "node-fetch"; 

export async function getFromTrackerGG(gameName, platform) {
  try {
    const trackerApiKey = process.env.TRACKERGG_API;

    const url = `https://public-api.tracker.gg/v2/${gameName}/standard/profile/${platform}/${steam_ID}`;
    
    const response = await fetch(url, {
      headers: {
        "TRN-Api-Key": process.env.TRACKERGG_API,
      },
    });
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Failed a proccess while trying to reach user informations via TrackerGG!", error);
    throw error;
  }
}

export default router; */