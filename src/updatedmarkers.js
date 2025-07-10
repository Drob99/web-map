/**
 * @module markers
 * @description Handles map click events to place A/B markers and initiate routing.
 */
import { drawPathToPoi } from './data/routes.js';
import { clearRoute, routeEnabled } from './mapController.js';
import { map } from './mapInit.js';
import { state } from './config.js';
import * as airportMenu from './will_removed_script.js'; // Import the new module

// Marker state
let fromMarker = null;
let toMarker = null;
let fromPolygonId = null;
let toPolygonId = null;
let fromLng, fromLat, fromLevel, fromPoiName;
let toLng, toLat, toLevel, toPoiName;

// No longer need airportMenuInstance or getAirportMenuInstance() as we're using a module

/**
 * Sets up click handler on the 'polygons' layer.
 */
export function setupMapEventHandlers() {
  //map.on('click', 'polygons', handleMapClick);
}
map.on('click', 'polygons', handleMapClick);
map.on('moveend', updateFloorMenu);
/**
 * Handles map click to place or reset markers and start routing.
 * @param {Object} e - Mapbox event.
 */
function handleMapClick(e) {
  const feature = e.features[0];
  const coords = turf.centroid(feature).geometry.coordinates;
  const props = feature.properties;

  if (!toMarker) {
    airportMenu.expandMenu();
    airportMenu.showDirectionsView(feature);
    airportMenu.setCurrentLocation(feature);
    document.getElementById("menuArrow").style.display = "none";
    toPolygonId = feature.id;
    toLng = coords[0];
    toLat = coords[1];
    toLevel = props.level || 0;
    toPoiName = props.title || "Point B";
    toMarker = new mapboxgl.Marker(createMarkerEl("B", "#8B8ACC"))
      .setLngLat([coords[0], coords[1]])
      .addTo(map);
    if (state.routeEnabled) {
      clearRoute();
      const routeSummary = document.getElementById('routeSummary');
      routeSummary.style.display = 'none';

      const destinationInput = document.getElementById('destinationInput');
      if (destinationInput) {
          destinationInput.value = "";
      }

        const departureInput = document.getElementById('departureInput');
      if (departureInput) {
          departureInput.value = "";
      }
      
      airportMenu.endNavigation();
      airportMenu.showCategoriesView();
      airportMenu.clearLocations();

      const menuArrow = document.getElementById('menuArrow');
      if (menuArrow) {
          menuArrow.style.display = 'flex';
      }
    }

  } else if (!fromMarker) {
    if (feature.id === toPolygonId) {
      // alert("Please select a different polygon for source (A).");
      return;
    }

    fromPolygonId = feature.id;
    fromLng = coords[0];
    fromLat = coords[1];
    fromLevel = props.level || 0;
    fromPoiName = props.title || "Point A";
    fromMarker = new mapboxgl.Marker(createMarkerEl("A", "#3BB3D0"))
      .setLngLat([coords[0], coords[1]])
      .addTo(map);

    if (state.routeEnabled) {
     clearRoute();
      airportMenu.endNavigation();
      airportMenu.showCategoriesView();
      airportMenu.clearLocations();
    }
    document.getElementById("menuArrow").style.display = "none";
    airportMenu.selectDepartureLocation(feature)
    // drawPathToPoi(
    //   fromPoiName, fromLng, fromLat, fromLevel,
    //   toPoiName, toLng, toLat, toLevel
    // );

  } else {
    console.log("RESET MARKERS");
    resetMarkers();
  }
}


