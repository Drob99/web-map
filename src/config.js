// API & Mapbox settings
export const API_BASE = "https://api.nearmotion.com/api/public/v1/";
export const BASE_TOKEN =
  "pk.eyJ1Ijoibm1hY2NvdW50cyIsImEiOiJja2xhazRobjgzbDkxMm9xb2d3YmQ3d2s2In0.wGFavxo8mpa7OI_lEhYUow";
export const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v11";
export const CLIENT_ID = "5hk9KDD86eYhhcgpsA_FepLpC8g2iB5ic5htMUqhFtk";
export const CLIENT_SECRET = "V0VJtEnRetTK_QOwy7V1M1JxRsnUbggE0ehvK8Pd210";

// Animation constants
export const BASE_ARROWS_PER_KM = 80;
export const MIN_ARROWS = 0;
export const MAX_ARROWS = 100;
export const STEPS = 300;


export const index_pority = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -2, -3, -4, -5,
];

export const floors_titles = {
  "-5": "Basement 5th Floor",
  "-4": "Basement 4th Floor",
  "-3": "Basement 3rd Floor",
  "-2": "Basement 2nd Floor",
  "-1": "Basement Floor",
  0: "Ground floor",
  1: "First Floor",
  2: "Second Floor",
  3: "Third Floor",
  4: "Fourth Floor",
  5: "Fifth Floor",
  6: "Sixth Floor",
  7: "Seventh Floor",
  8: "Eighth Floor",
  9: "Ninth Floor",
  10: "Tenth Floor",
};

export const state = {
  Bearer_token: null,
  buildings_object: null,
  category_object: null,
  category_array: {},
  floors_objects: [],
  Layers_objects: [],
  floornametitle: [],
  outline_flag: false,
  level_array: {},
  Layersnames: [],
  toggleableLayerIds: [],

  POI_counter: 0,
  language: "EN",
  Poly_geojson_level: null,
  imageload_flag: true,
  current_lvl: 1,
  Level_route_poi: null,

  Route_buildings: {},
  Routes_array: {},
  elevator_level: null,
  elevators: [],
  elevatorsCount: 0,

  route_array: [],
  global_name: null,
  global_distance: null,
  global_time: null,
  global_zlevel: null,
  full_distance_to_destination: 0,
  full_time_to_destination: 0,

  All_POI_object: {
    type: "FeatureCollection",
    features: [
      {
        id: "",
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
        properties: {
          title: "",
          icon: "",
          subtitles: [],
          Center: [],
        },
      },
    ],
  },

  Full_path_route: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      },
    ],
  },
};
