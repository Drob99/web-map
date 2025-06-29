/**
 * @module corridors
 * @description Adds a fill layer for corridor polygons, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds or updates a GeoJSON source and fill layer for corridor data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to fetch.
 */
export function corridorsLayer(layerId, data) {
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
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': '#ffffff',
        'fill-outline-color': '#828282',
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