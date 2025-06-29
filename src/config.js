/**
 * @module config
 * @description Centralized configuration constants and default application state.
 */

/**
 * API and Mapbox settings.
 */
export const API_CONFIG = Object.freeze({
  BASE_URL: "https://api.nearmotion.com/api/public/v1/",
  ACCESS_TOKEN:"pk.eyJ1Ijoibm1hY2NvdW50cyIsImEiOiJja2xhazRobjgzbDkxMm9xb2d3YmQ3d2s2In0.wGFavxo8mpa7OI_lEhYUow",
  MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v11",
  CLIENT_ID: "5hk9KDD86eYhhcgpsA_FepLpC8g2iB5ic5htMUqhFtk",
  CLIENT_SECRET: "V0VJtEnRetTK_QOwy7V1M1JxRsnUbggE0ehvK8Pd210",
});

/**
 * Animation-related constants.
 */
export const ANIMATION_CONFIG = Object.freeze({
  BASE_ARROWS_PER_KM: 80,
  MIN_ARROWS: 0,
  MAX_ARROWS: 100,
  STEPS: 300
});

/**
 * Rendering priority indexes.
 */
export const INDEX_PRIORITY = Object.freeze([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -2, -3, -4, -5
]);

/**
 * Floor index to title mappings.
 */
export const FLOOR_TITLES = Object.freeze({
  '-5': 'Basement 5th Floor',
  '-4': 'Basement 4th Floor',
  '-3': 'Basement 3rd Floor',
  '-2': 'Basement 2nd Floor',
  '-1': 'Basement Floor',
  '0': 'Ground Floor',
  '1': 'First Floor',
  '2': 'Second Floor',
  '3': 'Third Floor',
  '4': 'Fourth Floor',
  '5': 'Fifth Floor',
  '6': 'Sixth Floor',
  '7': 'Seventh Floor',
  '8': 'Eighth Floor',
  '9': 'Ninth Floor',
  '10': 'Tenth Floor'
});

/**
 * Default application state.
 */
export const state = {
  bearerToken: null,
  buildingsObject: null,
  categoryObject: null,
  categoryArray: {},
  floorsObjects: [],
  layersObjects: [],
  floorNameTitle: [],
  outlineFlag: false,
  levelArray: {},
  layerNames: [],
  toggleableLayerIds: [],
  poiCounter: 0,
  language: 'EN',
  polyGeojsonLevel: null,
  imageLoadFlag: true,
  currentLevel: 1,
  levelRoutePoi: null,
  routeBuildings: {},
  routesArray: {},
  elevatorLevel: null,
  elevators: [],
  elevatorCount: 0,
  routeArray: [],
  globalStartKey: null,
  globalEndKey: null,
  globalName: null,
  globalDistance: null,
  globalTime: null,
  globalZLevel: null,
  fullDistanceToDestination: 0,
  fullTimeToDestination: 0,
  allPoiGeojson: {
    type: 'FeatureCollection',
    features: [
      Object.freeze({
        id: '',
        type: 'Feature',
        geometry: Object.freeze({ type: 'Polygon', coordinates: [] }),
        properties: Object.freeze({
          title: '',
          icon: '',
          subtitles: [],
          center: []
        })
      })
    ]
  },
  fullPathRoute: {
    type: 'FeatureCollection',
    features: [
      Object.freeze({
        type: 'Feature',
        geometry: Object.freeze({ type: 'LineString', coordinates: [] })
      })
    ]
  },
  fromMarkerLocation: [],
  toMarkerLocation: [],
  fromMarkerLevel: null,
  toMarkerLevel: null
};