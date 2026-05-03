const API_KEY = "593d6a37a9e918ba728afe3f75f10744";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const form = document.querySelector("#weatherForm");
const cityInput = document.querySelector("#cityInput");
const statusEl = document.querySelector("#status");
const currentWeather = document.querySelector("#currentWeather");
const metrics = document.querySelector("#metrics");
const forecast = document.querySelector("#forecast");
const button = form.querySelector("button");

const locationEl = document.querySelector("#location");
const conditionEl = document.querySelector("#condition");
const updatedAtEl = document.querySelector("#updatedAt");
const weatherIconEl = document.querySelector("#weatherIcon");
const temperatureEl = document.querySelector("#temperature");
const feelsLikeEl = document.querySelector("#feelsLike");
const humidityEl = document.querySelector("#humidity");
const windEl = document.querySelector("#wind");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const cityName = cityInput.value.trim();

    if (!cityName) {
        showStatus("Please enter a city name.", true);
        return;
    }

    await loadWeather(cityName);
});

loadWeather("Hyderabad");

async function loadWeather(cityName) {
    setLoading(true);
    showStatus(`Checking weather for ${cityName}...`);

    try {
        const [weatherData, forecastData] = await Promise.all([
            fetchJson(`${WEATHER_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`),
            fetchJson(`${FORECAST_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&cnt=40`)
        ]);

        renderCurrentWeather(weatherData);
        renderForecast(forecastData);
        showStatus("");
    } catch (error) {
        currentWeather.classList.add("is-hidden");
        metrics.classList.add("is-hidden");
        forecast.innerHTML = "";
        showStatus(error.message || "Unable to load weather right now.", true);
    } finally {
        setLoading(false);
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        const message = data?.message ? sentenceCase(data.message) : "Weather request failed.";
        throw new Error(message);
    }

    return data;
}

function renderCurrentWeather(data) {
    const weather = data.weather?.[0] || {};
    const city = data.name || cityInput.value.trim();
    const country = data.sys?.country ? `, ${data.sys.country}` : "";

    locationEl.textContent = `${city}${country}`;
    conditionEl.textContent = weather.description || "Current weather";
    updatedAtEl.textContent = data.dt ? `Updated ${formatDateTime(data.dt)}` : "";
    weatherIconEl.src = weather.icon ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png` : "";
    weatherIconEl.alt = weather.description || "";
    temperatureEl.textContent = Math.round(data.main.temp);
    feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}\u00b0C`;
    humidityEl.textContent = `${data.main.humidity}%`;
    windEl.textContent = `${Math.round(data.wind.speed * 10) / 10} m/s`;

    currentWeather.classList.remove("is-hidden");
    metrics.classList.remove("is-hidden");
}

function renderForecast(data) {
    const dailyItems = (data.list || [])
        .filter((item) => item.dt_txt?.includes("12:00:00"))
        .slice(0, 5);

    const items = dailyItems.length ? dailyItems : (data.list || []).slice(0, 5);

    forecast.innerHTML = items.map((item) => {
        const weather = item.weather?.[0] || {};
        return `
            <article class="forecast-card">
                <img src="https://openweathermap.org/img/wn/${weather.icon || "01d"}@2x.png" alt="">
                <div>
                    <span>${formatDay(item.dt)}</span>
                    <p>${weather.description || "Forecast"}</p>
                </div>
                <strong>${Math.round(item.main.temp)}&deg;C</strong>
            </article>
        `;
    }).join("");
}

function setLoading(isLoading) {
    button.disabled = isLoading;
    button.querySelector("span").textContent = isLoading ? "Loading" : "Search";
}

function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", isError);
}

function formatDay(timestamp) {
    return new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric"
    }).format(new Date(timestamp * 1000));
}

function formatDateTime(timestamp) {
    return new Intl.DateTimeFormat("en", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit"
    }).format(new Date(timestamp * 1000));
}

function sentenceCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
