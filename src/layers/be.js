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
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': '#DEF7FF',
        'fill-outline-color': '#9c9c9c',
        'fill-opacity': [
          'interpolate',
          ['exponential', 0.1],
          ['zoom'],
          16.4, 0,
          20.31967926651499, 1
        ]
      }
    });
  }

  // Default to hidden
  map.setLayoutProperty(layerId, 'visibility', 'none');
}