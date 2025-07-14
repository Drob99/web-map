/**
 * @module mapInit
 * @description Creates and configures a Mapbox GL JS map instance.
 */
import { API_CONFIG } from "./config.js";

/**
 * Initializes and returns a Mapbox map.
 * @param {string} containerId - ID of the map container element.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.accessToken=API_CONFIG.ACCESS_TOKEN] - Mapbox access token.
 * @param {string} [options.style=API_CONFIG.MAPBOX_STYLE] - Mapbox style URL.
 * @param {[number, number]} [options.center=[-74.5, 40]] - Initial map center [lng, lat].
 * @param {number} [options.zoom=9] - Initial zoom level.
 * @param {string} [options.navPosition='bottom-right'] - Navigation control position.
 * @returns {mapboxgl.Map} The initialized Mapbox map instance.
 */



export function initMap(
  containerId,
  {
    accessToken = API_CONFIG.ACCESS_TOKEN,
    style = API_CONFIG.MAPBOX_STYLE,
    center = [46.711762437094904, 24.94216603094368],
    zoom = 9,
    bearing = 61.599999999998886,
    pitch = 56.5,
    navPosition = "bottom-right",
  } = {}
) {
  mapboxgl.accessToken = accessToken;
  if (typeof mapboxgl.setTelemetryEnabled === "function") {
    mapboxgl.setTelemetryEnabled(false); // Disable telemetry if supported
  }
  if (typeof mapboxgl.setPerformanceEnabled === "function") {
    mapboxgl.setPerformanceEnabled(false); // Disable performance monitoring if supported
  }
  
  mapboxgl.setRTLTextPlugin(
    "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js",
    null,
    true // Lazy load the plugin
  );

  const map = new mapboxgl.Map({
    container: containerId,
    style,
    center,
    zoom,
    bearing,
    pitch,
    preserveDrawingBuffer: true
  });

  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), navPosition);

  // Adjust 3D buildings layer range on style load
  map.on("style.load", () => {
    const layerId = "3d-buildings";
    if (map.getLayer(layerId)) {
      map.setLayerZoomRange(layerId, 0, 15.7);
    }
    // Update Mapbox attribution link
    document.querySelector(".mapboxgl-ctrl-logo").href =
      "https://nearmotion.com/";

    map.setLight({
		'anchor': 'map',
		'color': 'white',
		'intensity': 0.05, // Adjust intensity as needed
		'position': [1.5, 180, 80] // Position the light in a way to minimize shadows
	});
  });

  return map;
}

// Initialize default map instance (for legacy usage)
export const map = initMap("map");
