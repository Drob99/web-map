/**
 * @module markers
 * @description Handles map click events to place A/B markers and initiate routing.
 */
import { drawPathToPoi } from './data/routes.js';
import { clearRoute, routeEnabled } from './mapController.js';
import { map } from './mapInit.js';
import { state } from './config.js';



// Marker state
let fromMarker = null;
let toMarker = null;
let fromPolygonId = null;
let toPolygonId = null;
let fromLng, fromLat, fromLevel, fromPoiName;
let toLng, toLat, toLevel, toPoiName;
const airportMenu = new window.AirportMenuComponent;

/**
 * Sets up click handler on the 'polygons' layer.
 */
export function setupMapEventHandlers() {
  //map.on('click', 'polygons', handleMapClick);
}
map.on('click', 'polygons', handleMapClick);
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
    console.log("airportMenu");
    console.log("LOCATION ",airportMenu.currentLocation);
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
      airportMenu.endNavigation();
      airportMenu.showCategoriesView();
      airportMenu.clearLocations();
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
  fromPolygonId = null;
  toPolygonId = null;
  fromPoiName = toPoiName = '';
  fromLng = fromLat = fromLevel = undefined;
  toLng = toLat = toLevel = undefined;
}

/**
 * Flies camera to the "A" point.
 * @param {number} lng - Longitude.
 * @param {number} lat - Latitude.
 */
function flyToPointA(lng, lat) {
  map.flyTo({
    center: [lng, lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.343589520103954,
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