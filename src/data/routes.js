/**
 * @module routes
 * @description Graph construction, route fetching, and pathfinding utilities.
 */
import { API_CONFIG, state } from "../config.js";
import { getDistanceFromLatLonInKm } from "../utils.js";
import {
  addFromToMarkers,
  elevatorGuide,
  enterNavigationMode,
  routeLevel,
  switchFloorByNo
} from "../mapController.js";
import { initializeAnimation, initializeArrowsSourceAndLayer, startAnimation, stopAnimation, setupArrowAnimation } from "../animation/arrowAnimation.js";
import { map } from "../mapInit.js";
import { updateJourneyInfo } from "../mapController.js";
import { playbackControls } from "../navigation/navigationPlaybackControls.js";


/**
 * Simple directed graph using an adjacency list.
 */
class Graph {
  constructor() {
    this.neighbors = {};
  }

  /**
   * Adds a directed edge from u to v.
   * @param {string} u - Source node key.
   * @param {string} v - Destination node key.
   */
  addEdge(u, v) {
    if (!this.neighbors[u]) this.neighbors[u] = [];
    this.neighbors[u].push(v);
  }
}

/**
 * Global graph instance for routing.
 */
export let graph = new Graph();

/**
 * Computes the shortest path between source and target using BFS.
 * @param {string} source - Starting node key.
 * @param {string} target - Destination node key.
 * @returns {Array<string>} Sequence of node keys from source to target.
 */
export function shortestPath(source, target) {
  const queue = [source];
  const visited = { [source]: true };
  const predecessor = {};
  let index = 0;

  while (index < queue.length) {
    const u = queue[index++];
    const neighbors = graph.neighbors[u] || [];
    for (const v of neighbors) {
      if (visited[v]) continue;
      visited[v] = true;
      predecessor[v] = u;
      if (v === target) {
        const path = [v];
        let curr = u;
        while (curr !== source) {
          path.push(curr);
          curr = predecessor[curr];
        }
        path.push(source);
        return path.reverse();
      }
      queue.push(v);
    }
  }
  return [];
}

/**
 * Fetches route data for all floors via parallel requests.
 * @returns {Promise<boolean>} Resolves true when all floor routes are fetched.
 */
export async function loadRoutes() {
  const promises = state.floorsObjects.flatMap((floorGroup) =>
    (floorGroup.building_floors || []).map((floor) =>
      getRoutes(state.bearerToken, floor.id)
    )
  );
  await Promise.all(promises);
  return true;
}

/**
 * Fetches and stores route data for a single floor.
 * @param {string} token - OAuth bearer token.
 * @param {string|number} floorId - Floor identifier.
 * @returns {Promise<boolean>} Resolves true on success.
 */
