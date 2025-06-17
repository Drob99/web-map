import {
  initializeArrowsSourceAndLayer,
  setupAnimation,
  startAnimation,
  stopAnimation,
} from "./animation/arrowAnimation.js";
import { state } from "./config.js";
import { get_All_POI } from "./data/pois.js";
import { map } from "./mapInit.js";
import { renderDirectionsPanel } from "./navigation.js";

export let routeEnabled = false;

export let from_marker_location = [];
export let to_marker_location = [];
export let from_marker_lvl;
export let to_marker_lvl;

let prev_ele_lvl;
let journey_Elevator = [];
let journey_Elevator_occurrence = [];
let journey_one_elevator = [];
let evelID = [];
let evelgt = [];
let evelat = [];
let evelvl = [];
let evenext = [];
let evevisited = [];
let evecounter = 0;

export let popups_global = [];

let remove_extra_route_flag = false;
let get_instructions_flag = false;
let route_counter_inc = 0;
let int_r_lng;
let int_r_lat;
let SmartRoute_counter = 0;

let markerA = null;
let markerB = null;

/**
 * Fetch & process POIs for every floor in sortedlayer.
 */
export async function load_pois_floors(sortedlayer) {
  return new Promise(async (resolve, reject) => {
    try {
      const layer_length = sortedlayer.length;
      const promises = [];
      for (let i = 0; i < layer_length; i++) {
        promises.push(
          get_All_POI(
            sortedlayer[i].building_floor.id,
            sortedlayer[i].building_floor.name,
            state.Bearer_token,
            sortedlayer[i].building_floor.building_id
          )
        );
      }
      await Promise.all(promises);
      resolve(true);
    } catch (error) {
      reject("Error loading POIs: " + error.message);
    }
  });
}

/**
 * Updates the “time_lbl” and “distance_lbl” DOM nodes.
 */
export function journey_info(poi_name, distance, time) {
  // time
  let t;
  if (time < 1) {
    t = Math.floor(time * 60) + " sec";
  } else {
    t = Math.floor(time) + " min";
  }
  document.getElementById("time_lbl").innerHTML = t;

  // distance
  let d;
  if (distance > 1000) {
    d = (distance / 1000).toFixed(1) + " Km";
  } else {
    d = distance + " meter";
  }
  document.getElementById("distance_lbl").innerHTML = d;
}

/**
 * Examine state.route_array, find floor transitions, and pop up “Go to floor X” buttons.
 */
export function elevator_guide() {
  // reset arrays
  evelID = [];
  evelgt = [];
  evelat = [];
  evelvl = [];
  evenext = [];
  journey_Elevator = [];
  journey_Elevator_occurrence = [];
  journey_one_elevator = [];
  evecounter = 0;

  // build a list of levels
  for (let i = 0; i < state.route_array.length; i++) {
    const [lng, lat, lvl] = state.Routes_array[state.route_array[i]].split(",");
    journey_Elevator[i] = lvl;
  }
  journey_Elevator_occurrence = _.countBy(journey_Elevator);
  journey_Elevator = _.uniq(journey_Elevator);

  // pick floors that only occur once
  for (let x = 0; x < journey_Elevator.length; x++) {
    if (journey_Elevator_occurrence[journey_Elevator[x]] === 1) {
      journey_one_elevator.push(journey_Elevator[x]);
    }
  }

  // detect transitions
  for (let o = 0; o < state.route_array.length; o++) {
    const [lg, lt, lvl] = state.Routes_array[state.route_array[o]].split(",");
    if (o === 0) {
      prev_ele_lvl = lvl;
    } else if (prev_ele_lvl !== lvl && !journey_one_elevator.includes(lvl)) {
      const [plg, plt, plvl] = state.Routes_array[state.route_array[o - 2]].split(",");
      evelgt.push(plg);
      evelat.push(plt);
      evelvl.push(plvl);
      evenext.push(lvl);
      prev_ele_lvl = lvl;
    }
  }

  // pop up one button at a time
  if (routeEnabled && evelgt.length > 0) {
    for (let x = 0; x < evelvl.length; x++) {
      if (state.Level_route_poi === parseInt(evelvl[x], 10)) {
        // choose label/icon based on state.language & direction
        const up = parseInt(evenext[x], 10) > parseInt(evelvl[x], 10);
        const arrow = up ? "fa-circle-up" : "fa-circle-down";
        let label;
        switch (state.language) {
          case "ZN":
            label = "前往樓層 ";
            break;
          case "AR":
            label = "إذهب الى الطابق ";
            break;
          default:
            label = "Go to floor ";
        }

        const popup = new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
          .setHTML(
            `<div style="text-align:center;margin-top:6px;">
               <button
                 onclick="switchFloorByNo(${evenext[x]},${evelgt[x]},${evelat[x]})"
                 style="
                   border:2px solid white;
                   background-color:#0090bf;
                   color:white;
                   padding:10px 20px;
                   font-size:1.3em;
                   border-radius:5px;
                   cursor:pointer;
                 "
               >
                 ${label}${evenext[x]} <i class="fa-solid ${arrow}"></i>
               </button>
             </div>`
          )
          .addTo(map);
        popups_global.push(popup);
        break;
      } else {
        popups_global.forEach((p) => p.remove());
        popups_global = [];
      }
    }
  }
}

