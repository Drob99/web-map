/**
 * @module garden
 * @description Adds a fill layer for garden polygons, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds or updates a GeoJSON source and fill layer for garden data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to fetch.
 */
export function gardenLayer(layerId, data) {
  // Add or update the source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: 'geojson', data });
  }

  // Add the fill layer if missing
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': '#D5E6CF',
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

  // Hide the layer by default
  map.setLayoutProperty(layerId, 'visibility', 'none');
}