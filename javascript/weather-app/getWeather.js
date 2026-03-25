const BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";

/**
 * Fetches weather data for the given location.
 * Returns the parsed JSON object, or throws an Error on failure.
 * @param {string} location - City name or coordinates
 * @returns {Promise<Object>}
 */
async function getWeather(location) {
  const encodedLocation = encodeURIComponent(location.trim());
  const url = `${BASE_URL}${encodedLocation}?unitGroup=us&key=${API_KEY}&contentType=json`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(`City "${location}" not found. Please check the spelling and try again.`);
    }
    if (response.status === 401) {
      throw new Error("Invalid API key. Please update your config.js file.");
    }
    throw new Error(`API error (${response.status}). Please try again later.`);
  }

  return response.json();
}
