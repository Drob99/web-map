/**
 * @module mapController
 * @description Manages map layers, routing logic, and POI interactions.
 */
import {
  initializeArrowsSourceAndLayer,
  setupArrowAnimation,
  startAnimation,
  stopAnimation,
} from "./animation/arrowAnimation.js";
import { state } from "./config.js";
import { getAllPoi, loadPoiImage } from "./data/pois.js";
import { map } from "./mapInit.js";
import { renderDirectionsPanel } from "./navigation.js";
import { resetMarkers } from "./markers.js";
import { mapTranslator } from "./i18n/mapTranslator.js";
import { languageService } from "./i18n/languageService.js";

// Routing state
export let routeEnabled = false;

// Global interaction variables
let prevEleLvl;
let journeyElevator = [];
let journeyElevatorOccurrence = {};
let journeyOneElevator = [];
let elevatorIds = [];
let elevatorLngs = [];
let elevatorLats = [];
let elevatorLvls = [];
let nextElevatorLvls = [];

export let popupsGlobal = [];
export let removeExtraRouteFlag = false;
let getInstructionsFlag = false;
let routeCounterInc = 0;
let smartRouteCounter = 0;
let intRLng;
let intRLat;

let markerA = null;
let markerB = null;

/**
 * Fetches and processes POIs for each floor in the given sorted layers.
 * @param {Array<Object>} sortedLayer - Array of layer objects sorted by floor.
 * @returns {Promise<boolean>} Resolves true when all POIs are loaded.
 */
export async function loadPoisFloors(sortedLayer) {
  try {
    const promises = sortedLayer.map((layer) =>
      getAllPoi(
        layer.building_floor.building_id,
        layer.building_floor.id,
        state.bearerToken,
      )
    );
    const allFeatures = [];
    const poiResponses = await Promise.all(promises);
    poiResponses.forEach(({ features = [] }) => {
      allFeatures.push(...features);
    });
    state.allPoiGeojson = {
      type: "FeatureCollection",
      features: allFeatures,
    };
    return true;
  } catch (error) {
    console.error("Error loading POIs:", error);
    throw error;
  }
}

/**
 * Updates journey info labels for time and distance in the UI.
 * @param {string} poiName - Name of the destination POI.
 * @param {number} distance - Distance in meters.
 * @param {number} time - Time in minutes (can be fraction).
 */
export function updateJourneyInfo(poiName, distance, time , level) {
  // Format time
  const timeLabel =time < 1 ? `${Math.floor(time * 60)} sec` : `${Math.floor(time)} min`;

    const timeValue = document.querySelector('.time-value');
    if (timeValue) {
        timeValue.textContent = timeLabel;
    }
 document.getElementById("step-time").textContent = timeLabel;
 const distLabel =distance > 1000? `${(distance / 1000).toFixed(1)} Km`: `${distance} meter`;    
 document.getElementById("step-distance").textContent = distLabel;
 document.getElementById("step-level").textContent = level;
}

/**
 * Examines state.routeArray for level transitions and shows elevator guide popups.
 */
export function elevatorGuide() {
  // Reset arrays
  elevatorIds = [];
  elevatorLngs = [];
  elevatorLats = [];
  elevatorLvls = [];
  nextElevatorLvls = [];
  journeyElevator = [];
  journeyElevatorOccurrence = {};
  journeyOneElevator = [];

  // Build list of levels in route
  state.routeArray.forEach((idx, i) => {
    const [lng, lat, lvl] = state.routesArray[idx].split(",");
    journeyElevator[i] = lvl;
  });
  journeyElevatorOccurrence = _.countBy(journeyElevator);
  journeyElevator = _.uniq(journeyElevator);

  // Floors that occur only once (single elevator stops)
  journeyElevator.forEach((lvl) => {
    if (journeyElevatorOccurrence[lvl] === 1) {
      journeyOneElevator.push(lvl);
    }
  });

  // Detect transitions
  state.routeArray.forEach((idx, i) => {
    const [lng, lat, lvl] = state.routesArray[idx].split(",");
    if (i === 0) {
      prevEleLvl = lvl;
    } else if (prevEleLvl !== lvl && !journeyOneElevator.includes(lvl)) {
      const [plng, plat, plvl] =
        state.routesArray[state.routeArray[i - 2]].split(",");
      elevatorLngs.push(plng);
      elevatorLats.push(plat);
      elevatorLvls.push(plvl);
      nextElevatorLvls.push(lvl);
      prevEleLvl = lvl;
    }
  });

  // Show one popup at a time for elevator transitions
  if (routeEnabled && elevatorLngs.length > 0) {
    elevatorLvls.forEach((lvl, i) => {
      if (state.levelRoutePoi === parseInt(lvl, 10)) {
        const up = parseInt(nextElevatorLvls[i], 10) > parseInt(lvl, 10);
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
          .setLngLat([parseFloat(elevatorLngs[i]), parseFloat(elevatorLats[i])])
          .setHTML(
            `<div style="text-align:center;margin-top:6px;">
               <button
                 onclick="switchFloorByNo(${nextElevatorLvls[i]})"
                 style="border:2px solid white;background-color:#0090bf;color:white;padding:10px 20px;font-size:1.3em;border-radius:5px;cursor:pointer;"
               >
                 ${label}${nextElevatorLvls[i]} <i class="fa-solid ${arrow}"></i>
               </button>
             </div>`
          )
          .addTo(map);
        popupsGlobal.push(popup);
      } else {
        popupsGlobal.forEach((p) => p.remove());
        popupsGlobal = [];
      }
    });
  }
}


