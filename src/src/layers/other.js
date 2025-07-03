/**
 * @module other
 * @description Adds a line layer for miscellaneous features, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds or updates a GeoJSON source and line layer for 'other' data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL.
 */
export function otherLayer(layerId, data) {
  // Add or update the GeoJSON source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: 'geojson', data });
  }

  // Add the line layer if it doesn't exist
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'line',
      source: layerId,
      paint: {
        'line-color': '#969696',
        'line-width': 0.7,
        'line-opacity': [
          'interpolate',
          ['exponential', 0.1],
          ['zoom'],
          16.4, 0,
          20.31967926651499, 1
        ]
      }
    });
  }

  // Hide the layer by default
  map.setLayoutProperty(layerId, 'visibility', 'none');
}