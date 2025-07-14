/**
 * @module be
 * @description Adds a fill layer for building elevation (BE) polygons, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds or updates a GeoJSON source and fill layer for BE data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to fetch.
 */
export function beLayer(layerId, data) {
  // Add or update source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: 'geojson', data });
  }

  // Add layer if missing
if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'fill-extrusion',
      source: layerId,
      paint: {
        'fill-extrusion-ambient-occlusion-intensity': 0.2,  // Default: 0.3
        'fill-extrusion-ambient-occlusion': false,
        'fill-extrusion-color': '#e0e0e0',  // Lighter base color
        'fill-extrusion-emissive-strength': 0.1,  // Default: 0
        'fill-extrusion-emissive': '#ffffff',
       "fill-extrusion-color": [
          "case",
          ["has", "color"], ["get", "color"],
          "#D8D3CD" // Default color if not found
        ],
        "fill-extrusion-height": [
            "case",
            ["has", "height"], ["get", "height"],
            1 // Default height if not found
        ],
          "fill-extrusion-opacity": [
            "interpolate",
            ["exponential", 0.1],
            ["zoom"],
            16,
            0,
            20.31967926651499,
            1,
        ],
      }
    });
  }

  // Default to hidden
  map.setLayoutProperty(layerId, 'visibility', 'none');
}