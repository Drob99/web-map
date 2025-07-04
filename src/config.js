/**
 * @module config
 * @description Centralized configuration constants and default application state.
 */

/**
 * API and Mapbox settings.
 */
export const API_CONFIG = Object.freeze({
  BASE_URL: "https://mapsapi.kkia.sa/api/public/v1/",
  ACCESS_TOKEN:"pk.eyJ1Ijoibm1hY2NvdW50cyIsImEiOiJja2xhazRobjgzbDkxMm9xb2d3YmQ3d2s2In0.wGFavxo8mpa7OI_lEhYUow",
  MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v11",
  CLIENT_ID: "pqXhZPUYSu4WS7I93slT13ngFhUChqM-URiH0YaPh74",
  CLIENT_SECRET: "OODWYKVd_Lt3pfPTAXvPiQd3MkaKPi-YSFwd6W4knI8",
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
export const INDEX_PRIORITY = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -2, -3, -4, -5
];

/**
 * Floor index to title mappings.
 */
export const FLOOR_TITLES = {
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
};

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
  currentLevel: 0,
  levelRoutePoi: null,
  routeBuildings: {},
  routesArray: {},
  elevatorLevel: null,
  elevators: [],
  elevatorCount: 0,
  routeArray: [],
  globalIcon: null,
  globalStartKey: null,
  globalEndKey: null,
  globalName: null,
  globalDistance: null,
  globalTime: null,
  globalZLevel: null,
  activeTools : new Set(),
  fullDistanceToDestination: 0,
  fullTimeToDestination: 0,
  isBlackWhite : false,
	isInverted : false,
  isLetterSpaced : false,
  spacing : false ? 0.3 : 0,
  isLineSpaced : false,
  lineHeight : false ? 2 : 1.2,
  isBigText : false,
  size :false ? 20 : 14,
  isSimpleFont : false,
  isSpeechEnabled : false,
  isAnimationPaused : false,
  from_lg  :null,
  from_lt  : null,
  from_lvl :null,
  from_poi_name : null,
  toLng : null,
  toLat : null,
  toLevel : null,
  toPoiName : null,
  fromPolygonId : null,
  toPolygonId : null,
  font : false? ['Arial Unicode MS Regular']: ['Arial Unicode MS Regular'],
  allPoiGeojson: {
    type: 'FeatureCollection',
    features: [
      {
        id: '',
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {
          title: '',
          icon: '',
          subtitles: [],
          center: [],
        },
      },
    ],
  },
  fullPathRoute: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: Object.freeze({ type: 'LineString', coordinates: [] })
      },
    ],
  },
  routeEnabled : false,
  fromMarkerLocation: [],
  toMarkerLocation: [],
  fromMarkerLevel: null,
  toMarkerLevel: null,
  excludeList: [
    "24b bus gate",
    "25b bus gate",
    "a - counters",
    "ablution",
    "ablution room",
    "admin",
    "agricult & baggage info",
    "airport & engineering workshop",
    "airport authority admin",
    "airport immigration manager office",
    "airport office",
    "airport operation department tr2 arrival level",
    "airport operation terminal storage",
    "airport security",
    "airside lighting shop",
    "airside storage",
    "arrival baggage control room",
    "assistant",
    "assistant immigration officer",
    "atm",
    "b - counters",
    "bag cart pass thru",
    "baggage ramp",
    "baggage sortation hall workshop",
    "baggage staff lounge",
    "baggage staff toilet",
    "baggage supervision",
    "baggage supervisor",
    "bank",
    "barber",
    "barber room",
    "bc",
    "bed room",
    "best",
    "bhs baggage storage",
    "bhs enclosure",
    "bhs operation manager",
    "bhs operation room",
    "bhs security operation room",
    "bms workstation",
    "body scan",
    "break",
    "break room",
    "building distributor",
    "business class seating area",
    "c - counters",
    "cafeteria",
    "cafeteria entry",
    "card board recycle waste storage",
    "carpentry",
    "chemical room",
    "cigar lounge",
    "cleaners office duty manager",
    "cleaners room",
    "cleaning chemical storage",
    "clinic reception",
    "coffee area",
    "cold room",
    "commander",
    "control room",
    "crew waiting area",
    "custom store",
    "customer care",
    "customer services",
    "d - counters",
    "data c. ups room",
    "data center ups",
    "data room",
    "data system room",
    "dc1-fm200",
    "department chief",
    "detective office",
    "detention lounge",
    "digital radio comms and charging station",
    "discharge pump room",
    "dish wash & storage",
    "dock office",
    "dock toilet",
    "drivers toilet",
    "dry storage",
    "duty officer office",
    "ecbs room",
    "ef!&tsp fm200",
    "ef1",
    "ef1&tsp-ups",
    "el room",
    "elect. room",
    "electric room",
    "electrical room",
    "employee entrance",
    "enquiry",
    "enterprise",
    "exam",
    "exam / observation",
    "exam / observation isolation",
    "executive business lounge",
    "executive meeting room",
    "f&b",
    "family room",
    "fd",
    "female check room",
    "female detention observation room",
    "female detention room",
    "female inspection",
    "female inspection & investigation",
    "female inspection area",
    "female office",
    "female returnees lounge",
    "female search room",
    "female staff break",
    "female staff lockers airline",
    "fire control",
    "first class dining",
    "flight crew center",
    "food & beverage",
    "fvr-1",
    "fvr-2",
    "general recycle waste storage",
    "general store",
    "gid office",
    "gid supervisor officer",
    "glass recycle waste storage",
    "goods receive office",
    "goods store",
    "gsm room",
    "gulf cart and charging area",
    "gvip hall",
    "health staff lockers",
    "health staff lounge",
    "holding female",
    "holding male",
    "hvac area",
    "ict service unit",
    "immigration office",
    "immigration officer",
    "immunization",
    "incoming water room",
    "intelligence office",
    "international hall",
    "international terminal fire panel room",
    "investigation office",
    "it & tsp",
    "it & tsp ",
    "it data center",
    "it manager room",
    "it office",
    "it room",
    "kid's station",
    "kids room",
    "kitchen",
    "landing",
    "list control",
    "list office",
    "lobby",
    "locker room",
    "lounge area",
    "lounge d-5",
    "lounge premium",
    "lounge terminal op",
    "lunch room",
    "majelis",
    "male detention observation room",
    "male detention room",
    "male lockers room",
    "male officer & registration",
    "male returnees lounge",
    "male search room",
    "male staff break",
    "male staff lockers",
    "male staff lockers mechanical services",
    "male waiting",
    "manager office",
    "massage",
    "massage room",
    "mdb room",
    "mdb-1",
    "meat & poultry preparation",
    "mechanical room",
    "medical recycle waste storage",
    "meeting",
    "meeting room",
    "metal recycle waste storage",
    "moi",
    "mother room",
    "mother's room",
    "moving walkway to departure",
    "narcotics duty officer",
    "narcotics laboratory",
    "nic building distributor",
    "nonpublic",
    "nurses lounge",
    "office",
    "office (terminal op)",
    "office gid",
    "office luggage",
    "office terminal op",
    "officer office",
    "officer room",
    "ogg storage",
    "oog counter",
    "oog desk",
    "open prayer area",
    "opentobelow",
    "operation",
    "organic recycle waste storage",
    "paint shop",
    "paper recycle waste storage",
    "parking terminal 5",
    "passenger transfer desk",
    "passport",
    "passport immigration office area",
    "passport ladies lounge",
    "pastry prepration",
    "plastic recycle waste storage",
    "porters lounge",
    "pot wash",
    "prayer area",
    "private declare",
    "private lounge",
    "public phones",
    "rac & support services",
    "rac meeting room",
    "rac office",
    "rac printer room",
    "rac store",
    "rac storage",
    "ramp",
    "reception",
    "reconc room",
    "restroom gid",
    "resuscitation",
    "retail",
    "retail spot",
    "rmu",
    "room",
    "rum room",
    "safety department office",
    "sale's manager office",
    "sales manager office",
    "saudi gov. affairs",
    "screening station",
    "search room",
    "secretary",
    "security",
    "security check",
    "security manager gid",
    "security office",
    "server",
    "service",
    "service elevator",
    "services and facilities department",
    "shop",
    "shuttle bus terminal",
    "sick bay",
    "special care lounge",
    "special needs",
    "staff dining room",
    "staff entrance",
    "staff office",
    "staff screening",
    "staff screnning",
    "staff security check area",
    "staff security check point",
    "staff toilet",
    "storage",
    "storage / ef room",
    "store",
    "substation room",
    "tbd",
    "tele equip room",
    "terminal security",
    "tr-01",
    "tr-02",
    "traffic police office",
    "transfer passenger hall",
    "trolley repair room",
    "ups",
    "ups room",
    "vegetable preparation",
    "vestibule",
    "viewing area",
    "vip check in counters",
    "vip hall duty manager",
    "vip hall main reception",
    "vip hall manager",
    "vip lounge",
    "vip/gvip arrival gate",
    "vip/gvip departure gate",
    "waiting area",
    "waste storage",
    "watch post",
    "women inspection",
    "workshop",
    "terminal 5",
    "terminal 4",
    "terminal 3",
    "terminal 2",
    "terminal 1",
    "travelator to departure",
    "saudi customs",
    "passport control",
    "telecom room",
    "passports counter",
    "al dalah coffee lounge",
    "courtyard dining",
  ],
};