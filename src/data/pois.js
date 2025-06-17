import { API_BASE, state } from "../config.js";
import { Load_dropdown_pois } from "../ui.js";
import { map } from "../mapInit.js";

/**
 * Wrapper for XMLHttpRequest to return a promise for POI data
 */
export function fetchPOIData(building_id, floor_id, token = state.Bearer_token) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      API_BASE + "buildings/" + building_id + "/floors/" + floor_id + "/pois",
      true
    );
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("accept", "application/json");
    xhr.setRequestHeader("Content-Encoding", "gzip");

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error("Failed to load POIs: " + xhr.statusText));
      }
    };

    xhr.onerror = function () {
      reject(new Error("An error occurred during the XMLHttpRequest"));
    };

    xhr.send();
  });
}

export var all_pois_loaded = false;
export var Pois_counter_level = 0;

/**
 * Fetch and process all POIs for one floor
 */
export async function get_All_POI(floor_id, floor_title, token = state.Bearer_token, building_id) {
  try {
    const POI_object_floor = await fetchPOIData(building_id, floor_id, token);
    await start_poi(POI_object_floor);

    Pois_counter_level++;
    // when all are loaded, UI will handle the rest
    // (originally compares to sortedInput.length in map.js)
  } catch (error) {
    console.error("Error fetching POIs:", error);
  }
}

/** Kick off POI processing */
export async function start_poi(POI_object) {
  return poi(POI_object);
}

/** Iterate through each POI in descending order */
export async function poi(POI_object) {
  for (let r = POI_object.building_pois.length - 1; r >= 0; r--) {
    POI_properties(POI_object.building_pois[r]);
  }
}

/** Build the GeoJSON feature and enqueue its icon, then add to dropdown */
export function POI_properties(POI_object) {
  var POI_coordinates = [];
  var image_url = "";
  var image_name = "";

  if (POI_object.icon && (POI_object.icon.url || POI_object.icon.filename)) {
    image_url = POI_object.icon.url;
    image_name = POI_object.icon.filename;
    get_image(image_url, image_name);
  }

  for (var j = 0; j < POI_object.coordinates.length; j++) {
    POI_coordinates.push([
      POI_object.coordinates[j].longitude,
      POI_object.coordinates[j].latitude,
    ]);
  }

  var tit_ = isNaN(POI_object.title) ? POI_object.title : "";
  var color = isNaN(POI_object.title) ? POI_object.color : "#CDD0CB";

  state.All_POI_object.features[state.POI_counter] = {
    id: POI_object.id,
    type: "Feature",
    properties: {
      title: tit_,
      icon: image_name,
      icon_url: image_url,
      category_id: POI_object.category_id,
      subtitles: POI_object.subtitles,
      Center: [POI_object.longitude, POI_object.latitude],
      Level: state.level_array[POI_object.building_floor_id],
      Color: color,
    },
    geometry: {
      coordinates: [POI_coordinates],
      type: "Polygon",
    },
  };

  Load_dropdown_pois(POI_object);
}

/** Load or cache the POI icon into Mapbox */
export async function get_image(url, name) {
  map.loadImage(url, function (error, image) {
    if (error) throw error;
    if (!map.listImages().includes(name)) {
      map.addImage(name, image);
    }
  });
}