export var smartRoute;
/**
 * Builds and renders a multi-level GeoJSON route, then draws it on the map.
 */
export async function routeLevel() {
  smartRouteCounter = 0;
  routeCounterInc = 0;

  // Initialize SmartRoute feature collection
   smartRoute = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { level: null },
        geometry: { type: "LineString", coordinates: [] },
      },
    ],
  };

  // Populate features by level
  let prevLvl = null;
  state.routeArray.forEach((idx) => {
    const [lng, lat, lvl] = state.routesArray[idx].split(",");
    if (lvl === prevLvl) {
      smartRoute.features[smartRouteCounter].properties.level = prevLvl;
      smartRoute.features[smartRouteCounter].geometry.coordinates.push([
        lng,
        lat,
      ]);
    } else {
      prevLvl = lvl;
      smartRouteCounter++;
      smartRoute.features[smartRouteCounter] = {
        type: "Feature",
        properties: { level: prevLvl },
        geometry: { type: "LineString", coordinates: [[lng, lat]] },
      };
    }
  });

  // Render panel and show
  renderDirectionsPanel(smartRoute, "directions-panel");
  document.getElementById("directions-panel").style.display = "none";

  // Draw route layers
  removeRouteLayer();
  // ["route_another", "route_another_outline", "route", "route_outline"].forEach(
  //   (id) => {
  //     map.addSource(id, { type: "geojson", data: smartRoute });
  //     const paint =
  //       id === "route"
  //         ? { "line-color": "#0099EA", "line-width": 15 }
  //         : id === "route_outline"
  //         ? { "line-color": "#40B3EF", "line-width": 9 }
  //         : id === "route_another"
  //         ? { "line-color": "#BBBBBB", "line-width": 9, "line-opacity": 0.4 }
  //         : { "line-color": "#A5A4A4", "line-width": 15, "line-opacity": 0.4 };
  //     map.addLayer({
  //       id,
  //       type: "line",
  //       source: id,
  //       filter: id.includes("another")
  //         ? ["!=", "level", state.levelRoutePoi.toString()]
  //         : ["==", "level", state.levelRoutePoi.toString()],
  //       layout: { "line-join": "round", "line-cap": "round" },
  //       paint,
  //     });
  //   }
  //);
            map.addSource("route", {
                type: "geojson",
                data: smartRoute,
            }),
            map.addLayer({
                id: "route",
                type: "line",
                source: "route",
                filter: ["==", "level", state.levelRoutePoi.toString()],
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#0099EA",
                    "line-width": 15,
                },
            }),
            map.addSource("route_outline", {
                type: "geojson",
                data: smartRoute,
            }),
            map.addLayer({
                id: "route_outline",
                type: "line",
                filter: ["==", "level", state.levelRoutePoi.toString()],
                source: "route_outline",
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#40B3EF",
                    "line-width": 9,
                    //"line-pattern": "fast-forward3.png"
                },
            }),
            map.addSource("route_another", {
                type: "geojson",
                data: smartRoute,
            }),
            map.addLayer({
                id: "route_another",
                type: "line",
                source: "route_another",
                filter: ["!=", "level", state.levelRoutePoi.toString()],
                layout: {
                    //visibility: "none",
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#BBBBBB",
                    "line-width": 9,
                    "line-opacity": 0.4,
                    //"line-pattern": "fast-forward4.png"
                },
            }),
            map.addSource("route_another_outline", {
                type: "geojson",
                data: smartRoute,
            }),
            map.addLayer({
                id: "route_another_outline",
                type: "line",
                source: "route_another_outline",
                filter: ["!=", "level", state.levelRoutePoi.toString()],
                layout: {
                    //visibility: "none",
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#A5A4A4",
                    "line-width": 15,
                    "line-opacity": 0.4,
                },
            }),


  // Start arrow animation
  initializeArrowsSourceAndLayer(map);
  setupArrowAnimation();
  startAnimation();
}

