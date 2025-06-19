//! Global Variables

//! Initialize Map

// Bring back the same global you were using:

//! Initialize UI

//! Matching & Formatting Helpers

//! Time & Screensaver

//! Auth & Data Loading

//! Category

//! Buildings via Web Worker

//! Floors

//! Layers

//! Process & add layers

//! Layer functions

// function add street Layers

// function add rooms Layers

// function add belcony layer Layers

// function add garden layer Layers

//! Toggle Layer UI

//! POIs & Routes

function remove_route_layer() {
  var mapSource = map.getSource("route");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route");
    map.removeSource("route");
    map.removeLayer("route_outline");
    map.removeSource("route_outline");
  }

  var mapSource = map.getSource("route_outline");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route_outline");
    map.removeSource("route_outline");
  }

  var mapSource = map.getSource("route_another");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route_another");
    map.removeSource("route_another");
  }

  var mapSource = map.getSource("route_another_outline");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route_another_outline");
    map.removeSource("route_another_outline");
  }
}

const baseArrowsPerKm = 80;
const minArrows = 0;
const maxArrows = 100;
const steps = 300;
let animationSpeed = 0.5;

let animationFrameId = null;
let isAnimating = false;
let animationState = [];

function ClearRoute() {
  //route_bounds_fit = false;
  initializeArrowsSourceAndLayer();
  stopAnimation();
  exit_into_nvgation_mode();
  route_array = [];
  full_distance_to_destination = 0;
  global_time = 0;
  routeEnabled = false;
  document.getElementsByClassName("directions-panel")[0].style.display = "none";
  document.getElementById("menu").style.display = "block";

  if (markerA) markerA.remove();
  if (markerB) markerB.remove();

  from_marker_location = [];
  to_marker_location = [];
  from_marker_lvl = null;
  to_marker_lvl = null;

  popups_global.forEach((popup) => popup.remove());
  popups_global = []; // clear the array

  var mapLayer = map.getLayer("route");
  if (typeof mapLayer !== "undefined") {
    map.removeLayer("route");
    map.removeSource("route");

    map.removeLayer("route_another");
    map.removeSource("route_another");

    var route_outline = map.getLayer("route_outline");
    if (typeof route_outline !== "undefined") {
      map.removeLayer("route_outline");
      map.removeSource("route_outline");
    }

    if (typeof route_outline !== "undefined") {
      map.removeLayer("route_another_outline");
      map.removeSource("route_another_outline");
    }

    // map.removeLayer("poi_fill");
    // map.removeSource("poi_fill");

    // map.removeLayer("poi_border");
    // map.removeSource("poi_border");
  }
}

let markerA = null;
let markerB = null;

function addFromToMarkers(from, to, levelA, levelB) {
  // Remove existing markers
  if (markerA) markerA.remove();
  if (markerB) markerB.remove();
  if (fromMarker) fromMarker.remove();
  if (toMarker) toMarker.remove();

  // Add marker A if level matches
  if (levelA === state.Level_route_poi) {
    const elA = document.createElement("div");
    elA.innerHTML = `
            <div style="background:#00BFFF;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                A
            </div>`;
    markerA = new mapboxgl.Marker(elA).setLngLat(from).addTo(map);
  } else {
    const elA = document.createElement("div");
    elA.innerHTML = `
            <div style="background:#b6b6b6;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                A
            </div>`;
    markerA = new mapboxgl.Marker(elA).setLngLat(from).addTo(map);
  }

  // Add marker B if level matches
  if (levelB === state.Level_route_poi) {
    const elB = document.createElement("div");
    elB.innerHTML = `
            <div style="background:#6A5ACD;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                B
            </div>`;
    markerB = new mapboxgl.Marker(elB).setLngLat(to).addTo(map);
  } else {
    const elB = document.createElement("div");
    elB.innerHTML = `
            <div style="background:#b6b6b6;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                B
            </div>`;
    markerB = new mapboxgl.Marker(elB).setLngLat(to).addTo(map);
  }
}