/**
 * Build a multi-feature GeoJSON by level, render panel, then draw on map.
 */
export async function Route_level() {
  SmartRoute_counter = 0;
  route_counter_inc = 0;

  // initialize SmartRoute with one empty feature
  let SmartRoute = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { level: null },
        geometry: {
          type: "LineString",
          coordinates: [],
          properties: { color: "#73c4f0" },
        },
      },
    ],
  };

  // populate SmartRoute.features[*].geometry.coordinates
  if (state.route_array.length > 0) {
    let pre_lvl = null;
    for (let p = 0; p < state.route_array.length; p++) {
      const [r, i, g] = state.Routes_array[state.route_array[p]].split(",");
      if (g === pre_lvl) {
        SmartRoute.features[SmartRoute_counter].properties.level = pre_lvl;
        SmartRoute.features[SmartRoute_counter].geometry.coordinates.push([
          r,
          i,
        ]);
      } else {
        pre_lvl = g;
        SmartRoute_counter++;
        SmartRoute.features[SmartRoute_counter] = {
          type: "Feature",
          properties: { level: pre_lvl },
          geometry: {
            type: "LineString",
            coordinates: [[r, i]],
          },
        };
      }
    }
  }

  // render text panel
  renderDirectionsPanel(SmartRoute, "directions-panel");
  document.getElementById("directions-panel").style.display = "block";

  // clear old and draw new
  remove_route_layer();
  map.addSource("route", { type: "geojson", data: SmartRoute });
  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    filter: ["==", "level", state.Level_route_poi.toString()],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#0099EA", "line-width": 15 },
  });
  map.addSource("route_outline", { type: "geojson", data: SmartRoute });
  map.addLayer({
    id: "route_outline",
    type: "line",
    source: "route_outline",
    filter: ["==", "level", state.Level_route_poi.toString()],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#40B3EF", "line-width": 9 },
  });
  map.addSource("route_another", { type: "geojson", data: SmartRoute });
  map.addLayer({
    id: "route_another",
    type: "line",
    source: "route_another",
    filter: ["!=", "level", state.Level_route_poi.toString()],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#BBBBBB", "line-width": 9, "line-opacity": 0.4 },
  });
  map.addSource("route_another_outline", { type: "geojson", data: SmartRoute });
  map.addLayer({
    id: "route_another_outline",
    type: "line",
    source: "route_another_outline",
    filter: ["!=", "level", state.Level_route_poi.toString()],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#A5A4A4",
      "line-width": 15,
      "line-opacity": 0.4,
    },
  });

  // now arrows
  initializeArrowsSourceAndLayer();
  setupAnimation();
  startAnimation();
}

/**
 * Remove all “route” layers & sources if present.
 */
