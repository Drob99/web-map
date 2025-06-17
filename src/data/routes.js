import { API_BASE, state} from "../config.js";
import { calculateDistance, deg2rad } from "../utils.js";

export let graph;
export let routeEnabled = false;

/**
 * Fetch raw route JSON for each floor
 */
export async function load_routes() {
    const promises = state.floors_objects.flatMap(floor =>
      floor.building_floors.map(f => get_routes(state.Bearer_token, f.id))
    );
    await Promise.all(promises);
    return true;
  }
  
async function process_route_point(routePoint, wayPoint_level) {
    return new Promise((resolve, reject) => {
      try {
        state.Routes_array[routePoint.point_id] =
          routePoint.longitude +
          "," +
          routePoint.latitude +
          "," +
          wayPoint_level +
          "," +
          routePoint.kind;
  
        if (routePoint.kind === "elevator") {
          state.elevators.push({
            key: routePoint.point_id,
            lng: routePoint.longitude,
            lat: routePoint.latitude,
            zlevel: wayPoint_level,
          });
          state.elevatorsCount++;
        }
  
        var keys = routePoint.neighbors;
        for (var z = 0; z < keys.length; z++) {
          graph.addEdge(routePoint.point_id, keys[z]);
        }
  
        resolve();
      } catch (error) {
        reject("Error processing route point: " + error.message);
      }
    });
  }
  
function Graph() {
    var neighbors = (this.neighbors = {});
  
    this.addEdge = function (u, v) {
      if (neighbors[u] === undefined) {
        neighbors[u] = [];
      }
      neighbors[u].push(v);
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
      const routeObj = arr[0];
      const points = routeObj.building_route_points || [];
      const wayPoint_level = state.level_array[key];

      for (let i = 0; i < points.length; i++) {
        await process_route_point(points[i], wayPoint_level);
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
 * Draw the path, compute shortest path, set up state.Full_path_route,
 * distances, and then hand off to arrowAnimation, popups, etc.
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
  routeEnabled = true;
  state.Full_path_route = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      },
    ],
  };

  var to_lng = to_lng_;
  var to_lat = to_lat_;
  var to_lvl = to_zlevel_;

  var from_lng = from_lng_;
  var from_lat = from_lat_;
  var from_lvl = from_zlevel_;

  //Minimum Distance Flag
  var min_flag = 0;
  var minumum_from;
  var minumum_to;

  //key for Start & end location
  var start_key;
  var end_key;

  for (var key in state.Routes_array) {
    // Get
    var value = state.Routes_array[key];
    var spiltter = value.split(",");
    var check_near_lgn = spiltter[0];
    var check_near_lat = spiltter[1];
    var level = spiltter[2];

    var min_distance_from = getDistanceFromLatLonInKm(
      check_near_lat,
      check_near_lgn,
      from_lat,
      from_lng
    );
    var min_distance_to = getDistanceFromLatLonInKm(
      check_near_lat,
      check_near_lgn,
      to_lat,
      to_lng
    );
    if (min_flag == 0) {
      min_flag = 1;
      minumum_from = min_distance_from;
      minumum_to = min_distance_to;
      start_key = key;
      end_key = key;
    } else {
      if (level == from_lvl) {
        if (minumum_from > min_distance_from) {
          minumum_from = min_distance_from;
          start_key = key;
        }
      }
      if (level == to_lvl) {
        if (minumum_to > min_distance_to) {
          minumum_to = min_distance_to;
          end_key = key;
        }
      }
    }
  }

  var geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      },
    ],
  };
  Global_start_key = start_key;
  Global_end_key = end_key;

  shortestPath(graph, start_key, end_key);

  var full_distance = 0;
  var prefpointlng;
  var prevpointlat;
  for (var o = 0; o < state.route_array.length; o++) {
    var waypoint = state.Routes_array[state.route_array[o]];
    var array_coordinates = waypoint.split(",");
    var lgn = array_coordinates[0];
    var lat = array_coordinates[1];
    var level = array_coordinates[2];

    if (o == 0) {
      prefpointlng = lgn;
      prefpointlat = lat;
    } else {
      full_distance =
        full_distance +
        getDistanceFromLatLonInKm(prefpointlat, prefpointlng, lat, lgn);
      prefpointlng = lgn;
      prefpointlat = lat;
    }

    if (o == 1) {
      second_route_lng = lgn;
      second_route_lat = lat;
    }
    state.Full_path_route.features[0].geometry.coordinates.push([lgn, lat]);
    //insert the Route coordinates in the
    if (level == state.Level_route_poi) {
      geojson.features[0].geometry.coordinates.push([lgn, lat]);
    }
  }

  state.full_distance_to_destination = full_distance;
  // if (!remove_extra_route_flag) {
  //     remove_route_layer();
  // }
  var time = Math.floor(full_distance) / 74;
  state.full_time_to_destination = time;
  state.global_name = to_name;
  state.global_distance = Math.floor(full_distance);
  state.global_time = time;
  state.global_zlevel = to_lvl;

  from_marker_location = extractLngLat(state.Routes_array[Global_start_key]);
  to_marker_location = extractLngLat(state.Routes_array[Global_end_key]);
  from_marker_lvl = from_lvl;
  to_marker_lvl = to_lvl;

  if (!remove_extra_route_flag) {
    elevator_guide();
    addFromToMarkers(
      from_marker_location,
      to_marker_location,
      from_marker_lvl,
      to_marker_lvl
    );
  }
  Route_level();
  enter_into_nvgation_mode(SmartRoute);
  //journey_info(state.global_name, state.global_distance, state.global_time);
}


