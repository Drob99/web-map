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
	const terminal = getPoiTerminal([poi.longitude, poi.latitude]);

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
	  location: terminal === 6 ? 'Private Aviation' : terminal === 0 ? 'Unknown Terminal' : 'Terminal ' + terminal,
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
							[
                            46.7020481,
                            24.9659483
                        ],
                        [
                            46.6972529,
                            24.9635436
                        ],
                        [
                            46.69878244400024,
                            24.96108237711173
                        ],
                        [
                            46.7036215,
                            24.9634651
                        ],
                        [
                            46.7020481,
                            24.9659483
                        ]
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
							[
                            46.69878244400024,
                            24.96108237711173
                        ],
                        [
                            46.70043468475343,
                            24.95850477323632
                        ],
                        [
                            46.7052258,
                            24.9609114
                        ],
                        [
                            46.7036207,
                            24.9634651
                        ],
                        [
                            46.69878244400024,
                            24.96108237711173
                        ]
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
							[
                            46.70043468475343,
                            24.95850477323632
                        ],
                        [
                            46.7021717,
                            24.9557422
                        ],
                        [
                            46.7069542,
                            24.9581884
                        ],
                        [
                            46.7052269,
                            24.960912
                        ],
                        [
                            46.70043468475343,
                            24.95850477323632
                        ]
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
							[
                            46.7021717,
                            24.9557422
                        ],
                        [
                            46.7040453,
                            24.9527804
                        ],
                        [
                            46.7087937,
                            24.9552257
                        ],
                        [
                            46.7069577,
                            24.9581875
                        ],
                        [
                            46.7021717,
                            24.9557422
                        ]
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
							 [
                            46.7075948,
                            24.9443922
                        ],
                        [
                            46.7121187,
                            24.9371707
                        ],
                        [
                            46.7168926,
                            24.939612
                        ],
                        [
                            46.7123893,
                            24.9467998
                        ],
                        [
                            46.7075948,
                            24.9443922
                        ]
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
							[
                            46.7250416,
                            24.9637358
                        ],
                        [
                            46.7238218,
                            24.9631056
                        ],
                        [
                            46.7247675,
                            24.9616043
                        ],
                        [
                            46.7259851,
                            24.9622328
                        ],
                        [
                            46.7250416,
                            24.9637358
                        ]
						],
					],
				},
			},
		],
	},
];


