/**
 * @module arrows
 * @description Adds an arrow polygon source and fill layer, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds a GeoJSON source and corresponding fill layer for arrow polygons.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to load.
 */
export function arrowsLayer(layerId, data) {
  // Add or update the GeoJSON source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: 'geojson', data });
  }

  // Add the fill layer if not already present
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      layout: {},
      paint: {
        "fill-color": [
				"case",
				["has", "color"], ["get", "color"],
				"#ffffff" // Default color if not found
			],
        'fill-outline-color': '#ffffff',
        "fill-opacity": [
				"interpolate",
				["exponential", 0.1],
				["zoom"],
				16, 0,
				20.31967926651499,
				["case", ["has", "opacity"], ["get", "opacity"], 1]
			],
      }
    });
  }

  // Hide the layer by default
  map.setLayoutProperty(layerId, 'visibility', 'none');
}