let currentUnit = "C"; // "C" | "F"
let lastWeatherData = null;

const searchForm = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");
const loader = document.getElementById("loader");
const errorMsg = document.getElementById("errorMsg");
const results = document.getElementById("results");
const btnCelsius = document.getElementById("btnCelsius");
const btnFahrenheit = document.getElementById("btnFahrenheit");

function toCelsius(f) {
  return ((f - 32) * 5) / 9;
}

function formatTemp(fahrenheit) {
  if (currentUnit === "C") {
    return `${Math.round(toCelsius(fahrenheit))}°C`;
  }
  return `${Math.round(fahrenheit)}°F`;
}

// Thanks to IA
function iconEmoji(icon) {
  const map = {
    "clear-day": "☀️",
    "clear-night": "🌙",
    "cloudy": "☁️",
    "fog": "🌫️",
    "hail": "🌨️",
    "partly-cloudy-day": "⛅",
    "partly-cloudy-night": "🌤️",
    "rain": "🌧️",
    "rain-snow": "🌨️",
    "rain-snow-showers-day": "🌧️",
    "rain-snow-showers-night": "🌧️",
    "showers-day": "🌦️",
    "showers-night": "🌦️",
    "sleet": "🌨️",
    "snow": "❄️",
    "snow-showers-day": "🌨️",
    "snow-showers-night": "🌨️",
    "thunder": "⛈️",
    "thunder-rain": "⛈️",
    "thunder-showers-day": "⛈️",
    "thunder-showers-night": "⛈️",
    "wind": "💨",
  };
  return map[icon] || "🌡️";
}

function weekdayLabel(datetimeStr) {
  // "YYYY-MM-DD" from the API
  const [y, m, d] = datetimeStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function setVisibility({ showLoader = false, showError = false, showResults = false } = {}) {
  loader.classList.toggle("hidden", !showLoader);
  errorMsg.classList.toggle("hidden", !showError);
  results.classList.toggle("hidden", !showResults);
}

function getCityName(resolvedAddress) {
  return resolvedAddress.split(",")[0].trim();
}

function buildCurrentCard(data) {
  const today = data.days[0];
  const city = getCityName(data.resolvedAddress);

  return `
    <div class="current-card">
      <div>
        <div class="current-card__location">${city}</div>
        <div class="current-card__resolved">${data.resolvedAddress}</div>
        <div class="current-card__date">${weekdayLabel(today.datetime)}</div>
        <div class="current-card__description">${today.description}</div>
      </div>

      <div>
        <div class="current-card__icon">${iconEmoji(today.icon)}</div>
        <div class="current-card__temp">${formatTemp(today.temp)}</div>
      </div>

      <div class="current-card__stats">
        <div class="stat"><span class="stat__label">Feels Like</span><span class="stat__value">${formatTemp(today.feelslike)}</span></div>
        <div class="stat"><span class="stat__label">High / Low</span><span class="stat__value">${formatTemp(today.tempmax)} / ${formatTemp(today.tempmin)}</span></div>
        <div class="stat"><span class="stat__label">Humidity</span><span class="stat__value">${Math.round(today.humidity)}%</span></div>
        <div class="stat"><span class="stat__label">Wind</span><span class="stat__value">${Math.round(today.windspeed)} km/h</span></div>
        <div class="stat"><span class="stat__label">UV Index</span><span class="stat__value">${today.uvindex}</span></div>
        <div class="stat"><span class="stat__label">Visibility</span><span class="stat__value">${today.visibility} km</span></div>
        <div class="stat"><span class="stat__label">Sunrise</span><span class="stat__value">${today.sunrise.slice(0, 5)}</span></div>
        <div class="stat"><span class="stat__label">Sunset</span><span class="stat__value">${today.sunset.slice(0, 5)}</span></div>
      </div>
    </div>
  `;
}

function buildForecastGrid(days) {
  const cards = days.map(day => `
    <div class="forecast-card">
      <div class="forecast-card__day">${weekdayLabel(day.datetime)}</div>
      <div class="forecast-card__icon">${iconEmoji(day.icon)}</div>
      <div class="forecast-card__max">${formatTemp(day.tempmax)}</div>
      <div class="forecast-card__min">${formatTemp(day.tempmin)}</div>
    </div>
  `).join("");

  return `
    <p class="forecast-title">7-Day Forecast</p>
    <div class="forecast-grid">${cards}</div>
  `;
}

function render(data) {
  const nextDays = data.days.slice(1, 8);
  results.innerHTML = buildCurrentCard(data) + buildForecastGrid(nextDays);
  setVisibility({ showResults: true });
}

async function handleSearch(event) {
  event.preventDefault();

  const location = locationInput.value.trim();
  if (!location) {
    errorMsg.textContent = "Please enter a city name before searching.";
    setVisibility({ showError: true });
    return;
  }

  setVisibility({ showLoader: true });

  try {
    const data = await getWeather(location);
    lastWeatherData = data;
    render(data);
  } catch (err) {
    errorMsg.textContent = err.message;
    setVisibility({ showError: true });
  }
}

function handleUnitToggle(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;

  btnCelsius.classList.toggle("unit-toggle__btn--active", unit === "C");
  btnFahrenheit.classList.toggle("unit-toggle__btn--active", unit === "F");

  if (lastWeatherData) {
    render(lastWeatherData);
  }
}


searchForm.addEventListener("submit", handleSearch);
btnCelsius.addEventListener("click", () => handleUnitToggle("C"));
btnFahrenheit.addEventListener("click", () => handleUnitToggle("F"));