function switchFloorByNo(floor_name, lng, lat) {
  if (floor_name == "0") {
    floor_name = "G";
  }
  var menubtn = document.getElementById("menu");

  for (var i = 0; i < menubtn.childElementCount; i++) {
    var floor = menubtn.children[i].innerText;
    if (floor_name == "G") {
      if (floor == floor_name) {
        menubtn.children[i].click();
      }
    } else {
      if (floor == floor_name) {
        menubtn.children[i].click();
      }
    }
  }
}

function extractLngLat(routeString) {
  if (!routeString) return [];

  const parts = routeString.split(",");
  if (parts.length < 2) return [];

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  return [lng, lat];
}

// Reset function

//! Nav Instrucions

/**
 * Format distance for display in miles or feet
 * @param {Number} meters - Distance in meters
 * @returns {Object} Formatted distance with value and unit
 */
function formatDistanceImperial(meters) {
  if (!meters) return { value: "", unit: "" };

  // Convert to feet (1m ≈ 3.28084ft)
  const feet = meters;

  if (feet < 1000) {
    // Less than 1000 feet, show in feet
    return {
      value: Math.round(feet),
      unit: "meters",
    };
  } else {
    // More than 1000 feet, show in miles
    const miles = feet / 1000;
    return {
      value: miles.toFixed(2),
      unit: "km",
    };
  }
}

/**
 * Calculate total distance and time from instructions
 * @param {Array} instructions - Array of instruction objects
 * @returns {Object} Total distance in meters and estimated time in minutes
 */
function calculateTotals(instructions) {
  let totalDistance = 0;

  instructions.forEach((instruction) => {
    if (instruction.distance) {
      totalDistance += instruction.distance;
    }
  });

  // Estimate time (rough calculation: ~3mph walking speed)
  const minutes = Math.round(totalDistance / 80.4672);

  return {
    distance: totalDistance,
    time: minutes,
  };
}

function toggleContent(id) {
  const element = document.getElementsByClassName(id)[0];
  if (element.style.display === "none" || element.style.display === "") {
    element.style.display = "block";
    document.getElementsByClassName("expandcollapse")[0].innerHTML =
      '<i class="fa fa-minus-square" aria-hidden="true"></i> Hide Instrucions';
  } else {
    element.style.display = "none";
    document.getElementsByClassName("expandcollapse")[0].innerHTML =
      '<i class="fa fa-plus-square" aria-hidden="true"></i> Show Instrucions';
  }
}

function enter_into_nvgation_mode(Route_geojson) {
  if (Route_geojson.features[1].geometry.coordinates.length > 1) {
    var point1 = turf.point([
      parseFloat(Route_geojson.features[1].geometry.coordinates[0][0]),
      parseFloat(Route_geojson.features[1].geometry.coordinates[0][1]),
    ]);
    var point2 = turf.point([
      parseFloat(Route_geojson.features[1].geometry.coordinates[1][0]),
      parseFloat(Route_geojson.features[1].geometry.coordinates[1][1]),
    ]);
    var bearing = turf.bearing(point1, point2);
    map.flyTo({
      center: [
        parseFloat(Route_geojson.features[1].geometry.coordinates[0][0]),
        parseFloat(Route_geojson.features[1].geometry.coordinates[0][1]),
      ],
      bearing: bearing,
      pitch: 56.50000000000002,
      zoom: 20.234504452665387,
      duration: 4000,
      essential: true,
    });
    if (
      parseInt(SmartRoute.features[1].properties.level) != state.Level_route_poi
    ) {
      switch_to_A_floor();
    }
  }
}

function switch_to_A_floor() {
  var menubtn = document.getElementById("menu");

  for (var i = 0; i < menubtn.childElementCount; i++) {
    var floor = menubtn.children[i].innerText;
    if (floor == "G") {
      floor = 0;
    } else {
      floor = parseInt(floor);
    }
    console.log(
      "Floor : " +
        floor +
        " , " +
        state.Level_route_poi +
        " : " +
        (floor == state.Level_route_poi)
    );
    if (floor == from_lvl) {
      console.log("SWITCHED : " + floor);
      menubtn.children[i].click();
    }
  }
}

function exit_into_nvgation_mode() {
  map.flyTo({
    center: [map.getCenter().lng, map.getCenter().lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.343589520103954,
    duration: 4000,
    essential: true,
  });
}

function initializeApp() {
  initUI();
  setupMapEventHandlers();
  setupArrowAnimation();
}

initializeApp();
