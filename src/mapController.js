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
let languageChangeCleanup = null;

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
    timeValue.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 12 12" data-testid="icon-directions-walk" id="icon" style = "vertical-align: text-top;">
            <g fill="#000000">
                <path d="M2.94035 11.9804L4.49802 4.13636L3.49666 4.52578V6.41724H2.38403V3.80257L5.19341 2.6065C5.32321 2.55087 5.45997 2.51842 5.60369 2.50915C5.7474 2.49988 5.88416 2.51842 6.01397 2.56478C6.14377 2.61114 6.26663 2.67604 6.38253 2.75949C6.49842 2.84294 6.59346 2.94956 6.66764 3.07937L7.22395 3.96947C7.46502 4.35889 7.79185 4.67877 8.20445 4.92911C8.61705 5.17945 9.08759 5.30462 9.61609 5.30462V6.41724C8.96706 6.41724 8.38757 6.2828 7.87761 6.01391C7.36766 5.74503 6.93188 5.40197 6.57028 4.98474L6.22259 6.6954L7.39084 7.80802V11.9804H6.27822V8.36433L5.10996 7.47423L4.1086 11.9804H2.94035ZM6.55637 2.2449C6.2504 2.2449 5.98847 2.13596 5.77058 1.91807C5.55269 1.70018 5.44375 1.43825 5.44375 1.13228C5.44375 0.826306 5.55269 0.564375 5.77058 0.346487C5.98847 0.128598 6.2504 0.0196533 6.55637 0.0196533C6.86234 0.0196533 7.12427 0.128598 7.34216 0.346487C7.56005 0.564375 7.669 0.826306 7.669 1.13228C7.669 1.43825 7.56005 1.70018 7.34216 1.91807C7.12427 2.13596 6.86234 2.2449 6.55637 2.2449Z" stroke="none"></path>
            </g>
        </svg>

         ${timeLabel}
    `;
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
  // map.flyTo({
  //   center: map.getCenter(),
  //   bearing: map.getBearing(),
  //   pitch: 0,
  //   zoom: 19.343589520103954,
  //   duration: 4000,
  //   essential: true,
  // });
}

/**
 * Shows POIs by the current level, adding polygon layers to the map.
 */
export function showPoisByLevel() {
  if (state.levelRoutePoi == null) state.levelRoutePoi = 1;
  state.polyGeojsonLevel = { type: "FeatureCollection", features: [] };
  state.polyGeojsonLevelOutsideBuilding = {
    type: "FeatureCollection",
    features: [],
  };

  state.allPoiGeojson.features.forEach((feat) => {
    // Create a deep copy of the feature to avoid modifying the original
    const featureCopy = JSON.parse(JSON.stringify(feat));
    const props = featureCopy.properties;

    if (props.icon && state.imageLoadFlag && props.iconUrl)
      loadPoiImage(props.iconUrl, props.icon);

    if (props.level === state.levelRoutePoi) {
      if (props.title === "room") props.title = "";

      // === ADDED: Check excludeList ===
      const originalTitle = props.title;
      if (originalTitle && state.excludeList) {
        const lowerTitle = originalTitle.toLowerCase();
        if (state.excludeList.some(item => item.toLowerCase() === lowerTitle)) {
          // Handle excluded POIs like in the reference code
          props.title = "";
          // Don't modify props.color here to preserve original color logic
        }
      }
      // === END ADDED ===

      // Translate POI properties on the copy
      const translatedProps = mapTranslator.translatePOIProperties(featureCopy);

      // Determine which title to display based on current language
      const currentLang = languageService.getCurrentLanguage();
      let displayTitle = props.title; // Default to original

      if (currentLang === "AR" && translatedProps.title_ar) {
        displayTitle = translatedProps.title_ar;
      } else if (currentLang === "ZN" && translatedProps.title_zn) {
        displayTitle = translatedProps.title_zn;
      } else if (currentLang === "EN" && translatedProps.title_en) {
        displayTitle = translatedProps.title_en;
      }

      const base = {
        id: featureCopy.id,
        type: "Feature",
        geometry: featureCopy.geometry,
        properties: {
          ...props,
          ...translatedProps,
          title: displayTitle || props.title || "", // Ensure title is never undefined
          icon: props.icon || "",
        },
      };

      state.polyGeojsonLevel.features.push(base);

      if (
        ["Admin Building Entrance", "Burjeel Darak Entrance"].includes(
          originalTitle // Use originalTitle before it was potentially changed to "◉"
        )
      ) {
        state.polyGeojsonLevelOutsideBuilding.features.push(base);
      }
    }
  });

  state.imageLoadFlag = false;

  // Remove existing layers and sources
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

  // Add polygon layer
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

  // Add outside polygon layer
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

  // Add outline layer
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

  // Add symbol layer with simple text field
  map.addLayer({
    id: "municipality-name",
    type: "symbol",
    source: "municipalities",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-anchor": "bottom",
      "icon-size": 0.2,
      "text-field": mapTranslator.getTextFieldExpression(
        languageService.getCurrentLanguage()
      ),
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

  updateMapSourceWithTranslations();
}

/**
 * Updates the map source with translated POI data
 */
function updateMapSourceWithTranslations() {
  if (!map || !map.getSource("municipalities")) return;

  try {
    // Update the text field mapping for the current language
    mapTranslator.updatePOILabels();
    
    // Force a small refresh to ensure changes are visible
    setTimeout(() => {
      if (map && typeof map.triggerRepaint === 'function') {
        map.triggerRepaint();
      }
    }, 10);
  } catch (error) {
    console.error("Error updating map source with translations:", error);
  }
}

/**
 * Sets up language change listener
 */
export function setupMapLanguageListener() {
  // Only set up once
  if (languageChangeCleanup) {
    languageChangeCleanup();
    languageChangeCleanup = null;
  }

  // Register listener for language changes
  const unsubscribe = languageService.onLanguageChange((newLanguage) => {
    console.log(`Map responding to language change: ${newLanguage}`);
    
    // Update map layers with new language after a short delay
    setTimeout(() => {
      if (map && map.getSource("municipalities")) {
        updateMapSourceWithTranslations();
      }
    }, 50);
  });
  
  languageChangeCleanup = unsubscribe;

  console.log("Map language listener set up successfully");
}

/**
 * Optional: Clean up language listener
 * Call this if you ever need to clean up (e.g., during app shutdown)
 */
export function cleanupMapLanguageListener() {
  if (languageChangeCleanup) {
    languageChangeCleanup();
    languageChangeCleanup = null;
    console.log("Map language listener cleaned up");
  }
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
