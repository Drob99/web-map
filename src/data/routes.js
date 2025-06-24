import { API_BASE, state } from "../config.js";
import { getDistanceFromLatLonInKm } from "../utils.js";
import { map } from "../mapInit.js";
import {
  extractLngLat,
  addFromToMarkers,
  elevator_guide,
  Route_level,
  enter_into_nvgation_mode,
  ClearRoute,
  remove_route_layer,
} from "../mapController.js";
import { setupArrowAnimation } from "../animation/arrowAnimation.js";

export let graph;
export let routeEnabled = false;

/**
 * Build a simple adjacency list.
 */
export function shortestPath(source, target) {
  const queue = [source];
  const visited = { [source]: true };
  const predecessor = {};
  let tail = 0;

  while (tail < queue.length) {
    const u = queue[tail++];
    const nbrs = graph.neighbors[u] || [];
    for (const v of nbrs) {
      if (visited[v]) continue;
      visited[v] = true;
      if (v === target) {
        const path = [v];
        let cur = u;
        while (cur !== source) {
          path.push(cur);
          cur = predecessor[cur];
        }
        path.push(source);
        return path.reverse();
      }
      predecessor[v] = u;
      queue.push(v);
    }
  }
  return [];
}

/**
 * Fetch raw route JSON for each floor
 */
export async function load_routes() {
  const promises = state.floors_objects.flatMap((floor) =>
    floor.building_floors.map((f) => get_routes(state.Bearer_token, f.id))
  );
  await Promise.all(promises);
  return true;
}

async function process_route_point(routePoint, wayPoint_level) {
  return new Promise((resolve, reject) => {
    try {
      state.Routes_array[
        routePoint.point_id
      ] = `${routePoint.longitude},${routePoint.latitude},${wayPoint_level},${routePoint.kind}`;

      if (routePoint.kind === "elevator") {
        state.elevators.push({
          key: routePoint.point_id,
          lng: routePoint.longitude,
          lat: routePoint.latitude,
          zlevel: wayPoint_level,
        });
        state.elevatorsCount++;
      }

      for (const neighborKey of routePoint.neighbors) {
        graph.addEdge(routePoint.point_id, neighborKey);
      }
      resolve();
    } catch (error) {
      reject(`Error processing route point: ${error.message}`);
    }
  });
}

function Graph() {
  this.neighbors = {};
  this.addEdge = (u, v) => {
    if (!this.neighbors[u]) this.neighbors[u] = [];
    this.neighbors[u].push(v);
  };
  return this;
}

/**
 * Process every point into the global graph, neighbor map, elevator list, etc.
 */
export async function start_routes() {
  graph = new Graph();
  state.elevators = [];
  state.elevatorsCount = 0;

  for (const key in state.Route_buildings) {
    const arr = state.Route_buildings[key];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const points = arr[0].building_route_points || [];
    const level = state.level_array[key];
    for (const pt of points) {
      await process_route_point(pt, level);
    }
  }

  routeEnabled = true;
  return true;
}

/**
 * Fetch single floor’s route
 */
export function get_routes(token, floorId) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE}floors/${floorId}/route`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("accept", "application/json");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const obj = JSON.parse(xhr.responseText);
        state.Route_buildings[floorId] = [obj];
        resolve(true);
      } else reject(xhr.statusText);
    };
    xhr.onerror = () => reject("Network error");
    xhr.send();
  });
}

/**
 * Link up elevator points if they’re within 10m.
 */
export function link_elevators() {
  // exactly loop 0..elevatorsCount-1 twice
  for (let e = 0; e < state.elevatorsCount; e++) {
    for (let t = 0; t < state.elevatorsCount; t++) {
      const ea = state.elevators[e];
      const eb = state.elevators[t];
      const o = parseFloat(ea.lat),
        a = parseFloat(ea.lng),
        r = parseFloat(eb.lat),
        i = parseFloat(eb.lng);

      // within 10 meters?
      if (getDistanceFromLatLonInKm(o, a, r, i) < 10) {
        const l = ea.key,
          s = eb.key;
        // ensure the adjacency list bucket exists
        if (!graph.neighbors[l]) {
          graph.neighbors[l] = [];
        }
        graph.neighbors[l].push(s);
      }
    }
  }
}


/**
 * Given the global graph & route array, draw the path & compute stats.
 */
export function draw_path_to_poi(
  from_name,
  from_lng_,
  from_lat_,
  from_zlevel_,
  to_name,
  to_lng_,
  to_lat_,
  to_zlevel_
) {
  try {
    // ─── Clear any existing route/artifacts ──────────────────────────
    if (typeof ClearRoute === "function") ClearRoute();
    else if (typeof remove_route_layer === "function") remove_route_layer();

    // ─── Initialize state & GeoJSON ────────────────────────────────
    state.routeEnabled = true;
    state.Full_path_route = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      ],
    };
    state.route_array = [];

    // ─── Aliases & current floor ──────────────────────────────────
    const [from_lng, from_lat, from_lvl] = [from_lng_, from_lat_, from_zlevel_];
    const [to_lng, to_lat, to_lvl] = [to_lng_, to_lat_, to_zlevel_];
    state.Level_route_poi = from_lvl;

    // ─── Find closest start/end nodes ─────────────────────────────
    let start_key = null,
      end_key = null;
    let minFrom = Infinity,
      minTo = Infinity;
    for (const key in state.Routes_array) {
      const [lng, lat, lvl] = state.Routes_array[key].split(",");
      const dFrom = getDistanceFromLatLonInKm(lat, lng, from_lat, from_lng);
      const dTo = getDistanceFromLatLonInKm(lat, lng, to_lat, to_lng);
      if (lvl == from_lvl && dFrom < minFrom) {
        minFrom = dFrom;
        start_key = key;
      }
      if (lvl == to_lvl && dTo < minTo) {
        minTo = dTo;
        end_key = key;
      }
    }
    state.Global_start_key = start_key;
    state.Global_end_key = end_key;

    // ─── Compute shortest path & build full route GeoJSON ──────────
    const path = shortestPath(start_key, end_key);
    state.route_array = path;
    let prev = null;
    let fullDist = 0;
    for (const id of path) {
      const [lng, lat] = extractLngLat(state.Routes_array[id]);
      const coord = [parseFloat(lng), parseFloat(lat)];
      if (prev) {
        fullDist += getDistanceFromLatLonInKm(
          prev[1],
          prev[0],
          coord[1],
          coord[0]
        );
      }
      prev = coord;
      state.Full_path_route.features[0].geometry.coordinates.push(coord);
    }
    state.full_distance_to_destination = fullDist;
    const time = fullDist / 74;
    state.full_time_to_destination = time;
    state.global_name = to_name;
    state.global_distance = Math.floor(fullDist);
    state.global_time = time;
    state.global_zlevel = to_lvl;

    // ─── Markers & elevator guidance ──────────────────────────────
    state.from_marker_location = extractLngLat(state.Routes_array[start_key]);
    state.to_marker_location = extractLngLat(state.Routes_array[end_key]);
    state.from_marker_lvl = from_lvl;
    state.to_marker_lvl = to_lvl;
    elevator_guide();
    addFromToMarkers(
      state.from_marker_location,
      state.to_marker_location,
      state.from_marker_lvl,
      state.to_marker_lvl
    );

    // ─── Render per-floor segment & fly/camera setup ──────────────
    Route_level();
   enter_into_nvgation_mode(state.Full_path_route);

    // ─── Kick off arrow animation ────────────────────────────────
    setupArrowAnimation();
  } catch (error) {
    console.error("draw_path_to_poi error:", error);
  }
}

