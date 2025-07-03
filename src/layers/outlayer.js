/**
 * @module outlayer
 * @description Adds a line layer for outer boundary polygons, hidden by default.
 */
import { map } from "../mapInit.js";

/**
 * Adds or updates a GeoJSON source and line layer for outlayer data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to fetch.
 */
export function outlayerLayer(layerId, data) {
  // Add or update the GeoJSON source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: "geojson", data });
  }

  // Add the line layer if missing
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "line",
      source: layerId,
      minzoom: 14,
      paint: {
        "line-color": "#141414",
        "line-width": [
          "interpolate",
          ["exponential", 0.1],
          ["zoom"],
          16.4,
          0.5,
          22,
          3,
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
  }

  // Hide the layer by default
  map.setLayoutProperty(layerId, "visibility", "none");
}
