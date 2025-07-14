/**
 * @module walls
 * @description Adds or updates a fill layer for wall polygons, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds or updates a GeoJSON source and fill layer for wall data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to fetch.
 */
export function wallsLayer(layerId, data) {
  // Add or update the GeoJSON source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: 'geojson', data });
  }

  // Add the fill layer if missing
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
        "fill-extrusion-color": "#E6E9EC",
        "fill-extrusion-height": 3,
        "fill-extrusion-base": 0,
        "fill-extrusion-flood-light-ground-attenuation": 1,
        "fill-extrusion-vertical-gradient": true,
        "fill-extrusion-opacity": [
          "interpolate",
          ["exponential", 0.1],
          ["zoom"],
          16,
          0,
          22,
          1,
        ],
      }
    });
  }

  // Hide the layer by default
  map.setLayoutProperty(layerId, 'visibility', 'none');
}