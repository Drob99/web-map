/**
 * @module pois
 * @description Fetches and processes POI data per floor, updating state and UI dropdowns.
 */
import { API_CONFIG, state } from '../config.js';
import { loadDropdownPoi } from '../ui.js';
import { map } from '../mapInit.js';

/**
 * Fetches POI data for a specific building and floor.
 * @param {string|number} buildingId - ID of the building.
 * @param {string|number} floorId - ID of the floor.
 * @param {string} [token=state.bearerToken] - OAuth bearer token.
 * @returns {Promise<Object>} Resolves with the POI JSON object.
 */
export async function fetchPoiData(buildingId, floorId, token = state.bearerToken) {
  const url = `${API_CONFIG.BASE_URL}buildings/${buildingId}/floors/${floorId}/pois`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to load POIs: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Loads and processes all POIs for a given floor.
 * @param {string|number} buildingId - ID of the building.
 * @param {string|number} floorId - ID of the floor.
 * @param {string} [token=state.bearerToken] - OAuth bearer token.
 */
export async function getAllPoi(buildingId, floorId, token = state.bearerToken) {
  try {
    const apiResult = await fetchPoiData(buildingId, floorId, token);
    // push into state.allPoiGeojson via processPoiBatch
    const beforeCount = state.allPoiGeojson.features.length;
    processPoiBatch(apiResult);

    const newFeatures = state.allPoiGeojson.features.slice(beforeCount);
    return { type: 'FeatureCollection', features: newFeatures };
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return null;
  }
}

/**
 * Processes a batch of POIs, adding them to state and UI.
 * @param {Object} poiData - Raw POI data for the floor.
 */
function processPoiBatch(poiData) {
  // Iterate in reverse to match original ordering
  for (let i = poiData.building_pois.length - 1; i >= 0; i--) {
    processPoiProperties(poiData.building_pois[i]);
  }
}

/**
 * Processes individual POI properties, updates state, and adds to dropdown.
 * @param {Object} poi - Single POI object.
 */
function processPoiProperties(poi) {
  // Prepare coordinates array
  const coordinates = poi.coordinates.map(c => [c.longitude, c.latitude]);

  // Handle icon loading
  const iconUrl = poi.icon?.url;
  const iconName = poi.icon?.filename;
  if (iconUrl && iconName) {
    loadPoiImage(iconUrl, iconName);
  }

  // Add GeoJSON feature to state
  state.allPoiGeojson.features.push({
    id: poi.id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coordinates] },
    properties: {
      title: isNaN(poi.title) ? poi.title : '',
      icon: iconName,
      iconUrl,
      category_id: poi.category_id,
      subtitles: poi.subtitles,
      subcategories: poi.subcategories,
      center: [poi.longitude, poi.latitude],
      level: state.levelArray[poi.building_floor_id],
      color: isNaN(poi.title) ? poi.color : '#CDD0CB'
    }
  });

  // Update UI dropdowns
  loadDropdownPoi(poi);
}

/**
 * Loads a POI icon into the Mapbox map if not already present.
 * @param {string} url - URL of the icon image.
 * @param {string} name - Unique image name identifier.
 */
export function loadPoiImage(url, name) {
  map.loadImage(url, (error, image) => {
    if (error) throw error;
    if (!map.hasImage(name)) {
      map.addImage(name, image);
    }
  });
}