export function updateFloorMenu()
{
  const zoomLevel = map.getZoom();
	const menu = document.getElementById('menu');
	const floorItems = document.querySelectorAll('#menu a');

	if (zoomLevel <= 16) {

		floorItems.forEach(items => {
			if (items.innerHTML === "S" || items.innerHTML === "A" || items.innerHTML === "D" || items.innerHTML === "M" || items.innerHTML === "I") {
				items.style.display = 'none';
			}
			else {
				items.style.display = 'flex'
			}
		});

		return;
	}

	const mapCenter = map.getCenter();
	const centerPoint = turf.point([mapCenter.lng, mapCenter.lat]);

	let nearestPolygon = null;

	// Check if the map center is inside any polygon
	state.terminalsFloorsTitlesJson.features.forEach(feature => {
		const polygon = turf.polygon(feature.geometry.coordinates);

		// Check if the map center is inside the current polygon
		if (turf.booleanPointInPolygon(centerPoint, polygon)) {
			nearestPolygon = feature; // Store the polygon if it's the nearest one
		}
	});
	if (!nearestPolygon) {
		// If no polygon contains the center, hide all floor items
		floorItems.forEach(items => {
			if (items.innerHTML === "S" || items.innerHTML === "A" || items.innerHTML === "D" || items.innerHTML === "M" || items.innerHTML === "I") {
				items.style.display = 'none';
			}
			else {
				items.style.display = 'flex'
			}
		});
		return;
	}

	if (nearestPolygon.properties.name == "TP2 Parking") {

	}
	else {

	}
	const nearestFloors = new Set();
	const floorString = nearestPolygon.properties.floors;

	if (floorString) {
		try {
			var floorArray = JSON.parse(floorString); // Convert string to array
			floorArray = JSON.parse(floorArray); // Convert string to array

			if (Array.isArray(floorArray) && floorArray.length > 0) {
				floorArray.forEach(f => nearestFloors.add(String(f))); // Ensure string comparison
			} else {
				console.error("Invalid floor array:", floorArray);
			}
		} catch (e) {
			console.error("Invalid floor data:", floorString, e);
		}
	}

	// Show only nearest floors
	floorItems.forEach(item => {
		const floorName = item.innerText.replace('Floor ', '').trim();
		item.style.display = nearestFloors.has(floorName) ? 'flex' : 'none';
	});
}


export function loadTerminalsOutlines() {
  // If data is already fetched, return it as a resolved Promise
  if (state.terminalsFloorsTitlesJson) {
    return Promise.resolve(state.terminalsFloorsTitlesJson);
  }

  // Fetch the JSON file (adjust path as needed)
  return fetch('src/data/terminalsFloorstitle.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch terminals outlines: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      state.terminalsFloorsTitlesJson = data; // Store the result to avoid future fetches
      return state.terminalsFloorsTitlesJson;
    })
    .catch(err => {
      console.error('Error loading terminals outlines:', err);
      throw err;
    });
}



/**
 * Places the "A" marker at the clicked location.
 */
function placeFromMarker(id, [lng, lat], level, title) {
  fromPolygonId = id;
  fromLng = lng;
  fromLat = lat;
  fromLevel = level;
  fromPoiName = title;

  fromMarker = new mapboxgl.Marker(createMarkerEl("A", "#3BB3D0"))
    .setLngLat([lng, lat])
    .addTo(map);

  if (routeEnabled) clearRoute();
  flyToPointA(lng, lat);
}

/**
 * Places the "B" marker at the clicked location and draws the route.
 */
function placeToMarker(id, [lng, lat], level, title) {
  if (id === fromPolygonId) return;
  toPolygonId = id;
  toLng = lng;
  toLat = lat;
  toLevel = level;
  toPoiName = title;

  toMarker = new mapboxgl.Marker(createMarkerEl("B", "#8B8ACC"))
    .setLngLat([lng, lat])
    .addTo(map);

  if (routeEnabled) clearRoute();
  drawPathToPoi(
    fromPoiName,
    fromLng,
    fromLat,
    fromLevel,
    toPoiName,
    toLng,
    toLat,
    toLevel
  );
}

/**
 * Removes both A and B markers and resets marker state.
 */
export function resetMarkers() {
  if (fromMarker) fromMarker.remove();
  if (toMarker) toMarker.remove();

  fromMarker = null;
  toMarker = null;
  fromPoiName = toPoiName = '';
  fromLng = fromLat = fromLevel = undefined;
  toLng = toLat = toLevel = undefined;

  // No longer need to reset airportMenuInstance as it's managed by the module
}

/**
 * Flies camera to the "A" point.
 * @param {number} lng - Longitude.
 * @param {number} lat - Latitude.
 */
export function flyToPointA(lng, lat) {
  map.flyTo({
    center: [lng, lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 20.343589520103954,
    duration: 4000,
    essential: true,
  });
}

/**
 * Creates a styled DOM element for a marker label.
 * @param {string} letter - Marker label ("A" or "B").
 * @param {string} bgColor - Background color.
 * @returns {HTMLElement}
 */
function createMarkerEl(letter, bgColor) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="
      background:${bgColor};
      color:#fff;
      border-radius:50%;
      width:30px;
      height:30px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:bold;
      box-shadow:0 0 6px rgba(0,0,0,0.3);
    ">${letter}</div>
  `;
  return el.firstElementChild;
}


