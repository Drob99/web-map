import { state } from "../config.js";
import { getDistanceFromLatLonInKm } from "../utils.js";
import { map } from "../mapInit.js";
import { setupArrowAnimation } from "../animation/arrowAnimation.js";
import { graph } from "./routes.js";
import { extractLngLat, addFromToMarkers, elevator_guide, Route_level, enter_into_nvgation_mode } from "../mapController.js";

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
    for (let v of nbrs) {
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
  // reset and flag
  state.routeEnabled = true;
  state.Full_path_route = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      },
    ],
  };

  // alias
  const [from_lng, from_lat, from_lvl] = [from_lng_, from_lat_, from_zlevel_];
  const [to_lng, to_lat, to_lvl] = [to_lng_, to_lat_, to_zlevel_];


  // find closest start_key & end_key
  let min_flag = false;
  let min_from = 0,
    min_to = 0,
    start_key = null,
    end_key = null;

  for (const key in state.Routes_array) {
    const [lng, lat, lvl] = state.Routes_array[key].split(",");
    const dFrom = getDistanceFromLatLonInKm(lat, lng, from_lat, from_lng);
    const dTo = getDistanceFromLatLonInKm(lat, lng, to_lat, to_lng);

    if (!min_flag) {
      min_flag = true;
      min_from = dFrom;
      min_to = dTo;
      start_key = key;
      end_key = key;
    } else {
      if (lvl == from_lvl && dFrom < min_from) {
        min_from = dFrom;
        start_key = key;
      }
      if (lvl == to_lvl && dTo < min_to) {
        min_to = dTo;
        end_key = key;
      }
    }
  }

  state.Global_start_key = start_key;
  state.Global_end_key = end_key;

  // run BFS to populate state.route_array
  shortestPath(start_key, end_key);

  // build the full path & compute distance
  let full_distance = 0;
  let prev_lng, prev_lat;

  for (let i = 0; i < route_array.length; i++) {
    const point = state.Routes_array[route_array[i]];
    const [lng, lat, lvl] = point.split(",");

    if (i === 0) {
      prev_lng = lng;
      prev_lat = lat;
    } else {
      full_distance += getDistanceFromLatLonInKm(
        prev_lat,
        prev_lng,
        lat,
        lng
      );
      prev_lng = lng;
      prev_lat = lat;
    }

    // push every step into the master geojson
    state.Full_path_route.features[0].geometry.coordinates.push([
      parseFloat(lng),
      parseFloat(lat),
    ]);
  }

  // store summary stats
  state.full_distance_to_destination = full_distance;
  const time = full_distance / 74; // t = d / 74
  state.full_time_to_destination = time;
  state.global_name = to_name;
  state.global_distance = Math.floor(full_distance);
  state.global_time = time;
  state.global_zlevel = to_lvl;

  // markers & elevator linking
  state.from_marker_location = extractLngLat(
    state.Routes_array[state.Global_start_key]
  );
  state.to_marker_location = extractLngLat(
    state.Routes_array[state.Global_end_key]
  );
  state.from_marker_lvl = from_lvl;
  state.to_marker_lvl = to_lvl;

  elevator_guide(); // if you want the popup prompts
  addFromToMarkers(
    state.from_marker_location,
    state.to_marker_location,
    state.from_marker_lvl,
    state.to_marker_lvl
  );

  // draw & fly/etc.
  Route_level(); // redraw per-floor segment
  enter_into_nvgation_mode(state.SmartRoute); // center & pitch

  // finally kick off arrows
  setupArrowAnimation();
}
