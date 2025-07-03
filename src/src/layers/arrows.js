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
        'fill-color': '#ffffff',
        'fill-outline-color': '#ffffff'
      }
    });
  }

  // Hide the layer by default
  map.setLayoutProperty(layerId, 'visibility', 'none');
}