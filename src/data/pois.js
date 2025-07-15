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

    if(poi.title == "room" || poi.title == "Room" )
	{
		poi.color = "#f7f5ed"
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
      terminal:getPoiTerminal([poi.longitude, poi.latitude]),
      location:"Terminal "+getPoiTerminal([poi.longitude, poi.latitude]),
      color: isNaN(poi.title) ? poi.color : '#CDD0CB',
	  working_hours : poi.working_hours
    }
  });
  
  // Update UI dropdowns
  //loadDropdownPoi(poi);
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

export function getPoiTerminal(center) {
    for (let i = 0; i < terminals_boundries.length; i++) {
        if (isInside(center, terminals_boundries[i])) {
            return i + 1; // Return terminal number (1-based)
        }
    }
    return 0; // No match found
}

function isInside(centerCoord, intendedArea) {
    if (!intendedArea) return false;

    const point = turf.point(centerCoord); // centerCoord = [lng, lat]
    const polygon = intendedArea.features[0]; // assuming only one polygon per terminal

    return turf.booleanPointInPolygon(point, polygon);
}


let terminals_boundries = [
	{
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[46.70171141624451, 24.96586782305689],
							[46.69740915298462, 24.9636210209986],
							[46.69753789901734, 24.96303742933773],
							[46.69878244400024, 24.96108237711173],
							[46.70346021652222, 24.96337785814286],
							[46.70171141624451, 24.96586782305689],
						],
					],
				},
			},
		],
	},
	{
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[46.69878244400024,24.96108237711173],
                        	[46.70043468475343,24.95850477323632],
                    		[46.70528411865235,24.96081975579015],
                        	[46.7036207,24.9634651],
                        	[46.7021101,24.9626984],
                        	[46.7021956,24.9616396],
                        	[46.701303,24.9611916],
							[46.7007588,24.9620752],
                        	[46.69878244400024,24.96108237711173]
						],
					],
				},
			},
		],
	},
	{
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[46.70043468475343, 24.95850477323632],
							[46.70209765434265, 24.95584929846356],
							[46.7069685459137, 24.95819351175757],
							[46.70528411865235, 24.96081975579015],
							[46.70043468475343, 24.95850477323632],
						],
					],
				},
			},
		],
	},
	{
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[46.70209765434265, 24.95584929846356],
							[46.70482277870179, 24.95145256230046],
							[46.7096507549286, 24.95449722153711],
							[46.7069685459137, 24.95819351175757],
							[46.70209765434265, 24.95584929846356],
						],
					],
				},
			},
		],
	},
	{
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[46.70805215835571, 24.94454586773382],
							[46.71257972717285, 24.94648172682466],
							[46.71671032905579, 24.94030438167143],
							[46.71163558959962, 24.93797928491837],
							[46.70805215835571, 24.94454586773382],
						],
					],
				},
			},
		],
	},
];