export function remove_route_layer() {
  ["route", "route_outline", "route_another", "route_another_outline"].forEach(
    (id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
  );
}

/**
 * Stop animation, hide UI, clear state & markers.
 */
export function ClearRoute() {
  remove_route_layer();
  stopAnimation();
  exit_into_nvgation_mode();

  state.route_array.length = 0;
  state.full_distance_to_destination = 0;
  state.global_time = 0;
  routeEnabled = false;

  document.getElementsByClassName("directions-panel")[0].style.display = "none";
  document.getElementById("menu").style.display = "block";

  if (markerA) markerA.remove();
  if (markerB) markerB.remove();

  from_marker_location = [];
  to_marker_location = [];
  from_marker_lvl = null;
  to_marker_lvl = null;

  popups_global.forEach((p) => p.remove());
  popups_global = [];
}

/**
 * Place big “A”/“B” pins on map.
 */
export function addFromToMarkers(from, to, levelA, levelB) {
  // ...exact same as in your original map.js...
  // (omitted here for brevity but should be pasted verbatim)
}

/**
 * Click the floor button in #menu matching floor_name.
 */
export function switchFloorByNo(floor_name) {
  if (floor_name == "0") floor_name = "G";
  const menubtn = document.getElementById("menu");
  for (let i = 0; i < menubtn.childElementCount; i++) {
    if (menubtn.children[i].innerText == floor_name) {
      menubtn.children[i].click();
      break;
    }
  }
}

/**
 * Extract [lng,lat] from a “lng,lat,level,kind” string.
 */
export function extractLngLat(routeString) {
  if (!routeString) return [];
  const parts = routeString.split(",");
  return parts.length >= 2 ? [parseFloat(parts[0]), parseFloat(parts[1])] : [];
}

/**
 * Format meters to feet/miles (imperial) or back to meters/km.
 */
export function formatDistanceImperial(meters) {
  if (!meters) return { value: "", unit: "" };
  if (meters < 1000) return { value: Math.round(meters), unit: "meters" };
  const km = meters / 1000;
  return { value: km.toFixed(2), unit: "km" };
}

/**
 * Sum distances & estimate walking time.
 */
export function calculateTotals(instructions) {
  let totalDistance = 0;
  instructions.forEach((ins) => {
    if (ins.distance) totalDistance += ins.distance;
  });
  const minutes = Math.round(totalDistance / 80.4672);
  return { distance: totalDistance, time: minutes };
}

/**
 * Show/hide any .expandcollapse content.
 */
export function toggleContent(id) {
  const el = document.getElementsByClassName(id)[0];
  const btn = document.getElementsByClassName("expandcollapse")[0];
  if (!el) return;
  const showing = el.style.display === "block";
  el.style.display = showing ? "none" : "block";
  btn.innerHTML = showing
    ? '<i class="fa fa-plus-square"></i> Show Instructions'
    : '<i class="fa fa-minus-square"></i> Hide Instructions';
}

/**
 * FlyTo for navigation mode (angled).
 */
export function enter_into_nvgation_mode(Route_geojson) {
  if (Route_geojson.features[1]?.geometry.coordinates.length > 1) {
    const [lng0, lat0] = Route_geojson.features[1].geometry.coordinates[0];
    const [lng1, lat1] = Route_geojson.features[1].geometry.coordinates[1];
    const bearing = turf.bearing(
      turf.point([lng0, lat0]),
      turf.point([lng1, lat1])
    );
    map.flyTo({
      center: [lng0, lat0],
      bearing,
      pitch: 56.5,
      zoom: 20.23,
      duration: 4000,
      essential: true,
    });
    switch_to_A_floor();
  }
}

/**
 * Switch map back to “A” floor.
 */
export function switch_to_A_floor() {
  const menubtn = document.getElementById("menu");
  for (let i = 0; i < menubtn.childElementCount; i++) {
    let floor = menubtn.children[i].innerText;
    floor = floor === "G" ? 0 : parseInt(floor, 10);
    if (floor === from_marker_lvl) {
      menubtn.children[i].click();
      break;
    }
  }
}

/**
 * FlyTo to exit navigation mode (reset angle).
 */
export function exit_into_nvgation_mode() {
  map.flyTo({
    center: [map.getCenter().lng, map.getCenter().lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.34,
    duration: 4000,
    essential: true,
  });
}

export function poi_show_by_level() {
    let counter = 0;
    let counter_building = 0;

    if (state.Level_route_poi == null) {
      state.Level_route_poi = 1;
    }

  state.Poly_geojson_level = {
    type: "FeatureCollection",
    features: [],
  };
  state.Poly_geojson_level_outsidebuilding = {
    type: "FeatureCollection",
    features: [],
  };
    
  const all = state.All_POI_object.features;
  const lvl = state.Level_route_poi;
  const imageload = state.imageload_flag;

  all.forEach((feat, i) => {
    const props = feat.properties;
    // lazy‐load icons once
    if (props.icon && imageload && props.icon_url) {
      get_image(props.icon_url, props.icon);
    }
    // only keep those on the current floor
    if (props.Level === lvl) {
      // tweak title
      if (props.title === "room") props.title = "";
      const color = props.Color;
      const base = {
        id: feat.id,
        type: "Feature",
        geometry: feat.geometry,
        properties: { ...props },
      };
      state.Poly_geojson_level.features.push(base);
      counter++;

      // also capture entrances
      if (
        props.title === "Admin Building Entrance" ||
        props.title === "Burjeel Darak Entrance"
      ) {
        state.Poly_geojson_level_outsidebuilding.features.push(base);
        counter_building++;
      }
    }
  });
  state.imageload_flag = false;

  // clear old
  if (map.getSource("municipalities")) {
    ["polygons", "polygons_outline", "municipality-name"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    map.removeSource("municipalities");
  }

  // add new
  map.addSource("municipalities", {
    type: "geojson",
    data: state.Poly_geojson_level,
  });

  map.addLayer({
    id: "polygons",
    type: "fill",
    source: "municipalities",
    paint: {
      "fill-color": ["get", "Color"],
      "fill-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.32,
        0.8,
      ],
    },
  });

  map.addLayer({
    id: "polygons_outline",
    type: "line",
    source: "municipalities",
    paint: {
      "line-color": "#828282",
      "line-width": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16,
        0,
        22,
        1,
      ],
      "line-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.32,
        1,
      ],
    },
  });

  map.addLayer({
    id: "municipality-name",
    type: "symbol",
    source: "municipalities",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-anchor": "bottom",
      "icon-size": 0.2,
      "text-field": ["get", "title"],
      "text-size": 12,
      "text-offset": [0, 0.8],
      "symbol-placement": "point",
      "icon-allow-overlap": true,
    },
    paint: {
      "icon-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.32,
        1,
      ],
      "text-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.32,
        0.8,
      ],
      "text-color": "rgba(0,0,0,1)",
      "text-halo-color": "rgba(255,255,255,1)",
      "text-halo-width": 2,
      "text-halo-blur": 0,
    },
  });
}

/**
 * Clicks the #menu button for whatever the current floor is.
 */
export function switch_to_current_floor() {
    const floor = state.current_lvl || state.Level_route_poi || 1;
    switchFloorByNo(floor);
  }