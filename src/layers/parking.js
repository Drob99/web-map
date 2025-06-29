/**
 * @module parking
 * @description Adds or updates a fill layer for parking area polygons, hidden by default.
 */
import { map } from '../mapInit.js';

/**
 * Adds or updates a GeoJSON source and fill layer for parking data.
 * @param {string} layerId - Unique identifier for the source and layer.
 * @param {Object|string} data - GeoJSON data object or URL to fetch.
 */
export function parkingLayer(layerId, data) {
  // Add or update the GeoJSON source
  if (map.getSource(layerId)) {
    map.getSource(layerId).setData(data);
  } else {
    map.addSource(layerId, { type: 'geojson', data });
  }

  // Add the fill layer if it doesn't exist
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': '#B2B2B2',
        'fill-outline-color': '#FFEBAF'
      }
    });
  }

  // Hide the layer by default
  map.setLayoutProperty(layerId, 'visibility', 'none');
}