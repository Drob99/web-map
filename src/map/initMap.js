// src/map/initMap.js
/**
 * Initialize and return a Mapbox map instance.
 * @param {string} containerId  – ID of the HTML container (e.g. 'map')
 * @param {object} options      – mapbox-gl Map constructor options
 * @returns {mapboxgl.Map}
 */
export function initMap(containerId, options = {}) {
  // 1. Set access token
  mapboxgl.accessToken = options.accessToken;

  // 2. Create the map
  const map = new mapboxgl.Map({
    container: containerId,
    center: options.center || [-74.5, 40],
    zoom: options.zoom || 9,
    style: options.style, // you can pass your style URL here
  });

  // 3. Add navigation controls
  map.addControl(
    new mapboxgl.NavigationControl(),
    options.navPosition || "bottom-right"
  );

  // 4. Hook the style.load for any global tweaks
  map.on("style.load", () => {
    // bump up building layer zoom cutoff
    map.style._mergedLayers["3d-buildingbasemap"].maxzoom = 15.7;
    // re-target the logo link
    document.querySelector(".mapboxgl-ctrl-logo").href =
      "https://nearmotion.com/";
  });

  return map;
}