export async function getRoutes(token, floorId) {
  const url = `${API_CONFIG.BASE_URL}floors/${floorId}/route`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch route for floor ${floorId}`);
  const data = await response.json();
  state.routeBuildings[floorId] = [data];
  return true;
}

/**
 * Builds the global routing graph and elevator lists from fetched data.
 * @returns {Promise<boolean>} Resolves true when graph construction completes.
 */
export async function startRoutes() {
  graph = new Graph();
  state.elevators = [];
  state.elevatorsCount = 0;

  for (const [floorId, routes] of Object.entries(state.routeBuildings)) {
    const level = state.levelArray[floorId];
    for (const routeObj of routes[0]?.building_route_points || []) {
      const key = routeObj.point_id;
      const lng = routeObj.longitude;
      const lat = routeObj.latitude;
      // Store coordinate and kind
      state.routesArray[key] = `${lng},${lat},${level},${routeObj.kind}`;

      // Record elevator nodes
      if (routeObj.kind === "elevator") {
        state.elevators.push({ key, lng, lat, zlevel: level });
        state.elevatorsCount++;
      }

      // Add graph edges
      for (const nbr of routeObj.neighbors || []) {
        graph.addEdge(key, nbr);
      }
    }
  }

  return (state.routeEnabled = false);
}

/**
 * Links elevator nodes within 10 meters via graph edges.
 */
export function linkElevators() {
  const { elevators, elevatorsCount } = state;
  for (let i = 0; i < elevatorsCount; i++) {
    for (let j = 0; j < elevatorsCount; j++) {
      const e1 = elevators[i];
      const e2 = elevators[j];
      if (getDistanceFromLatLonInKm(e1.lat, e1.lng, e2.lat, e2.lng) < 10) {
        graph.addEdge(e1.key, e2.key);
      }
    }
  }
  return true;
}

/**
 * Draws the computed path on the map, updates state, and triggers UI elements.
 * @param {string} fromName - Name of the start location.
 * @param {number} fromLng - Start longitude.
 * @param {number} fromLat - Start latitude.
 * @param {number} fromLevel - Start floor level.
 * @param {string} toName - Name of the destination.
 * @param {number} toLng - End longitude.
 * @param {number} toLat - End latitude.
 * @param {number} toLevel - End floor level.
 */
export function drawPathToPoi(
  fromName,
  fromLng,
  fromLat,
  fromLevel,
  toName,
  toLng,
  toLat,
  toLevel
) {
  // Clear existing route
  if (typeof clearRoute === "function") clearRoute();
  else removeRouteLayer();

  // Initialize GeoJSON and state
  state.routeEnabled = true;
  state.levelRoutePoi = fromLevel.toString();
  switchFloorByNo(fromLevel);
  state.fullPathRoute = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { level: fromLevel },
        geometry: { type: "LineString", coordinates: [] },
      },
    ],
  };
  state.routeArray = [];

  // Determine closest start/end nodes
  let startKey = null,
    endKey = null;
  let minFrom = Infinity,
    minTo = Infinity;
  for (const [key, val] of Object.entries(state.routesArray)) {
    const [lng, lat, lvl] = val.split(",").map(Number);
    const dFrom = getDistanceFromLatLonInKm(lat, lng, fromLat, fromLng);
    const dTo = getDistanceFromLatLonInKm(lat, lng, toLat, toLng);
    if (lvl === fromLevel && dFrom < minFrom) {
      minFrom = dFrom;
      startKey = key;
    }
    if (lvl === toLevel && dTo < minTo) {
      minTo = dTo;
      endKey = key;
    }
  }
  state.globalStartKey = startKey;
  state.globalEndKey = endKey;

  // Compute shortest path and build coordinates
  const path = shortestPath(startKey, endKey);
  state.routeArray = path;
  let prevCoord = null,
    fullDist = 0;
  path.forEach((id) => {
    const [lng, lat] = state.routesArray[id].split(",").map(Number);
    const coord = [lng, lat];
    if (prevCoord) {
      fullDist += getDistanceFromLatLonInKm(
        prevCoord[1],
        prevCoord[0],
        lat,
        lng
      );
    }
    prevCoord = coord;
    state.fullPathRoute.features[0].geometry.coordinates.push(coord);
  });

  // Update distance/time globals
  state.fullDistanceToDestination = fullDist;
  state.fullTimeToDestination = fullDist / 74;
  state.globalName = toName;
  state.globalDistance = Math.floor(fullDist);
  state.globalTime = state.fullTimeToDestination;
  state.globalZLevel = toLevel;

  // Place markers and guide
  state.fromMarkerLocation = [fromLng, fromLat];
  state.toMarkerLocation = [toLng, toLat];
  state.fromMarkerLevel = fromLevel;
  state.toMarkerLevel = toLevel;
  elevatorGuide();
  addFromToMarkers(
    state.fromMarkerLocation,
    state.toMarkerLocation,
    state.fromMarkerLevel,
    state.toMarkerLevel
  );
  updateJourneyInfo(
    state.globalName,
    state.globalDistance,
    state.globalTime,
    state.globalZLevel
  );
  // Render per-floor route and camera
  routeLevel();
  enterNavigationMode(state.fullPathRoute);

  // Animate arrows
  setTimeout(() => {
    initializeArrowsSourceAndLayer(map);
    setupArrowAnimation(); // This creates the worker if needed
    startAnimation(); // This will check if route exists before initializing
  }, 100);

  // Add play button to navigation panel after route is drawn
  setTimeout(() => {
    try {
      const directionsPanel = document.querySelector(".directions-panel");

      // Validate that we have a directions panel and no existing button
      if (!directionsPanel) {
        console.warn("Directions panel not found, cannot add play button");
        return;
      }

      if (document.getElementById("play-route-btn")) {
        console.log("Play route button already exists");
        return;
      }

      // Create the play button with proper accessibility attributes
      const playButton = createPlayRouteButton();

      if (!playButton) {
        console.error("Failed to create play route button");
        return;
      }

      // Add event listener with proper error handling
      playButton.addEventListener("click", handlePlayButtonClick);

      // Insert the button in the appropriate location
      insertPlayButtonIntoPanel(playButton, directionsPanel);

      console.log("Play route button added successfully");
    } catch (error) {
      console.error("Error adding play route button:", error);
    }
  }, 500);

  /**
   * Create the play route button element
   * @returns {HTMLElement|null} The created button element or null if failed
   */
  function createPlayRouteButton() {
    try {
      const playButton = document.createElement("button");
      playButton.id = "play-route-btn";
      playButton.className = "play-route-button";
      playButton.innerHTML =
        '<i class="fas fa-play" aria-hidden="true"></i> Play Route';

      // Enhanced styling with CSS custom properties for better maintainability
      playButton.style.cssText = `
      width: 100%;
      padding: 12px;
      margin: 15px 0;
      background: var(--primary-color, #007AFF);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

      // Add hover and focus states for better UX
      playButton.addEventListener("mouseenter", () => {
        playButton.style.backgroundColor =
          "var(--primary-color-hover, #0056CC)";
        playButton.style.transform = "translateY(-1px)";
        playButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
      });

      playButton.addEventListener("mouseleave", () => {
        playButton.style.backgroundColor = "var(--primary-color, #007AFF)";
        playButton.style.transform = "translateY(0)";
        playButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
      });

      // Add accessibility attributes
      playButton.setAttribute("aria-label", "Start navigation route playback");
      playButton.setAttribute(
        "title",
        "Play an animated preview of your route"
      );

      return playButton;
    } catch (error) {
      console.error("Error creating play button:", error);
      return null;
    }
  }

  /**
   * Handle play button click with comprehensive error handling
   * Implements the Command pattern with proper error recovery
   */
  function handlePlayButtonClick() {
    try {
      console.log("Play route button clicked");

      // Validate that we have the necessary dependencies
      if (typeof playbackControls === "undefined") {
        throw new Error("playbackControls is not available");
      }

      // Check if playback controls are properly imported
      if (!playbackControls || typeof playbackControls.show !== "function") {
        throw new Error("playbackControls.show method is not available");
      }

      // Attempt to show the playback controls
      const success = playbackControls.show();

      if (!success) {
        throw new Error("Failed to show playback controls");
      }

      console.log("Playback controls shown successfully");
    } catch (error) {
      console.error("Error handling play button click:", error);

      // Provide user feedback about the error
      showUserFeedback(
        "Unable to start route playback. Please try again or refresh the page.",
        "error"
      );

      // Attempt recovery by ensuring initialization
      attemptPlaybackRecovery();
    }
  }

  /**
   * Insert the play button into the directions panel at the appropriate location
   * @param {HTMLElement} playButton - The button element to insert
   * @param {HTMLElement} directionsPanel - The parent panel
   */
  function insertPlayButtonIntoPanel(playButton, directionsPanel) {
    try {
      // Try to insert after route summary if it exists
      const routeSummary = document.getElementById("routeSummary");

      if (routeSummary && routeSummary.parentNode) {
        routeSummary.parentNode.insertBefore(
          playButton,
          routeSummary.nextSibling
        );
        console.log("Play button inserted after route summary");
      } else {
        // Fallback: append to the end of directions panel
        directionsPanel.appendChild(playButton);
        console.log("Play button appended to directions panel");
      }
    } catch (error) {
      console.error("Error inserting play button:", error);
      // Last resort: try to append to directions panel
      try {
        directionsPanel.appendChild(playButton);
      } catch (fallbackError) {
        console.error("Fallback insertion also failed:", fallbackError);
      }
    }
  }

  /**
   * Show feedback to the user
   * @param {string} message - Message to display
   * @param {string} type - Type of message ('error', 'warning', 'info')
   */
  function showUserFeedback(message, type = "info") {
    try {
      // You can customize this based on your app's notification system
      // For now, we'll use a simple alert, but you could use toast notifications

      if (type === "error") {
        console.error(`User Feedback (${type}):`, message);
        alert(message); // Replace with your preferred notification system
      } else {
        console.log(`User Feedback (${type}):`, message);
      }
    } catch (error) {
      console.error("Error showing user feedback:", error);
    }
  }

  /**
   * Attempt to recover from playback initialization failures
   * Implements the Recovery pattern for error handling
   */
  function attemptPlaybackRecovery() {
    try {
      console.log("Attempting playback recovery...");

      // Check if playbackControls exists but isn't initialized
      if (playbackControls && typeof playbackControls.init === "function") {
        console.log("Attempting to re-initialize playback controls...");

        const initSuccess = playbackControls.init();

        if (initSuccess) {
          console.log("Playback controls re-initialized successfully");
          showUserFeedback(
            "Route playback is now available. Please try again.",
            "info"
          );
        } else {
          console.error("Re-initialization failed");
          showUserFeedback(
            "Route playback initialization failed. Please refresh the page.",
            "error"
          );
        }
      } else {
        console.error("playbackControls.init method not available");
        showUserFeedback(
          "Route playback is not available. Please refresh the page.",
          "error"
        );
      }
    } catch (error) {
      console.error("Recovery attempt failed:", error);
      showUserFeedback(
        "Unable to recover route playback. Please refresh the page.",
        "error"
      );
    }
  }

  /**
   * Validation function to check if route data is available
   * @returns {boolean} true if route data is valid
   */
  function validateRouteData() {
    try {
      // Check if we have the necessary route data
      if (!state.fullPathRoute?.features?.length) {
        console.warn("No route data available for playback");
        return false;
      }

      if (!state.fullPathRoute.features[0]?.geometry?.coordinates?.length) {
        console.warn("No route coordinates available for playback");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating route data:", error);
      return false;
    }
  }
}
