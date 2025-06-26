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
} from "../mapController.js";
import { setupArrowAnimation, initializeArrowsSourceAndLayer, startAnimation, stopAnimation } from "../animation/arrowAnimation.js";
import { map } from "../mapInit.js";

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

  return (state.routeEnabled = true);
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
  state.levelRoutePoi = fromLevel;
  state.fullPathRoute = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {level: fromLevel},
        geometry: { type: "LineString", coordinates: [] }
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

  // Render per-floor route and camera
  routeLevel();
  enterNavigationMode(state.fullPathRoute);

  // Animate arrows
  initializeArrowsSourceAndLayer(map);
  setupArrowAnimation();
  startAnimation();
}