/**
 * Removes all route-related layers and sources from the map.
 */
export function removeRouteLayer() {
  ["route", "route_outline", "route_another", "route_another_outline"].forEach(
    (id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
  );
}

/**
 * Clears current route, stops animation, and resets state and UI.
 */
export function clearRoute() {
  initializeArrowsSourceAndLayer();
  removeRouteLayer();
  stopAnimation();
  exitNavigationMode();

  state.routeArray = [];
  state.fullDistanceToDestination = 0;
  state.globalTime = 0;
  state.routeEnabled = false;
  document.querySelector(".directions-panel").style.display = "none";
  document.getElementById("menu").style.display = "block";

  if (markerA) markerA.remove();
  if (markerB) markerB.remove();
  resetMarkers();

  state.fromMarkerLocation = [];
  state.toMarkerLocation = [];
  state.fromMarkerLevel = null;
  state.toMarkerLevel = null;

  popupsGlobal.forEach((p) => p.remove());
  popupsGlobal = [];

  $("#from_location").val("").trigger("change");
  $("#to_location").val("").trigger("change");
}

/**
 * Places "A" and "B" markers on the map at given coordinates.
 * @param {[number,number]} from - [lng, lat] for start marker.
 * @param {[number,number]} to - [lng, lat] for end marker.
 * @param {number} levelA - Floor level for start.
 * @param {number} levelB - Floor level for end.
 */
export function addFromToMarkers(from, to, levelA, levelB) {
    // Remove any existing “A” or “B” markers
    if (markerA) markerA.remove();
    if (markerB) markerB.remove();
  
    // Create and add marker A
    const elA = document.createElement("div");
    elA.innerHTML = levelA === state.levelRoutePoi
      ? `<div style="background:#00BFFF;color:#fff;border-radius:50%;width:30px;height:30px;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">A</div>`
      : `<div style="background:#b6b6b6;color:#fff;border-radius:50%;width:30px;height:30px;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">A</div>`;
    markerA = new mapboxgl.Marker(elA)
      .setLngLat(from)
      .addTo(map);
  
    // Create and add marker B
    const elB = document.createElement("div");
    elB.innerHTML = levelB === state.levelRoutePoi
      ? `<div style="background:#6A5ACD;color:#fff;border-radius:50%;width:30px;height:30px;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">B</div>`
      : `<div style="background:#b6b6b6;color:#fff;border-radius:50%;width:30px;height:30px;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">B</div>`;
    markerB = new mapboxgl.Marker(elB)
      .setLngLat(to)
      .addTo(map);
}

/**
 * Clicks the floor button in #menu matching the given floor name.
 * @param {string|number} floorName - Floor label or number.
 */
export function switchFloorByNo(floorName) {
  const num = floorName != null ? floorName : 0;
  state.currentLevel = num;
  showPoisByLevel();
  const label = num === "0" ? "G" : `${num}`;
  const menu = document.getElementById("menu");
  Array.from(menu.children).forEach((btn) => {
    if (btn.innerText === label) btn.click();
  });
}

/**
 * Extracts [lng, lat] from a "lng,lat,level" string.
 * @param {string} routeStr - Comma-separated route string.
 * @returns {[number,number]} Coordinates or empty array.
 */
export function extractLngLat(routeStr) {
  if (!routeStr) return [];
  const [lng, lat] = routeStr.split(",").map(Number);
  return [lng, lat];
}

/**
 * Sums distances and estimates walking time (~80.4672 m/min).
 * @param {Array<Object>} instructions
 * @returns {{distance:number,time:number}}
 */
export function calculateTotals(instructions) {
  const distance = instructions.reduce(
    (sum, ins) => sum + (ins.distance || 0),
    0
  );
  const time = Math.round(distance / 80.4672);
  return { distance, time };
}

/**
 * Toggles visibility of content sections and updates button label.
 * @param {string} classId - Class name of content to toggle.
 */
export function toggleContent(classId) {
  const el = document.getElementsByClassName(classId)[0];
  const btn = document.getElementsByClassName("expandcollapse")[0];
  if (!el) return;
  const showing = el.style.display === "block";
  el.style.display = showing ? "none" : "block";
  btn.innerHTML = showing
    ? '<i class="fa fa-plus-square"></i> Show Instructions'
    : '<i class="fa fa-minus-square"></i> Hide Instructions';
}

/**
 * Enters navigation mode by flying to the route angle and floor.
 * @param {Object} routeGeojson - GeoJSON feature collection.
 */
export function enterNavigationMode(routeGeojson) {
  if (!routeGeojson?.features) return;
  const coords = routeGeojson.features[0].geometry.coordinates;
  if (coords.length < 2) return;
  const [[lng0, lat0], [lng1, lat1]] = coords;
  const bearing = turf.bearing(
    turf.point([lng0, lat0]),
    turf.point([lng1, lat1])
  );
  map.flyTo({
    center: [lng0, lat0],
    bearing,
    pitch: 56.50000000000002,
    zoom: 20.234504452665387,
    duration: 4000,
    essential: true,
  });
  switchToAFloor();
}

/**
 * Switches map back to the original 'A' floor after navigation.
 */
export function switchToAFloor() {
  const menu = document.getElementById("menu");
  Array.from(menu.children).forEach((btn) => {
    const floor = btn.innerText === "G" ? 0 : Number(btn.innerText);
    if (floor === state.fromMarkerLevel) btn.click();
  });
}

/**
 * Exits navigation mode by resetting camera pitch and zoom.
 */
export function exitNavigationMode() {
  map.flyTo({
    center: map.getCenter(),
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.343589520103954,
    duration: 4000,
    essential: true,
  });
}

/**
 * Shows POIs by the current level, adding polygon layers to the map.
 */
export function showPoisByLevel() {
  // Import at the top of the file if not already present
  // import { mapTranslator } from "./i18n/mapTranslator.js";
  // import { languageService } from "./i18n/languageService.js";
  
  if (state.levelRoutePoi == null) state.levelRoutePoi = 1;
  state.polyGeojsonLevel = { type: "FeatureCollection", features: [] };
  state.polyGeojsonLevelOutsideBuilding = {
    type: "FeatureCollection",
    features: [],
  };

  state.allPoiGeojson.features.forEach((feat) => {
    const props = feat.properties;
    if (props.icon && state.imageLoadFlag && props.iconUrl)
      loadPoiImage(props.iconUrl, props.icon);
    if (props.level === state.levelRoutePoi) {
      if (props.title === "room") props.title = "";
      
      // Translate POI properties
      const translatedProps = mapTranslator.translatePOIProperties(feat);
      
      const base = {
        id: feat.id,
        type: "Feature",
        geometry: feat.geometry,
        properties: { ...props, ...translatedProps },
      };
      state.polyGeojsonLevel.features.push(base);
      if (
        ["Admin Building Entrance", "Burjeel Darak Entrance"].includes(
          props.title
        )
      ) {
        state.polyGeojsonLevelOutsideBuilding.features.push(base);
      }
    }
  });
  state.imageLoadFlag = false;

  if (map.getSource("municipalities")) {
    ["polygons", "polygons_outline", "municipality-name"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    map.removeSource("municipalities");
  }

  map.addSource("municipalities", {
    type: "geojson",
    data: state.polyGeojsonLevel,
  });

  if (map.getSource("municipalities_outside")) {
    if (map.getLayer("polygons_outside")) map.removeLayer("polygons_outside");
    map.removeSource("municipalities_outside");
  }
  map.addSource("municipalities_outside", {
    type: "geojson",
    data: state.polyGeojsonLevelOutsideBuilding,
  });

  map.addLayer({
    id: "polygons",
    type: "fill",
    source: "municipalities",
    paint: {
      "fill-color": ["coalesce", ["get", "color"], "#CCCCCC"],
      "fill-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        0.8,
      ],
    },
  });
  
  map.addLayer({
    id: "polygons_outside",
    type: "fill",
    source: "municipalities_outside",
    paint: {
      "fill-color": ["coalesce", ["get", "color"], "#CCCCCC"],
      "fill-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
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
        20.31967926651499,
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
      "text-field": [
        'coalesce',
        ['get', languageService.getCurrentLanguage() === 'AR' ? 'title_ar' : 
                languageService.getCurrentLanguage() === 'ZN' ? 'title_zn' : 'title_en'],
        ['get', 'title']
      ],
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
        20.31967926651499,
        1,
      ],
      "text-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
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
 * Switches to the current floor based on state.levelRoutePoi or state.currentLevel.
 */
export function switchToCurrentFloor() {
  const floor = state.currentLevel || state.levelRoutePoi || "G";
  switchFloorByNo(floor);
}

// Expose globally
window.clearRoute = clearRoute;
window.enterNavigationMode = enterNavigationMode;
