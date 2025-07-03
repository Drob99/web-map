/**
 * @module auth
 * @description Handles authentication and initial loading of map data.
 */
import { API_CONFIG, state } from "./config.js";
import { getCategories } from "./data/categories.js";
import { getBuildings } from "./data/buildings.js";
import { getFloors } from "./data/floors.js";
import { loadLayerData } from "./data/layers.js";
import { linkElevators, loadRoutes, startRoutes } from "./data/routes.js";
import { layersLevel } from "./layers/layerController.js";
import { loadPoisFloors, showPoisByLevel, switchToCurrentFloor } from "./mapController.js";
import { flyToBuilding } from "./navigation.js";
import { getCurrentTime } from "./utils.js";
import { screensaver } from "./ui.js";

/** Checks if the stored access token is expired. */
export function isAccessTokenExpired() {
  const createdAt = Number(localStorage.getItem("created_at"));
  const expiresIn = Number(localStorage.getItem("expires_in"));
  return getCurrentTime() >= createdAt + expiresIn;
}

/**
 * Authenticates and then loads all map data.
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<string>}
 */
export async function authenticate(clientId, clientSecret) {
  let token = localStorage.getItem("access_token");
  if (!token || isAccessTokenExpired()) {
    localStorage.clear();
    sessionStorage.clear();

    const url = `${API_CONFIG.BASE_URL}saas_companies/KKIA/oauth/token`;
    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "password",
      user_id: "zuhdi@nearmotion.com",
      os: "ios",
      environment: "sandbox",
      push_token: "string",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Authentication failed: ${res.statusText}`);

    const { access_token, refresh_token, expires_in } = await res.json();
    const now = getCurrentTime();

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("created_at", String(now));
    localStorage.setItem("expires_in", String(expires_in));

    token = access_token;
  } else {
    console.log("Access token is still valid.");
  }

  // Make sure state.bearerToken is set before any workers run
  state.bearerToken = token;
  await loadInitialData(token);
  return token;
}

/** Orchestrates fetching categories, buildings, floors, layers, POIs, and routes. */
async function loadInitialData(token) {
  const startTime = performance.now();

  await getCategories(token);
  logDuration("Categories fetched", startTime);

  // Buildings
  await fetchAndCache(
    "state.buildings",
    () => getBuildings(token),
    data => {
      state.buildingsObject = data;
      flyToBuilding();
    }
  );
  logDuration("Buildings fetched", startTime);

  // Floors
  await fetchAndCache(
    "state.floors",
    () => getFloors(),
    data => {
      state.floorsObjects = data;
    }
  );
  logDuration("Floors fetched", startTime);

  // Layers
await fetchAndCache(
  "state.layers",
  () => loadLayerData(),
  async data => {
    state.layersObjects = data;

    // Step 1: Convert "G" to "0" temporarily for sorting
    const normalized = data.map(obj => ({
      ...obj,
      building_floor: {
        ...obj.building_floor,
        name: obj.building_floor.name === "G" ? "0" : obj.building_floor.name
      }
    }));

    // Step 2: Sort floors descending by numeric floor name
    const sorted = normalized
      .slice()
      .sort((a, b) =>
        parseInt(b.building_floor.name) - parseInt(a.building_floor.name)
      );

    // Step 3: Restore "0" back to "G" after sorting
    const restored = sorted.map(obj => ({
      ...obj,
      building_floor: {
        ...obj.building_floor,
        name: obj.building_floor.name === "0" ? "G" : obj.building_floor.name
      }
    }));

    await layersLevel(restored);
    switchToCurrentFloor();
  }
);

logDuration("Layers fetched", startTime);

  // POIs & Routes
  await loadPoisAndRoutes(startTime);
}

/**
 * Loads POIs, routes, then links elevators.
 * @param {number} startTime
 */
async function loadPoisAndRoutes(startTime) {
  // POIs (uses state.layersObjects populated above)
  await loadPoisFloors(state.layersObjects);
  logDuration("POIs fetched", startTime);
  showPoisByLevel();

  await loadRoutes();
  logDuration("Routes fetched", startTime);

  await startRoutes();
  logDuration("Routes processed", startTime);

  linkElevators();
  logDuration("Elevators linked", startTime);
  // Hide the splash screen.
  screensaver();
}

/**
 * Generic cache helper: expects fetchFn → { data, isFetched }.
 * @param {string} key
 * @param {Function} fetchFn
 * @param {Function|null} postFetch
 */
async function fetchAndCache(key, fetchFn, postFetch) {
  if (!sessionStorage.getItem(key)) {
    const { data, isFetched } = await fetchFn();
    if (isFetched) {
      sessionStorage.setItem(key, JSON.stringify(data));
      if (postFetch) await postFetch(data);
    }
  } else if (postFetch) {
    const data = JSON.parse(sessionStorage.getItem(key));
    await postFetch(data);
  }
}

/** Logs elapsed time. */
function logDuration(message, startTime) {
  console.log(`${message}: ${Math.round(performance.now() - startTime)}ms`);
}