//! Global Variables
var Bearer_token,
  buildings_object,
  category_object,
  category_array = {},
  floors_objects = new Array(),
  Layers_objects = new Array(),
  floornametitle = [],
  outline_flag = false,
  level_array = {},
  Layersnames = [],
  toggleableLayerIds = [];
var index_pority = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -2, -3, -4, -5],
  POI_counter = 0,
  language = "EN",
  Poly_geojson_level,
  imageload_flag = true,
  current_lvl = 0,
  Level_route_poi,
  Route_buildings = {},
  Routes_array = {},
  graph = new Graph(),
  elevator_level,
  elevators = new Array();
var elevatorsCount = 0;
var floors_titles = {
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

var route_array = [];
var global_name, global_distance, global_time, global_zlevel, global_icon;
var full_distance_to_destination = 0;
var full_time_to_destination = 0;

var All_POI_object = {
  type: "FeatureCollection",
  features: [
    {
      id: "",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [],
      },
      properties: {
        title: "",
        icon: "",
        subtitles: [],
        Center: [],
      },
    },
  ],
};

var Full_path_route = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    },
  ],
};

//! Initialize Map
function initMap(containerId, opts) {
  // 1) set token
  mapboxgl.accessToken = opts.token;
  // 2) create map
  const m = new mapboxgl.Map({
    container: containerId,
    center: opts.center,
    zoom: opts.zoom,
    style: opts.style,
  });
  // 3) nav controls
  m.addControl(new mapboxgl.NavigationControl(), opts.navPosition);
  // 4) style tweak (guarded so we don’t blow up if layer is missing)
  m.on("style.load", () => {
    if (m.getLayer("3d-buildingbasemap")) {
      m.setLayerZoomRange("3d-buildingbasemap", 0, 15.7);
    }
    document.querySelector(".mapboxgl-ctrl-logo").href =
      "https://nearmotion.com/";
  });
  return m;
}

// Bring back the same global you were using:
const map = initMap("map", {
  token:
    "pk.eyJ1Ijoibm1hY2NvdW50cyIsImEiOiJja2xhazRobjgzbDkxMm9xb2d3YmQ3d2s2In0.wGFavxo8mpa7OI_lEhYUow",
  center: [-74.5, 40],
  zoom: 9,
  style: "mapbox://styles/mapbox/streets-v11",
  navPosition: "bottom-right",
});

//! Initialize UI
function initUI() {
  $("#from_location").select2({
    matcher: matchCustom,
    templateResult: formatCustom,
  });

  $("#to_location").select2({
    matcher: matchCustom,
    templateResult: formatCustom,
  });

  $("#from_location, #to_location").on("select2:select", function () {
    const fromValue = $("#from_location").val();
    const toValue = $("#to_location").val();

    if (fromValue && toValue) {
      select_dropdown_list_item();
    }
  });

  $(".swap-btn").on("click", function () {
    const fromVal = $("#from_location").val();
    const toVal = $("#to_location").val();

    // Swap the values
    $("#from_location").val(toVal).trigger("change");
    $("#to_location").val(fromVal).trigger("change");

    // Optional: If you want to explicitly trigger the select2:select event handlers again
    // for both fields (in case .trigger('change') doesn't fire them in your version/setup)
    $("#from_location").trigger({
      type: "select2:select",
      params: { data: $("#from_location").select2("data")[0] },
    });

    $("#to_location").trigger({
      type: "select2:select",
      params: { data: $("#to_location").select2("data")[0] },
    });
  });
}

//! Mathcing & Formaatting Helpers
function stringMatch(term, candidate) {
  return candidate && candidate.toLowerCase().indexOf(term.toLowerCase()) >= 0;
}

function matchCustom(params, data) {
  // If there are no search terms, return all of the data
  if ($.trim(params.term) === "") {
    return data;
  }
  // Do not display the item if there is no 'text' property
  if (typeof data.text === "undefined") {
    return null;
  }
  // Match text of option
  if (stringMatch(params.term, data.text)) {
    return data;
  }
  // Match attribute "data-foo" of option
  if (stringMatch(params.term, $(data.element).attr("data-foo"))) {
    return data;
  }
  // Return `null` if the term should not be displayed
  return null;
}

function formatCustom(state) {
  if (!state.id) return state.text;

  const iconUrl = $(state.element).attr("data-icon");

  return $(
    `<div style="display: flex; align-items: center;">
            <img src="${iconUrl}" style="width: 35px; height: 35px; margin-right: 15px;" />
            <div>
                <div>${state.text}</div>
                <div class="foo" style="font-size: 0.8em; color: gray;">${$(
                  state.element
                ).attr("data-foo")}</div>
            </div>
        </div>`
  );
}

//! Time a& Screensaver
function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}

// function screensaver() {
//   setTimeout(() => {
//     const splash = document.getElementById("splash-screen");
//     splash.style.width = "unset";
//     splash.style.height = "unset";
//     splash.style.display = "none";
//     splash.classList.add("fade-out");
//     document.getElementsByClassName("loader-wrapper")[0].style.display = "none";
//     setTimeout(() => splash.classList.add("hidden"), 500);
//   }, 3000);
// }

//! Auth & Data Loading
function isAccessTokenExpired() {
  const createdAt = localStorage.getItem("created_at"); // Time when the token was created
  const expiresIn = localStorage.getItem("expires_in"); // Expiry time in seconds
  const currentTime = getCurrentTime();
  return currentTime >= parseInt(createdAt) + parseInt(expiresIn);
}

function get_Authentication(Visitor_ID, Visitor_Secret) {
  localStorage.clear();
  sessionStorage.clear();
  if (!localStorage.getItem("access_token") || isAccessTokenExpired()) {
    var settings = {
      url: "https://api.nearmotion.com/api/public/v1/saas_companies/KKIA/oauth/token",
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      data: JSON.stringify({
        client_id: Visitor_ID,
        client_secret: Visitor_Secret,
        grant_type: "password",
        user_id: "zuhdi@nearmotion.com",
        os: "ios",
        environment: "sandbox",
        push_token: "string",
      }),
    };

    $.ajax(settings).done(function (response) {
      Bearer_token = response.access_token;
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      localStorage.setItem("created_at", getCurrentTime());
      localStorage.setItem("expires_in", response.expires_in);
      Loadmap(Bearer_token, "https://api.nearmotion.com/api/public/v1/");
    });
  } else {
    console.log("Access Token is still valid");
    Bearer_token = localStorage.getItem("access_token");
    Loadmap(Bearer_token, "https://api.nearmotion.com/api/public/v1/");
  }
}

var start_time;
async function Loadmap(token_test, url) {
  Bearer_token = token_test;
  API_URL = url;
  try {
    start_time = performance.now();
    const isFetched = await get_category(Bearer_token);
    if (isFetched) {
      var end_time = performance.now();
      var executionTime = end_time - start_time; // Store execution time in a variable
      //console.log("1 - Categories fetched successfully! : "+executionTime);
      try {
        var data, isDataFetched;
        if (!sessionStorage.getItem("buildings_object")) {
          //console.log("1 - Get new Building");
          var { data, isDataFetched } = await get_buildings(Bearer_token);
          buildings_object = JSON.parse(data);
          fly_to_building();
        } else {
          //console.log("1 - Used cached Building");
          buildings_object = JSON.parse(
            sessionStorage.getItem("buildings_object")
          );
          isDataFetched = true;
          fly_to_building();
        }
        if (isDataFetched) {
          end_time = performance.now();
          executionTime = end_time - start_time;
          //console.log("2 - Buildings fetched successfully! : "+executionTime);
          try {
            var isFloorsFetched;
            if (!sessionStorage.getItem("floors_objects")) {
              //console.log("Get New Floor");
              isFloorsFetched = await get_floor_json();
              sessionStorage.setItem(
                "floors_objects",
                JSON.stringify(floors_objects)
              );
            } else {
              //console.log("Used Cached Floor");
              floors_objects = JSON.parse(
                sessionStorage.getItem("floors_objects")
              );
              isFloorsFetched = true;
            }
            if (isFloorsFetched) {
              end_time = performance.now();
              executionTime = end_time - start_time;
              //console.log("3 - Floors fetched successfully! : "+executionTime);
              try {
                var isLayersFetched;

                if (!sessionStorage.getItem("Layers_objects")) {
                  //console.log("Get new layers");
                  isLayersFetched = await Load_Layer_data();
                  sessionStorage.setItem(
                    "Layers_objects",
                    JSON.stringify(Layers_objects)
                  );
                } else {
                  //console.log("Used Cached Floor");
                  isLayersFetched = true;
                  Layers_objects = JSON.parse(
                    sessionStorage.getItem("Layers_objects")
                  );
                }
                if (isLayersFetched) {
                  end_time = performance.now();
                  executionTime = end_time - start_time;
                  //console.log("4 - Layers fetched successfully! : "+executionTime);
                  sortedInput = Layers_objects;

                  for (var a = 0; a < sortedInput.length; a++) {
                    if (sortedInput[a].building_floor.name == "G") {
                      sortedInput[a].building_floor.name = "0";
                    }
                  }
                  sortedInput = sortedInput
                    .slice()
                    .sort(
                      (a, b) =>
                        parseInt(b.building_floor.name) -
                        parseInt(a.building_floor.name)
                    );

                  for (var a = 0; a < sortedInput.length; a++) {
                    if (sortedInput[a].building_floor.name == "0") {
                      sortedInput[a].building_floor.name = "G";
                    }
                  }
                  fixed_layers = sortedInput;
                  const isLayersLoaded = layers_level(sortedInput);
                  try {
                    if (isLayersLoaded) {
                      end_time = performance.now();
                      executionTime = end_time - start_time;
                      try {
                        const isFetched = await load_pois_floors(sortedInput);

                        if (isFetched) {
                          end_time = performance.now();
                          executionTime = end_time - start_time;
                          try {
                            const isFetched_route = await load_routes();
                            if (isFetched_route) {
                              end_time = performance.now();
                              executionTime = end_time - start_time;
                              //console.log("7 - Routes loaded successfully! : "+executionTime);
                              // Call the next function here
                              try {
                                const is_route_proccessed =
                                  await start_routes();
                                if (is_route_proccessed) {
                                  end_time = performance.now();
                                  executionTime = end_time - start_time;
                                  //console.log("8 - Routes proccessed successfully! : " + executionTime);
                                  link_elevators();
                                }
                              } catch (error) {
                                console.error(error);
                              }
                            }
                          } catch (error) {
                            console.error(error);
                          }
                        }
                      } catch (error) {
                        console.error(error + " , Erro Loading POIs!");
                      }
                    }
                  } catch (error) {
                    console.error(error + " , Error putting layers");
                  }
                }
              } catch (error) {
                console.error(error + " , Error Layers fetching");
              }
            }
          } catch (error) {
            console.error(error + " , Error Floor fetching");
          }
        }
      } catch (error) {
        console.error(error + " , Error Building fetching");
      }
    }
  } catch (error) {
    console.error(error + " , Error Categories fetching");
  }
}

//! Category
async function get_category(token) {
  let isDataFetched = false; // Initialize the flag
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_URL + "building_poi_categories");
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("accept", "application/json");
    xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState == 4) {
        if (this.status >= 200 && this.status < 300) {
          try {
            category_object = JSON.parse(this.responseText);
            category_object.building_poi_categories.push({
              id: "o",
              name: "Others",
            });

            const category_length =
              category_object.building_poi_categories.length;
            for (let a = 0; a < category_length; a++) {
              category_array[category_object.building_poi_categories[a].id] =
                category_object.building_poi_categories[a].name;
            }
            isDataFetched = true; // Set the flag
            resolve(isDataFetched); // Resolve the promise
          } catch (error) {
            reject("Error parsing response: " + error.message);
          }
        } else {
          reject("Failed to fetch categories. Status: " + this.status);
        }
      }
    });

    xhr.onerror = () => reject("Network error");
    xhr.send();
  });
}

//! Buildings via Web Worker
async function get_buildings(token) {
  const workerCode = `
        self.onmessage = function (event) {
            const { token, API_URL } = event.data;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", \`\${API_URL}buildings\`, true);
            xhr.setRequestHeader("Authorization", \`Bearer \${token}\`);
            xhr.setRequestHeader("accept", "application/json");
            xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    self.postMessage({ success: true, data: xhr.responseText });
                } else {
                    self.postMessage({
                        success: false,
                        error: \`Failed to fetch buildings. Status: \${xhr.status}\`,
                    });
                }
            };
            xhr.onerror = function () {
                self.postMessage({
                    success: false,
                    error: "An error occurred during the XMLHttpRequest",
                });
            };
            xhr.send();
        };
    `;
  // Create a Blob containing the worker code
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  return new Promise((resolve, reject) => {
    worker.postMessage({
      token: token,
      API_URL: API_URL,
    });
    worker.onmessage = function (event) {
      const { success, data, error } = event.data;
      if (success) {
        sessionStorage.setItem("buildings_object", data);
        resolve({ data, isDataFetched: true });
      } else {
        console.error("Worker error:", error);
        reject(error);
      }
    };
    worker.onerror = function (e) {
      console.error("Worker encountered an error:", e.message);
      reject(e.message);
    };
  });
}

//! Floors
async function get_floor_json() {
  const buildings_length = buildings_object.buildings.length;
  let isAllFloorsFetched = true; // Flag to track overall success
  // Create an array of promises to fetch floor data for each building
  const fetchPromises = buildings_object.buildings.map((building) => {
    return get_floor(Bearer_token, building.id);
  });
  // Wait for all the promises to resolve
  const results = await Promise.all(fetchPromises);
  // Check if all floor fetches were successful
  results.forEach((isFloorFetched) => {
    if (!isFloorFetched) {
      isAllFloorsFetched = false; // Update flag if any floor fetch fails
    }
  });
  return isAllFloorsFetched;
}

// Function to get floor data for a specific building
async function get_floor(token, building_id) {
  const workerCode = `
        self.onmessage = function (event) {
            const { token, building_id, API_URL } = event.data;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", \`\${API_URL}buildings/\${building_id}/floors\`, true);
            xhr.setRequestHeader("Authorization", \`Bearer \${token}\`);
            xhr.setRequestHeader("accept", "application/json");
            xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const floorData = JSON.parse(xhr.responseText);
                        self.postMessage({ success: true, floorData });
                    } catch (error) {
                        self.postMessage({ success: false, error: error.message });
                    }
                } else {
                    self.postMessage({
                        success: false,
                        error: \`Failed to fetch floor. Status: \${xhr.status}\`,
                    });
                }
            };
            xhr.onerror = function () {
                self.postMessage({
                    success: false,
                    error: "Network error while fetching floors",
                });
            };
            xhr.send();
        };
    `;
  // Create a Blob containing the worker code
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  return new Promise((resolve, reject) => {
    worker.postMessage({
      token: token,
      building_id: building_id,
      API_URL: API_URL,
    });
    worker.onmessage = function (event) {
      const { success, floorData, error } = event.data;
      if (success) {
        floors_objects.push(floorData); // Add data to the global array
        resolve(true);
      } else {
        console.error("Worker error:", error);
        resolve(false);
      }
    };
    worker.onerror = function (e) {
      console.error("Worker encountered an error:", e.message);
      resolve(false);
    };
  });
}

//! Layers
async function Load_Layer_data() {
  Layers_objects = []; // Initialize the array
  const fetchPromises = []; // Array to hold all fetch promises
  for (let c = 0; c < buildings_object.buildings.length; c++) {
    for (let z = 0; z < floors_objects[c].building_floors.length; z++) {
      const floorId = floors_objects[c].building_floors[z].id;
      fetchPromises.push(get_layer_data(floorId)); // Add each fetch to the promises array
    }
  }
  // Wait for all fetch promises to resolve
  const results = await Promise.all(fetchPromises);
  // Check if all layers were fetched successfully
  const isAllLayersFetched = results.every((result) => result);
  return isAllLayersFetched;
}

// Function to fetch data for a specific layer
async function get_layer_data(floor_id) {
  const workerCode = `
        self.onmessage = function (event) {
            const { floor_id, API_URL, Bearer_token } = event.data;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", \`\${API_URL}floors/\${floor_id}\`, true);
            xhr.setRequestHeader("Authorization", \`Bearer \${Bearer_token}\`);
            xhr.setRequestHeader("accept", "application/json");
            xhr.setRequestHeader("Content-Encoding", "gzip, deflate, br");
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const layerData = JSON.parse(xhr.responseText);
                        self.postMessage({ success: true, layerData });
                    } catch (error) {
                        self.postMessage({ success: false, error: error.message });
                    }
                } else {
                    self.postMessage({
                        success: false,
                        error: \`Failed to fetch layer. Status: \${xhr.status}\`,
                    });
                }
            };
            xhr.onerror = function () {
                self.postMessage({
                    success: false,
                    error: "Network error while fetching layer",
                });
            };
            xhr.send();
        };
    `;
  // Create a Blob containing the worker code
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  return new Promise((resolve) => {
    worker.postMessage({
      floor_id: floor_id,
      API_URL: API_URL,
      Bearer_token: Bearer_token,
    });
    worker.onmessage = function (event) {
      const { success, layerData, error } = event.data;
      if (success) {
        Layers_objects.push(layerData); // Add data to the global array
        resolve(true);
      } else {
        console.error("Worker error:", error);
        resolve(false);
      }
    };
    worker.onerror = function (e) {
      console.error("Worker encountered an error:", e.message);
      resolve(false);
    };
  });
}

//! Process & add layers
async function layers_level(sortedInput) {
  let isLayersProcessed = true; // Flag to track overall success
  try {
    if (sortedInput[0].building_floor.layers.length > 0) {
      for (let c = 0; c < sortedInput.length; c++) {
        let floor_title = sortedInput[c].building_floor.name;
        // Convert floor title
        floor_title = floor_title === "G" ? 0 : parseInt(floor_title);
        const build_id = sortedInput[c].building_floor.building_id;
        const floor_id = sortedInput[c].building_floor.id;
        level_array[floor_id] = floor_title;
        for (let m = 0; m < sortedInput[c].building_floor.layers.length; m++) {
          const layer = sortedInput[c].building_floor.layers[m];
          const kind = layer.kind;
          const url = layer.file.url;
          // Add unique layer names
          if (!Layersnames.includes(kind)) {
            Layersnames.push(kind === "other" ? layer.file.filename : kind);
          }
          // Handle each layer kind
          try {
            if (kind === "walls") {
              walls_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "street") {
              street_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "rooms") {
              rooms_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "sidewalk") {
              sidewalk_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "parking") {
              parking_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "outlayer") {
              outlayer_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "doors") {
              doors_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "corridors") {
              corridors_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "arrows") {
              arrows_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "garden") {
              garden_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "be") {
              be_layer(`${build_id}/${floor_title}/${kind}`, url);
            } else if (kind === "other") {
              otherlayer(
                `${build_id}/${floor_title}/${layer.file.filename}`,
                url
              );
            }
          } catch (error) {
            console.error(`Error processing layer '${kind}':`, error.message);
            isLayersProcessed = false; // Update flag on failure
          }
        }
        // Add toggleable layer IDs
        if (!toggleableLayerIds.includes(floor_title)) {
          toggleableLayerIds.push(build_id + "/" + floor_title);
          if (!floornametitle.includes(floor_title)) {
            if (floor_title == 0) {
              toggleLayer([build_id + "/" + floor_title], "G");
              floornametitle.push(floor_title);
            } else {
              toggleLayer([build_id + "/" + floor_title], floor_title);
              floornametitle.push(floor_title);
            }
          }
        }
      }
    }

    //switch_to_current_floor();
  } catch (error) {
    console.error("Error processing layers:", error.message);
    isLayersProcessed = false; // Update flag on overall error
  }
  return isLayersProcessed;
}

//! Layer functions
function walls_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#E6E9EC",

      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        // When zoom is 10, buildings will be 100% transparent.
        16.4,
        0,
        // When zoom is 18 or higher, buildings will be 100% opaque.
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

// function add street Layers
function street_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#bababa",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

// function add rooms Layers
function rooms_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#FFFBF5",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        // When zoom is 10, buildings will be 100% transparent.
        16.4,
        0,
        // When zoom is 18 or higher, buildings will be 100% opaque.
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

function sidewalk_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });

  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#FAF7F0",
      "fill-outline-color": "#e3e4e6",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

function parking_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#B2B2B2",
      "fill-outline-color": "#FFEBAF",
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

function outlayer_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "line",
    source: layername,
    minzoom: 14,
    paint: {
      "line-color": "#141414",
      "line-width": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0.5,
        22,
        3,
      ],
      "line-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

function otherlayer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "line",
    source: layername,
    paint: {
      "line-color": "#969696",
      "line-width": 0.7,
      "line-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

function arrows_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    layout: {},
    paint: {
      "fill-color": "#ffffff",
      "fill-outline-color": "#ffffff",
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

function doors_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });

  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#F2DCBB",
      "fill-outline-color": "#000000",
      "fill-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });

  map.setLayoutProperty(layername, "visibility", "none");
}

function corridors_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#ffffff",
      "fill-outline-color": "#828282",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

// function add belcony layer Layers
function be_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });

  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#DEF7FF",
      "fill-outline-color": "#9c9c9c",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        // When zoom is 10, buildings will be 100% transparent.
        16.4,
        0,
        // When zoom is 18 or higher, buildings will be 100% opaque.
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

// function add garden layer Layers
function garden_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });

  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#D5E6CF",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}

//! Toggle Layer UI
function toggleLayer(ids, name) {
  var link = document.createElement("a");
  link.href = "#";
  link.textContent = name;

  var maplayer = map.getLayer(ids[0] + "/" + name);
  if (typeof maplayer !== "undefined") {
    var active = map.getLayoutProperty(ids[0] + "/" + name, "visibility");
  }

  if (active == "visible") {
    link.className = "active";
    map.on("mouseenter", ids, function (e) {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", ids, function (e) {
      map.getCanvas().style.cursor = "";
    });
  }

  link.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var clickedLayer = this.textContent;
    var trailLayer = toggleableLayerIds.indexOf(clickedLayer);
    var visibility;
    for (layers in ids) {
      let id = ids[layers];
      var maplayer = map.getLayer(ids[layers] + "/" + Layersnames[0]);
      if (typeof maplayer !== "undefined") {
        visibility = map.getLayoutProperty(
          ids[layers] + "/" + Layersnames[0],
          "visibility"
        );
      }
      if (visibility === "visible") {
        //map.setLayoutProperty(ids[layers], 'visibility', 'none');
        this.className = "active";
      } else {
        this.className = "active";
        let getSiblings = function (floor) {
          // Setup siblings array and get the first sibling
          let siblings = [];
          let sibling = floor.parentNode.firstChild;
          // Loop through each sibling and push to the array
          while (sibling) {
            // make sure it is an element and not the required
            if (sibling.nodeType === 1 && sibling !== floor) {
              siblings.push(sibling);
            }
            sibling = sibling.nextSibling;
          }
          return siblings;
        };
        let siblings = getSiblings(this);
        siblings.forEach((x) => {
          x.className = "";
        });
        toggleableLayerIds.map((x) => {
          if (x == ids[layers]) {
            for (var name of Layersnames) {
              var maplayer = map.getLayer(x + "/" + name);
              if (typeof maplayer !== "undefined") {
                map.setLayoutProperty(x + "/" + name, "visibility", "visible");
                var f = x.split("/");
                Level_route_poi = parseInt(f[1]);
              }
            }
          } else {
            for (var name of Layersnames) {
              var maplayer = map.getLayer(x + "/" + name);
              if (typeof maplayer !== "undefined") {
                map.setLayoutProperty(x + "/" + name, "visibility", "none");
              }
            }
          }
          poi_show_by_level();

          if (Full_path_route.features[0].geometry.coordinates.length > 0) {
            if (!remove_extra_route_flag) {
              remove_route_layer();
            }
            if (routeEnabled) {
              stopAnimation();
              initializeArrowsSourceAndLayer();
              map.moveLayer("arrow-layer");
            }
          }

          if (routeEnabled) {
            popups_global.forEach((popup) => popup.remove());
            popups_global = []; // clear the array
            elevator_guide();
            addFromToMarkers(
              from_marker_location,
              to_marker_location,
              from_marker_lvl,
              to_marker_lvl
            );
            //adjust_layer();
            Route_level();
          }
        });
      }
    }
  };

  var layers = document.getElementById("menu");
  layers.appendChild(link);
}

//! POIs & Routes
function get_start_floor() {
  for (var j = 0; j < index_pority.length; j++) {
    for (var i = 0; i < fixed_layers.length; i++) {
      var floor_name = fixed_layers[i].building_floor.name;
      var floor;
      if (floor_name == "G") {
        floor = 0;
      } else {
        floor = parseInt(floor_name);
      }

      if (floor == index_pority[j]) {
        return floor;
      }
    }
  }
}

function fly_to_building() {
  map.setCenter([
    buildings_object.buildings[0].coordinate.longitude,
    buildings_object.buildings[0].coordinate.latitude,
  ]);
  map.setZoom(18.4);
}

async function load_pois_floors(sortedlayer) {
  let isDataFetched = false; // Initialize the flag

  return new Promise(async (resolve, reject) => {
    try {
      var layer_length = sortedlayer.length;
      const promises = [];

      // Loop through each floor and push the respective promises into the array
      for (let i = 0; i < layer_length; i++) {
        promises.push(
          get_All_POI(
            sortedInput[i].building_floor.id,
            sortedInput[i].building_floor.name,
            Bearer_token,
            sortedInput[i].building_floor.building_id
          )
        );
      }

      isDataFetched = true; // Set the flag to true when data is successfully fetched

      // Resolve the promise if data is fetched successfully
      resolve(isDataFetched);

      // Optionally, call the next function here if needed
      if (isDataFetched) {
        // Call the next function, for example:
        //nextFunction();
      }
    } catch (error) {
      reject("Error loading POIs: " + error.message);
    }
  });
}
//11 - Function GET POI API
// Wrapper for XMLHttpRequest to return a promise
function fetchPOIData(building_id, floor_id, token) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      API_URL + "buildings/" + building_id + "/floors/" + floor_id + "/pois",
      true
    );
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("accept", "application/json");
    xhr.setRequestHeader("Content-Encoding", "gzip");

    // On load, resolve the promise with the parsed response
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText)); // Resolving with the parsed JSON
      } else {
        reject(new Error("Failed to load POIs: " + xhr.statusText)); // Rejecting on error
      }
    };

    // On error, reject the promise
    xhr.onerror = function () {
      reject(new Error("An error occurred during the XMLHttpRequest"));
    };

    xhr.send();
  });
}
var all_pois_loaded = false;
var Pois_counter_level = 0;
// Refactor get_All_POI to use async/await and fetchPOIData promise
async function get_All_POI(floor_id, floor_title, token, building_id) {
  try {
    const POI_object_floor = await fetchPOIData(building_id, floor_id, token); // Wait for POI data
    await start_poi(POI_object_floor); // Wait for start_poi to complete

    Pois_counter_level++;

    // Trigger the switch when all POIs are fetched
    if (Pois_counter_level == sortedInput.length) {
      //console.log("All POIS LOADED : "+executionTime);
      all_pois_loaded = true;

      var menubtn = document.getElementById("menu");

      for (var i = 0; i < menubtn.childElementCount; i++) {
        var floor = menubtn.children[i].innerText;
        if (floor == "G") {
          floor = 0;
          menubtn.children[i].click();
        }
      }
      current_lvl = get_start_floor();
      switch_to_current_floor();
      poi_show_by_level();
    }
  } catch (error) {
    console.error("Error fetching POIs:", error);
  }
}

async function start_poi(POI_object) {
  poi(POI_object); // Wait for poi processing
}

// Refactor poi function to process each POI asynchronously
async function poi(POI_object) {
  for (let r = POI_object.building_pois.length - 1; r >= 0; r--) {
    POI_properties(POI_object.building_pois[r]);
  }
}

async function POI_properties(POI_object) {
  var POI_coordinates = new Array();
  var image_url = "";
  var image_name = "";

  if (POI_object.hasOwnProperty("icon")) {
    if (POI_object.icon.url != "" || POI_object.icon.filename != "") {
      image_url = POI_object.icon.url;
      image_name = POI_object.icon.filename;
      get_image(image_url, image_name);
    }
  }

  var poi_sized = POI_object.coordinates.length;
  for (var j = 0; j < poi_sized; j++) {
    POI_coordinates.push([
      POI_object.coordinates[j].longitude,
      POI_object.coordinates[j].latitude,
    ]);
  }

  var tit_;
  var sub_;

  tit_ = POI_object.title;
  var color = POI_object.color;

  if (!isNaN(tit_)) {
    tit_ = "";
    color = "#CDD0CB";
  }

  sub_ = POI_object.subtitles;
  All_POI_object.features[POI_counter] = {
    id: POI_object.id,
    type: "Feature",
    properties: {
      title: tit_,
      icon: image_name,
      icon_url: image_url,
      category_id: POI_object.category_id,
      subtitles: sub_,
      Center: [POI_object.longitude, POI_object.latitude],
      Level: level_array[POI_object.building_floor_id],
      Color: color,
    },
    geometry: {
      coordinates: [POI_coordinates],
      type: "Polygon",
    },
  };
  POI_counter++;
  Load_dropdown_pois(POI_object);
}

async function get_image(url, name) {
  var image_url = url;
  var image_name = name;
  map.loadImage(image_url, function (error, image) {
    if (error) throw error;
    if (!map.listImages().includes(image_name)) {
      map.addImage(image_name, image);
    }
  });
}

function poi_show_by_level() {
  var counter = 0;
  var counter_building = 0;

  Poly_geojson_level = {
    type: "FeatureCollection",
    features: [
      {
        id: "",
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [],
        },
        properties: {
          title: "",
          icon: "",
          Center: [],
        },
      },
    ],
  };

  if (language == "EN") {
    for (var i = 0; i < All_POI_object.features.length; i++) {
      if (
        All_POI_object.features[i].properties.hasOwnProperty("icon") &&
        imageload_flag
      ) {
        if (
          All_POI_object.features[i].properties.icon_url != "" &&
          All_POI_object.features[i].properties.icon_url != undefined
        ) {
          image_url = All_POI_object.features[i].properties.icon_url;
          image_name = All_POI_object.features[i].properties.icon;
          get_image(image_url, image_name);
        }
      }

      if (Level_route_poi == All_POI_object.features[i].properties.Level) {
        if (All_POI_object.features[i].properties.title == "room") {
          All_POI_object.features[i].properties.title = "";
        }
        var color = All_POI_object.features[i].properties.Color;

        Poly_geojson_level.features[counter] = {
          id: All_POI_object.features[i].id,
          type: "Feature",
          properties: {
            title: All_POI_object.features[i].properties.title,
            icon: All_POI_object.features[i].properties.icon,
            icon_url: All_POI_object.features[i].properties.icon_url,
            Center: All_POI_object.features[i].properties.Center,
            Level: All_POI_object.features[i].properties.Level,
            Color: color,
          },
          geometry: {
            coordinates: All_POI_object.features[i].geometry.coordinates,
            type: "Polygon",
          },
        };
        counter++;

        if (
          All_POI_object.features[i].properties.title ==
            "Admin Building Entrance" ||
          All_POI_object.features[i].properties.title ==
            "Burjeel Darak Entrance"
        ) {
          Poly_geojson_level_outsidebuilding.features[counter_building] = {
            id: All_POI_object.features[i].id,
            type: "Feature",
            properties: {
              title: All_POI_object.features[i].properties.title,
              icon: All_POI_object.features[i].properties.icon,
              icon_url: All_POI_object.features[i].properties.icon_url,
              Center: All_POI_object.features[i].properties.Center,
              Level: All_POI_object.features[i].properties.Level,
              Color: All_POI_object.features[i].properties.Color,
            },
            geometry: {
              coordinates: All_POI_object.features[i].geometry.coordinates,
              type: "Polygon",
            },
          };
          counter_building++;
        }
      }
    }
    imageload_flag = false;
  } else {
    for (var i = 0; i < All_POI_object.features.length; i++) {
      if (
        All_POI_object.features[0].properties.hasOwnProperty("icon") &&
        imageload_flag
      ) {
        get_image(
          All_POI_object.features[i].properties.icon_url,
          All_POI_object.features[i].properties.icon
        );
      }
      if (Level_route_poi == All_POI_object.features[i].properties.Level) {
        var title;
        if (All_POI_object.features[i].properties.subtitles.length > 0) {
          if (All_POI_object.features[i].properties.subtitles[0] != "string") {
            title = All_POI_object.features[i].properties.subtitles[0];
          } else {
            title = All_POI_object.features[i].properties.title;
          }
        } else {
          title = All_POI_object.features[i].properties.title;
        }

        Poly_geojson_level.features[counter] = {
          id: All_POI_object.features[i].id,
          type: "Feature",
          properties: {
            title: title,
            icon: All_POI_object.features[i].properties.icon,
            icon_url: All_POI_object.features[i].properties.icon_url,
            Center: All_POI_object.features[i].properties.Center,
            Level: All_POI_object.features[i].properties.Level,
            Color: All_POI_object.features[i].properties.Color,
          },
          geometry: {
            coordinates: All_POI_object.features[i].geometry.coordinates,
            type: "Polygon",
          },
        };
        counter++;
      }
    }
    imageload_flag = false;
  }

  var mapSource = map.getSource("municipalities");
  //
  if (typeof mapSource !== "undefined") {
    map.removeLayer("polygons");
    map.removeLayer("polygons_outline");
    map.removeLayer("municipality-name");
    map.removeSource("municipalities");
  }

  map.addSource("municipalities", {
    type: "geojson",
    data: Poly_geojson_level,
  });

  map.addLayer({
    id: "polygons",
    type: "fill",
    source: "municipalities",
    paint: {
      "fill-color": {
        type: "identity",
        property: "Color",
      },
      "fill-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        0.8,
      ],
    },
  });

  map.addLayer({
    id: "polygons_outline",
    type: "line",
    source: "municipalities",
    paint: {
      "line-color": "#828282",
      "line-width": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16,
        0,
        22,
        1,
      ],
      "line-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });

  map.addLayer({
    id: "municipality-name",
    type: "symbol",
    source: "municipalities",
    layout: {
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-image": "{icon}",
      "icon-size": 0.2,
      "text-field": "{title}",
      "text-size": 12,
      "text-offset": [0, 0.8],
      "symbol-placement": "point",
    },
    paint: {
      "icon-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],

      "text-opacity": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        0.8,
      ],
      "text-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "rgba(0,0,0,1)",
        "rgba(0,0,0,1)",
      ],
      "text-halo-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "rgba(255,255,255,1)",
        "rgba(255,255,255,1)",
      ],
      "text-halo-width": 2,
      "text-halo-blur": 0,
    },
  });
}

function switch_to_current_floor() {
  var menubtn = document.getElementById("menu");

  for (var i = 0; i < menubtn.childElementCount; i++) {
    var floor = menubtn.children[i].innerText;
    if (floor == "G") {
      floor = 0;
    } else {
      floor = parseInt(floor);
    }

    if (floor == current_lvl) {
      if (current_lvl == Level_route_poi) {
        fly_to_building();
      } else {
        menubtn.children[i].click();
      }
    }
  }
}

async function load_routes() {
  let isDataFetched = false;

  return new Promise((resolve, reject) => {
    const promises = [];

    for (var m = 0; m < floors_objects.length; m++) {
      for (var z = 0; z < floors_objects[m].building_floors.length; z++) {
        promises.push(
          get_routes(Bearer_token, floors_objects[m].building_floors[z].id)
        );
      }
    }

    Promise.all(promises)
      .then(() => {
        isDataFetched = true;
        if (isDataFetched) {
          resolve(isDataFetched);
        }
      })
      .catch((error) => {
        reject("Error loading routes: " + error);
      });
  });
}

async function get_routes(token, building_id) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState == 4) {
        if (this.status >= 200 && this.status < 300) {
          try {
            var points_route_object = [JSON.parse(this.responseText)];
            Route_buildings[building_id] = points_route_object;
            resolve();
          } catch (error) {
            reject("Error parsing route data: " + error.message);
          }
        } else {
          reject("Failed to fetch route data. Status: " + this.status);
        }
      }
    });

    xhr.onerror = () => reject("Network error");
    xhr.open("GET", API_URL + "floors/" + building_id + "/route", true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("accept", "application/json");
    xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");

    xhr.send();
  });
}

async function process_route_point(routePoint, wayPoint_level) {
  return new Promise((resolve, reject) => {
    try {
      Routes_array[routePoint.point_id] =
        routePoint.longitude +
        "," +
        routePoint.latitude +
        "," +
        wayPoint_level +
        "," +
        routePoint.kind;

      if (routePoint.kind === "elevator") {
        elevators.push({
          key: routePoint.point_id,
          lng: routePoint.longitude,
          lat: routePoint.latitude,
          zlevel: wayPoint_level,
        });
        elevatorsCount++;
      }

      var keys = routePoint.neighbors;
      for (var z = 0; z < keys.length; z++) {
        graph.addEdge(routePoint.point_id, keys[z]);
      }

      resolve();
    } catch (error) {
      reject("Error processing route point: " + error.message);
    }
  });
}

function Graph() {
  var neighbors = (this.neighbors = {});

  this.addEdge = function (u, v) {
    if (neighbors[u] === undefined) {
      neighbors[u] = [];
    }
    neighbors[u].push(v);
  };

  return this;
}

async function start_routes() {
  let isDataFetched = false;

  return new Promise((resolve, reject) => {
    const promises = [];

    for (var key in Route_buildings) {
      let wayPoint_level = level_array[key];
      for (
        var i = 0;
        i < Route_buildings[key][0].building_route_points.length;
        i++
      ) {
        promises.push(
          process_route_point(
            Route_buildings[key][0].building_route_points[i],
            wayPoint_level
          )
        );
      }
    }

    Promise.all(promises)
      .then(() => {
        isDataFetched = true;
        resolve(isDataFetched);
      })
      .catch((error) => {
        reject("Error processing routes: " + error);
      });
  });
}

function link_elevators() {
  for (var e = 0; e < elevatorsCount; e++)
    for (var t = 0; t < elevatorsCount; t++) {
      var o = parseFloat(elevators[e].lat),
        a = parseFloat(elevators[e].lng),
        r = parseFloat(elevators[t].lat),
        i = parseFloat(elevators[t].lng);
      if (10 > getDistanceFromLatLonInKm(o, a, r, i)) {
        var l = elevators[e].key,
          s = elevators[t].key;
        graph.neighbors[l].push(s);
      }
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function Load_dropdown_pois(poi) {
  var level = level_array[poi.building_floor_id];
  var category_ar = buildings_object.buildings[0].name + " - ";
  level = floors_titles[level];
  if (poi.category_id != null) {
    category_ar = category_array[poi.category_id] + " - ";
  }

  var icon = poi.icon && poi.icon.url ? poi.icon.url : "./icontap.png"; // safe fallback

  $("#from_location").append(
    $(
      "<option data-foo='" +
        category_ar +
        " " +
        level +
        "' data-icon='" +
        icon +
        "'>" +
        poi.title +
        "</option>"
    ).attr(
      "value",
      poi.longitude + "," + poi.latitude + "," + poi.building_floor_id
    )
  );

  $("#to_location").append(
    $(
      "<option data-foo='" +
        category_ar +
        " " +
        level +
        "' data-icon='" +
        icon +
        "'>" +
        poi.title +
        "</option>"
    ).attr(
      "value",
      poi.longitude + "," + poi.latitude + "," + poi.building_floor_id
    )
  );
}

function draw_path_to_poi(
  from_name,
  from_lng_,
  from_lat_,
  from_zlevel_,
  to_name,
  to_lng_,
  to_lat_,
  to_zlevel_
) {
  routeEnabled = true;
  Full_path_route = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      },
    ],
  };

  var to_lng = to_lng_;
  var to_lat = to_lat_;
  var to_lvl = to_zlevel_;

  var from_lng = from_lng_;
  var from_lat = from_lat_;
  var from_lvl = from_zlevel_;

  //Minimum Distance Flag
  var min_flag = 0;
  var minumum_from;
  var minumum_to;

  //key for Start & end location
  var start_key;
  var end_key;

  for (var key in Routes_array) {
    // Get
    var value = Routes_array[key];
    var spiltter = value.split(",");
    var check_near_lgn = spiltter[0];
    var check_near_lat = spiltter[1];
    var level = spiltter[2];

    var min_distance_from = getDistanceFromLatLonInKm(
      check_near_lat,
      check_near_lgn,
      from_lat,
      from_lng
    );
    var min_distance_to = getDistanceFromLatLonInKm(
      check_near_lat,
      check_near_lgn,
      to_lat,
      to_lng
    );
    if (min_flag == 0) {
      min_flag = 1;
      minumum_from = min_distance_from;
      minumum_to = min_distance_to;
      start_key = key;
      end_key = key;
    } else {
      if (level == from_lvl) {
        if (minumum_from > min_distance_from) {
          minumum_from = min_distance_from;
          start_key = key;
        }
      }
      if (level == to_lvl) {
        if (minumum_to > min_distance_to) {
          minumum_to = min_distance_to;
          end_key = key;
        }
      }
    }
  }

  var geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      },
    ],
  };
  Global_start_key = start_key;
  Global_end_key = end_key;

  shortestPath(graph, start_key, end_key);

  var full_distance = 0;
  var prefpointlng;
  var prevpointlat;
  for (var o = 0; o < route_array.length; o++) {
    var waypoint = Routes_array[route_array[o]];
    var array_coordinates = waypoint.split(",");
    var lgn = array_coordinates[0];
    var lat = array_coordinates[1];
    var level = array_coordinates[2];

    if (o == 0) {
      prefpointlng = lgn;
      prefpointlat = lat;
    } else {
      full_distance =
        full_distance +
        getDistanceFromLatLonInKm(prefpointlat, prefpointlng, lat, lgn);
      prefpointlng = lgn;
      prefpointlat = lat;
    }

    if (o == 1) {
      second_route_lng = lgn;
      second_route_lat = lat;
    }
    Full_path_route.features[0].geometry.coordinates.push([lgn, lat]);
    //insert the Route coordinates in the
    if (level == Level_route_poi) {
      geojson.features[0].geometry.coordinates.push([lgn, lat]);
    }
  }

  full_distance_to_destination = full_distance;
  // if (!remove_extra_route_flag) {
  //     remove_route_layer();
  // }
  var time = Math.floor(full_distance) / 74;
  full_time_to_destination = time;
  global_name = to_name;
  global_distance = Math.floor(full_distance);
  global_time = time;
  global_zlevel = to_lvl;

  from_marker_location = extractLngLat(Routes_array[Global_start_key]);
  to_marker_location = extractLngLat(Routes_array[Global_end_key]);
  from_marker_lvl = from_lvl;
  to_marker_lvl = to_lvl;

  if (!remove_extra_route_flag) {
    elevator_guide();
    addFromToMarkers(
      from_marker_location,
      to_marker_location,
      from_marker_lvl,
      to_marker_lvl
    );
  }
  Route_level();
  enter_into_nvgation_mode(SmartRoute);
  //journey_info(global_name, global_distance, global_time);
}

function journey_info(poi_name, distance, time) {
  if (time < 1) {
    time = time * 60;
    time = Math.floor(time) + " sec";
    document.getElementById("time_lbl").innerHTML = time;
  } else {
    time = Math.floor(time) + " min";
    document.getElementById("time_lbl").innerHTML = time;
  }
  if (distance > 1000) {
    distance = (distance / 1000).toFixed(1);
    document.getElementById("distance_lbl").innerHTML = distance + " Km";
  } else {
    document.getElementById("distance_lbl").innerHTML = distance + " meter";
  }

  //document.getElementById("myModal").style.display = "block";
  //document.getElementById("destination_name").innerHTML = poi_name;
  //document.getElementById("floorLabel").innerHTML = floor;
}

var from_marker_location = [],
  to_marker_location = [],
  from_marker_lvl,
  to_marker_lvl;

function shortestPath(graph, source, target) {
  if (source == target) {
    return;
  }
  var queue = [source],
    visited = {
      source: true,
    },
    predecessor = {},
    tail = 0;
  while (tail < queue.length) {
    var u = queue[tail++],
      neighbors = graph.neighbors[u];
    if (neighbors == undefined) {
      continue;
    }
    for (var i = 0; i < neighbors.length; ++i) {
      var v = neighbors[i];
      if (visited[v]) {
        continue;
      }
      visited[v] = true;
      if (v === target) {
        var path = [v];
        while (u !== source) {
          path.push(u);
          u = predecessor[u];
        }
        path.push(u);
        path.reverse();
        for (let index = 0; index < path.length; index++) {
          route_array.push(path[index]);
        }
        return;
      }
      predecessor[v] = u;
      queue.push(v);
    }
  }
}

var prev_ele_lvl;
var journey_Elevator = new Array();
var journey_Elevator_occurrence = new Array();
var journey_one_elevator = new Array();
var evelID = new Array();
var evelgt = new Array();
var evelat = new Array();
var evelvl = new Array();
var evenext = new Array();
var evevisited = new Array();
var evecounter = 0;
routeEnabled = false;
var popups_global = [];

function elevator_guide() {
  evelID = new Array();
  evelgt = new Array();
  evelat = new Array();
  evelvl = new Array();
  evenext = new Array();
  journey_Elevator = new Array();
  journey_Elevator_occurrence = new Array();
  journey_one_elevator = new Array();

  evecounter = 0;

  for (var i = 0; i < route_array.length; i++) {
    var wa = Routes_array[route_array[i]];
    var arr = wa.split(",");
    var lv = arr[2];
    journey_Elevator[i] = lv;
  }
  journey_Elevator_occurrence = _.countBy(journey_Elevator);
  journey_Elevator = _.uniq(journey_Elevator);

  for (var x = 0; x < journey_Elevator.length; x++) {
    if (journey_Elevator_occurrence[journey_Elevator[x]] == 1) {
      journey_one_elevator.push(journey_Elevator[x]);
    }
  }

  for (var o = 0; o < route_array.length; o++) {
    var waypoint = Routes_array[route_array[o]];
    var array_coordinates = waypoint.split(",");
    var lgn = array_coordinates[0];
    var lat = array_coordinates[1];
    var level = array_coordinates[2];

    if (o == 0) {
      prev_ele_lvl = level;
    } else {
      if (prev_ele_lvl != level) {
        if (!journey_one_elevator.includes(level + "")) {
          var w = Routes_array[route_array[o - 2]];
          var ar = w.split(",");
          var lg = ar[0];
          var lt = ar[1];
          var lvl = ar[2];
          evelID.push(lg + lt);
          evelgt.push(lg);
          evelat.push(lt);
          evelvl.push(lvl);
          evenext.push(level);
          prev_ele_lvl = level;
        }
      }
    }
  }

  if (routeEnabled && evelgt.length > 0) {
    for (var x = 0; x < evelvl.length; x++) {
      if (Level_route_poi == parseInt(evelvl[x])) {
        if (language == "EN") {
          if (parseInt(evenext[x]) > parseInt(evelvl[x])) {
            var popup_global = new mapboxgl.Popup({
              closeOnClick: false,
            })
              .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
              .setHTML(
                '<div style="text-align: center; margin-top: 6px;">' +
                  '<button onclick="switchFloorByNo(' +
                  evenext[x] +
                  "," +
                  evelgt[x] +
                  "," +
                  evelat[x] +
                  ')" style="border: 2px solid white !important; background-color: #0090bf; color: white; padding: 10px 20px; font-size: 1.3em; border-radius: 5px; cursor: pointer;">' +
                  "Go to floor " +
                  evenext[x] +
                  ' <i class="fa-solid fa-circle-up"></i>' +
                  "</button>" +
                  "</div>"
              )
              .addTo(map);
            popups_global.push(popup_global);

            break;
          } else {
            var popup_global = new mapboxgl.Popup({
              closeOnClick: false,
            })
              .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
              .setHTML(
                '<div style="text-align: center; margin-top: 6px;">' +
                  '<button onclick="switchFloorByNo(' +
                  evenext[x] +
                  "," +
                  evelgt[x] +
                  "," +
                  evelat[x] +
                  ')" style="border: 2px solid white !important; background-color: #0090bf; color: white; padding: 10px 20px; font-size: 1.3em; border-radius: 5px; cursor: pointer;">' +
                  "Go to floor " +
                  evenext[x] +
                  ' <i class="fa-solid fa-circle-down"></i>' +
                  "</button>" +
                  "</div>"
              )
              .addTo(map);
            popups_global.push(popup_global);

            break;
          }
        }
        if (language == "ZN") {
          if (parseInt(evenext[x]) > parseInt(evelvl[x])) {
            var popup_global = new mapboxgl.Popup({
              closeOnClick: false,
            })
              .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
              .setHTML(
                '<div style="text-align: center; margin-top: 6px;">' +
                  '<button onclick="switchFloorByNo(' +
                  evenext[x] +
                  "," +
                  evelgt[x] +
                  "," +
                  evelat[x] +
                  ')" style="border: 2px solid white !important; background-color: #0090bf; color: white; padding: 10px 20px; font-size: 1.3em; border-radius: 5px; cursor: pointer;">' +
                  "前往樓層 " +
                  evenext[x] +
                  ' <i class="fa-solid fa-circle-up"></i>' +
                  "</button>" +
                  "</div>"
              )
              .addTo(map);
            popups_global.push(popup_global);

            break;
          } else {
            var popup_global = new mapboxgl.Popup({
              closeOnClick: false,
            })
              .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
              .setHTML(
                '<div style="text-align: center; margin-top: 6px;">' +
                  '<button onclick="switchFloorByNo(' +
                  evenext[x] +
                  "," +
                  evelgt[x] +
                  "," +
                  evelat[x] +
                  ')" style="border: 2px solid white !important; background-color: #0090bf; color: white; padding: 10px 20px; font-size: 1.3em; border-radius: 5px; cursor: pointer;">' +
                  "前往樓層 " +
                  evenext[x] +
                  ' <i class="fa-solid fa-circle-down"></i>' +
                  "</button>" +
                  "</div>"
              )
              .addTo(map);
            popups_global.push(popup_global);

            break;
          }
        } else {
          if (parseInt(evenext[x]) > parseInt(evelvl[x])) {
            var popup_global = new mapboxgl.Popup({
              closeOnClick: false,
            })
              .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
              .setHTML(
                '<div style="text-align: center; margin-top: 6px;">' +
                  '<button onclick="switchFloorByNo(' +
                  evenext[x] +
                  "," +
                  evelgt[x] +
                  "," +
                  evelat[x] +
                  ')" style="border: 2px solid white !important; background-color: #0090bf; color: white; padding: 10px 20px; font-size: 1.3em; border-radius: 5px; cursor: pointer;">' +
                  "إذهب الى الطابق " +
                  evenext[x] +
                  ' <i class="fa-solid fa-circle-up"></i>' +
                  "</button>" +
                  "</div>"
              )
              .addTo(map);
            popups_global.push(popup_global);

            break;
          } else {
            var popup_global = new mapboxgl.Popup({
              closeOnClick: false,
            })
              .setLngLat([parseFloat(evelgt[x]), parseFloat(evelat[x])])
              .setHTML(
                '<div style="text-align: center; margin-top: 6px;">' +
                  '<button onclick="switchFloorByNo(' +
                  evenext[x] +
                  "," +
                  evelgt[x] +
                  "," +
                  evelat[x] +
                  ')" style="border: 2px solid white !important; background-color: #0090bf; color: white; padding: 10px 20px; font-size: 1.3em; border-radius: 5px; cursor: pointer;">' +
                  "إذهب الى الطابق " +
                  evenext[x] +
                  ' <i class="fa-solid fa-circle-down"></i>' +
                  "</button>" +
                  "</div>"
              )
              .addTo(map);
            popups_global.push(popup_global);

            break;
          }
        }
      } else {
        popups_global.forEach((popup) => popup.remove());
        popups_global = []; // clear the array
      }
    }
  }
}

function select_dropdown_list_item() {
  var To = document.getElementById("to_location");
  var Location_end_ = To.options[To.selectedIndex].value;
  var sel = document.getElementById("to_location");
  var to_coordinates = Location_end_.split(",");
  to_poi_name = sel.options[sel.selectedIndex].text;
  var to_lg = to_coordinates[0];
  var to_lt = to_coordinates[1];
  to_lvl = level_array[parseInt(to_coordinates[2])];

  var from = document.getElementById("from_location");
  var from_Location_end_ = from.options[from.selectedIndex].value;
  var from_sel = document.getElementById("from_location");
  var from_coordinates = from_Location_end_.split(",");
  from_poi_name = from_sel.options[from_sel.selectedIndex].text;
  var from_lg = from_coordinates[0];
  var from_lt = from_coordinates[1];
  from_lvl = level_array[parseInt(from_coordinates[2])];

  if (routeEnabled) {
    ClearRoute();
  }
  console.log("POI : " + to_poi_name + " , " + to_lg + " , " + to_lt);
  draw_path_to_poi(
    from_poi_name,
    from_lg,
    from_lt,
    from_lvl,
    to_poi_name,
    to_lg,
    to_lt,
    to_lvl
  );
}

var remove_extra_route_flag = false;

var get_instructions_flag = false;

var route_counter_inc = 0;

var int_r_lng;
var int_r_lat;

var SmartRoute_counter = 0;

async function Route_level() {
  SmartRoute_counter = 0;
  if (
    ((route_counter_inc = 0),
    (Route_by_level = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      ],
    }),
    (Route_by_level_another = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      ],
    }),
    (SmartRoute = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            level: null,
          },
          geometry: {
            type: "LineString",
            coordinates: [],
            properties: { color: "#73c4f0" },
          },
        },
      ],
    }),
    route_array.length > 0)
  ) {
  }

  ////console.log("GPS : "+is_GPS);

  var pre_lvl;
  for (var s = !1, u = !1, p = 0; p < route_array.length; p++) {
    var o = Routes_array[route_array[p]],
      a = o.split(","),
      r = a[0],
      i = a[1],
      g = a[2];

    if (g == pre_lvl) {
      SmartRoute.features[SmartRoute_counter].properties.level = pre_lvl;
      SmartRoute.features[SmartRoute_counter].geometry.coordinates.push([r, i]);
    } else {
      SmartRoute_counter++;
      pre_lvl = g;
      SmartRoute.features[SmartRoute_counter] = {
        type: "Feature",
        properties: {
          level: pre_lvl,
        },
        geometry: {
          type: "LineString",
          coordinates: [[r, i]],
        },
      };
    }
  }

  renderDirectionsPanel(SmartRoute, "directions-panel");
  document.getElementById("directions-panel").style.display = "none";

  if (remove_extra_route_flag) {
    remove_extra_route_flag = !1;
    var m = window.setInterval(function () {
      map.getLayer("route"),
        void 0 !== map.getSource("route") &&
          (map.getSource("route").setData(SmartRoute),
          map.getSource("route_another").setData(SmartRoute),
          map.getSource("route_outline").setData(SmartRoute),
          map.getSource("route_another_outline").setData(SmartRoute),
          window.clearInterval(m));
    }, 100);
  } else
    remove_route_layer(),
      map.addSource("route", {
        type: "geojson",
        data: SmartRoute,
      }),
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        filter: ["==", "level", Level_route_poi.toString()],
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#0099EA",
          "line-width": 15,
        },
      }),
      map.addSource("route_outline", {
        type: "geojson",
        data: SmartRoute,
      }),
      map.addLayer({
        id: "route_outline",
        type: "line",
        filter: ["==", "level", Level_route_poi.toString()],
        source: "route_outline",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#40B3EF",
          "line-width": 9,
          //"line-pattern": "fast-forward3.png"
        },
      }),
      map.addSource("route_another", {
        type: "geojson",
        data: SmartRoute,
      }),
      map.addLayer({
        id: "route_another",
        type: "line",
        source: "route_another",
        filter: ["!=", "level", Level_route_poi.toString()],
        layout: {
          //visibility: "none",
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#BBBBBB",
          "line-width": 9,
          "line-opacity": 0.4,
          //"line-pattern": "fast-forward4.png"
        },
      }),
      map.addSource("route_another_outline", {
        type: "geojson",
        data: SmartRoute,
      }),
      map.addLayer({
        id: "route_another_outline",
        type: "line",
        source: "route_another_outline",
        filter: ["!=", "level", Level_route_poi.toString()],
        layout: {
          //visibility: "none",
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#A5A4A4",
          "line-width": 15,
          "line-opacity": 0.4,
        },
      }),
      initializeArrowsSourceAndLayer();
  setupAnimation();
  startAnimation();
}

function remove_route_layer() {
  var mapSource = map.getSource("route");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route");
    map.removeSource("route");
    map.removeLayer("route_outline");
    map.removeSource("route_outline");
  }

  var mapSource = map.getSource("route_outline");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route_outline");
    map.removeSource("route_outline");
  }

  var mapSource = map.getSource("route_another");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route_another");
    map.removeSource("route_another");
  }

  var mapSource = map.getSource("route_another_outline");
  if (typeof mapSource !== "undefined") {
    map.removeLayer("route_another_outline");
    map.removeSource("route_another_outline");
  }
}

const baseArrowsPerKm = 80;
const minArrows = 0;
const maxArrows = 100;
const steps = 300;
let animationSpeed = 0.5;

let animationFrameId = null;
let isAnimating = false;
let animationState = [];

const arrowDataURL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAA7NJREFUeJzVm71uFUcYht9JgUVQHFpsKRI0MU64AcB3gJDTB/MjoEgRoSgYWjpL9EhICCMkikiJgsgVWIgbiHL4aSgQtpIujkiAhPihOD5g7D1n55v5ZtZ+yuPdmXdm3m+97+6s1BHAOeAP4HfgTFc6OgGYBt7wnv+Aqa51VQNYZCs3utZVBWASeN0wAa+Aidp6PqrdoaQLknY1/D4m6dvKWuoCjAN/Nqz+gFVgb01NtR3wjaRPR/x9XNL5SlrqAowBKyNWf8Ay0FQiRajpgDlJ+yKOm5D0dWEtdQEC8DBi9Qc8Brq4QJcB+Mow+AHHu9btBvAgYQLud63bBWAmYfADjnStPxvgl4wJuNu1/iyAKeD/jAlYA6ZLaix9pb2U2UeQ9J2TlqEdFAGYlPRUzff9Fl5LOhBCWMlXtZWSDhgWeqwUDUlFHACMS3qm0ff9Fv6S9FkIYdWpvXeUckBb6LFSLCS5OwAYU7/2vR9urEjaH0L417PREg44If/BS4VCkqsDgCCpJ+mgZ7sbeCJpOoSw5tWgtwNmVW7wkvS5pGMF28+DtNBjZXuGJPJCj5XDXro9S+CiY1ttzHs15HIRpP9Wp6d6j9iQ9GUI4WFuQ16Cc0OPFbeQlO0A/EKPFZeQ5LFqXqHHiktIynIA/qHHSnZIynWAd+ixkh2Skh1AudBjZVn9a0FSSMpxQKnQY2VSGSEpyQH0Q89vkoo+sDSQHJJSHTCr7TN4KSMkpU7A94nnlSTpVtw8AcCMJLcw4sjRlJCU4oCaoceKOSSZLoIdhB4r5pBkHch8wjk1MYekaAd0GHqsmEKSZTW7Cj1WTCEpygGFQs9L9Sf1laRrkvY4tu37Jgm47PxM7xFwaEP7U8Cvzn34/Leiv71t2VHYbWDLagO7geuO/TzHY7sdcNZJ0D9Aa3QF5oAXTn3mbcOnv72t5yDkA8tH9OtVEnnb7YBZBxGNlo/o26sk0rfbkfemJ8ryERpySyLtTRJ5b3pMlo/QklsS9vAG3EvsLMnyEXpySuJna2cp29tcLB+hLaUkbNvtgJvGDlwtH6EvpSTivkli+Dc9wyhi+Qid1pKI+yYJuBrZYBXLR+i1lMRCW2Nt3/QMqGr5NogviVVgeKAjLvR0Yvk2iC+J5pBEe+jZFpZvg/aSaA5JwOkRJ/UovGvbE+ALRmeYk00n/TDk4EXg4w7GkQWwB7g1ZEx3mk5Y2HTQi8aZ2mEAp4C/N43tStOBnwA/rQ98aSdZvo31klhaH9uPGx39Fpn2a5HgsYvXAAAAAElFTkSuQmCC";

function setupArrowAnimation() {
  const workerBlobCode = `
  self.importScripts('https://unpkg.com/@turf/turf@6/turf.min.js');
  
  self.onmessage = function(e) {
      const { features, level, baseArrowsPerKm, minArrows, maxArrows, steps, animationSpeed } = e.data;
      const animationState = [];
  
      const matched = features.filter(f => 
          f.properties?.level === level &&
          f.geometry?.type === 'LineString'
      );
  
      matched.forEach(routeFeature => {
          const coords = routeFeature.geometry.coordinates;
          if (coords.length < 2) return;
  
          const line = turf.lineString(coords);
          const routeLengthKm = turf.length(line, { units: 'kilometers' });
  
          let arrowCount = Math.round(routeLengthKm * baseArrowsPerKm);
          arrowCount = Math.max(minArrows, Math.min(maxArrows, arrowCount));
  
          const arc = [];
          const totalSteps = Math.round(steps * (routeLengthKm / 0.1));
          for (let i = 0; i <= totalSteps; i++) {
              const pt = turf.along(line, routeLengthKm * i / totalSteps, { units: 'kilometers' });
              arc.push(pt.geometry.coordinates);
          }
  
          const spacing = Math.max(1, Math.floor(arc.length / arrowCount));
          const counters = [];
          for (let i = 0; i < arrowCount; i++) {
              counters.push(i * spacing % arc.length);
          }
  
          animationState.push({ arc, counters, arrowCount, animationSpeed });
      });
  
      self.postMessage({ animationState });
  };
  `;

  window.worker = new Worker(
    URL.createObjectURL(
      new Blob([workerBlobCode], { type: "application/javascript" })
    )
  );

  worker.onmessage = (e) => {
    window.animationState = e.data.animationState;
    initializeArrowsSourceAndLayer();
    if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
    animateArrows();
  };

  startAnimation();
}
function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;

  if (!map.hasImage("arrow-icon")) {
    const img = new Image();
    img.onload = () => {
      map.addImage("arrow-icon", img);
      setupAnimation();
    };
    img.src = arrowDataURL;
  } else {
    setupAnimation();
  }
}

function setupAnimation() {
  const src = map.getSource("route_outline")._data;
  if (!src || !Array.isArray(src.features)) {
    console.error("Invalid route data format");
    return;
  }

  const levelStr = Level_route_poi.toString();

  worker.postMessage({
    features: src.features,
    level: levelStr,
    baseArrowsPerKm,
    minArrows,
    maxArrows,
    steps,
    animationSpeed,
  });

  worker.onmessage = function (e) {
    animationState = e.data.animationState;
    initializeArrowsSourceAndLayer();

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animateArrows();
  };
}

function animateArrows() {
  if (!isAnimating) return;

  const features = [];

  animationState.forEach((state) => {
    const { arc, counters, arrowCount, animationSpeed } = state;

    for (let i = 0; i < arrowCount; i++) {
      const idx = Math.floor(counters[i]) % arc.length;
      const coord = arc[idx];
      const next = arc[(idx + 1) % arc.length];
      const bearing = turf.bearing(turf.point(coord), turf.point(next));

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coord },
        properties: { bearing },
      });

      counters[i] = (counters[i] + animationSpeed) % arc.length;
    }
  });

  map.getSource("arrow-point").setData({
    type: "FeatureCollection",
    features,
  });

  animationFrameId = requestAnimationFrame(animateArrows);
}

function initializeArrowsSourceAndLayer() {
  if (!map.getSource("arrow-point")) {
    map.addSource("arrow-point", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  } else {
    map
      .getSource("arrow-point")
      .setData({ type: "FeatureCollection", features: [] });
  }

  if (!map.getLayer("arrow-layer")) {
    map.addLayer({
      id: "arrow-layer",
      type: "symbol",
      source: "arrow-point",
      layout: {
        "icon-image": "arrow-icon",
        "icon-size": 0.25,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
      },
    });
  }

  setTimeout(() => {
    map.moveLayer("arrow-layer");
  }, 500);
}

function stopAnimation() {
  isAnimating = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function ClearRoute() {
  //route_bounds_fit = false;
  initializeArrowsSourceAndLayer();
  stopAnimation();
  exit_into_nvgation_mode();
  route_array = [];
  full_distance_to_destination = 0;
  global_time = 0;
  routeEnabled = false;
  document.getElementsByClassName("directions-panel")[0].style.display = "none";
  document.getElementById("menu").style.display = "block";

  if (markerA) markerA.remove();
  if (markerB) markerB.remove();

  from_marker_location = [];
  to_marker_location = [];
  from_marker_lvl = null;
  to_marker_lvl = null;

  popups_global.forEach((popup) => popup.remove());
  popups_global = []; // clear the array

  var mapLayer = map.getLayer("route");
  if (typeof mapLayer !== "undefined") {
    map.removeLayer("route");
    map.removeSource("route");

    map.removeLayer("route_another");
    map.removeSource("route_another");

    var route_outline = map.getLayer("route_outline");
    if (typeof route_outline !== "undefined") {
      map.removeLayer("route_outline");
      map.removeSource("route_outline");
    }

    if (typeof route_outline !== "undefined") {
      map.removeLayer("route_another_outline");
      map.removeSource("route_another_outline");
    }

    // map.removeLayer("poi_fill");
    // map.removeSource("poi_fill");

    // map.removeLayer("poi_border");
    // map.removeSource("poi_border");
  }
}

let markerA = null;
let markerB = null;

function addFromToMarkers(from, to, levelA, levelB) {
  // Remove existing markers
  if (markerA) markerA.remove();
  if (markerB) markerB.remove();
  if (fromMarker) fromMarker.remove();
  if (toMarker) toMarker.remove();

  // Add marker A if level matches
  if (levelA === Level_route_poi) {
    const elA = document.createElement("div");
    elA.innerHTML = `
            <div style="background:#00BFFF;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                A
            </div>`;
    markerA = new mapboxgl.Marker(elA).setLngLat(from).addTo(map);
  } else {
    const elA = document.createElement("div");
    elA.innerHTML = `
            <div style="background:#b6b6b6;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                A
            </div>`;
    markerA = new mapboxgl.Marker(elA).setLngLat(from).addTo(map);
  }

  // Add marker B if level matches
  if (levelB === Level_route_poi) {
    const elB = document.createElement("div");
    elB.innerHTML = `
            <div style="background:#6A5ACD;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                B
            </div>`;
    markerB = new mapboxgl.Marker(elB).setLngLat(to).addTo(map);
  } else {
    const elB = document.createElement("div");
    elB.innerHTML = `
            <div style="background:#b6b6b6;color:#fff;
                        border-radius:50%;width:30px;height:30px;
                        border: 2px solid;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                B
            </div>`;
    markerB = new mapboxgl.Marker(elB).setLngLat(to).addTo(map);
  }
}

function switchFloorByNo(floor_name, lng, lat) {
  if (floor_name == "0") {
    floor_name = "G";
  }
  var menubtn = document.getElementById("menu");

  for (var i = 0; i < menubtn.childElementCount; i++) {
    var floor = menubtn.children[i].innerText;
    if (floor_name == "G") {
      if (floor == floor_name) {
        menubtn.children[i].click();
      }
    } else {
      if (floor == floor_name) {
        menubtn.children[i].click();
      }
    }
  }
}

function extractLngLat(routeString) {
  if (!routeString) return [];

  const parts = routeString.split(",");
  if (parts.length < 2) return [];

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  return [lng, lat];
}

let fromMarker = null,
  toMarker = null;
let fromPolygonId = null,
  toPolygonId = null;

let from_poi_name = null,
  from_lg = null,
  from_lt = null,
  from_lvl = null;
let to_poi_name = null,
  to_lg = null,
  to_lt = null,
  to_lvl = null;

function setupMapEventHandlers() {
  map.on("click", "polygons", function (e) {
    const clickedPolygon = e.features[0];
    const clickedPolygonId = clickedPolygon.id;
    const coords = turf.centroid(clickedPolygon).geometry.coordinates;
    const props = clickedPolygon.properties;

    if (!fromMarker) {
      // Set A marker
      fromPolygonId = clickedPolygonId;
      const elA = document.createElement("div");
      elA.innerHTML = `
                  <div style="background:#00BFFF;color:#fff;
                              border-radius:50%;width:30px;height:30px;
                              display:flex;align-items:center;justify-content:center;
                              font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                      A
                  </div>`;
      fromMarker = new mapboxgl.Marker(elA).setLngLat(coords).addTo(map);
      fly_to_A_point;
      // Save from data
      from_lg = coords[0];
      from_lt = coords[1];
      from_lvl = props.Level || 0;
      from_poi_name = props.title || "Point A";
      if (routeEnabled) {
        ClearRoute();
      }
      fly_to_A_point(from_lg, from_lt);
    } else if (!toMarker) {
      // Validate A ≠ B
      if (clickedPolygonId === fromPolygonId) {
        //alert("Please select a different polygon for destination (B).");
        return;
      }

      // Set B marker
      toPolygonId = clickedPolygonId;
      const elB = document.createElement("div");
      elB.innerHTML = `
                  <div style="background:#6A5ACD;color:#fff;
                              border-radius:50%;width:30px;height:30px;
                              display:flex;align-items:center;justify-content:center;
                              font-weight:bold;box-shadow:0 0 6px rgba(0,0,0,0.3)">
                      B
                  </div>`;
      toMarker = new mapboxgl.Marker(elB).setLngLat(coords).addTo(map);

      // Save to data
      to_lg = coords[0];
      to_lt = coords[1];
      to_lvl = props.Level || 0;
      to_poi_name = props.title || "Point B";

      // Clear previous route if any
      if (routeEnabled) {
        ClearRoute();
      }

      // ✅ Call path drawing function now that all data is ready
      draw_path_to_poi(
        from_poi_name,
        from_lg,
        from_lt,
        from_lvl,
        to_poi_name,
        to_lg,
        to_lt,
        to_lvl
      );
    } else {
      // If both already selected, reset
      resetMarkers();
    }
  });
}

// Reset function
function resetMarkers() {
  if (fromMarker) fromMarker.remove();
  if (toMarker) toMarker.remove();

  fromMarker = null;
  toMarker = null;
  fromPolygonId = null;
  toPolygonId = null;

  from_poi_name = to_poi_name = null;
  from_lg = from_lt = from_lvl = null;
  to_lg = to_lt = to_lvl = null;
}

//! Nav Instrucions
/**
 * Generate navigation instructions from a GeoJSON route object
 * @param {Object} geojsonRoute - GeoJSON route object with features containing level information and coordinates
 * @returns {Array} Array of instruction objects with text, icon, level, and coordinates
 */
function generateNavigationInstructions(geojsonRoute) {
  // Validate input
  if (
    !geojsonRoute ||
    !geojsonRoute.features ||
    !Array.isArray(geojsonRoute.features)
  ) {
    console.error("Invalid GeoJSON route object");
    return [];
  }

  const instructions = [];
  let currentLevel = null;
  let previousCoordinate = null;
  let previousBearing = null;

  // Direction icons
  const directionIcons = {
    N: "↑",
    NE: "↗",
    E: "→",
    SE: "↘",
    S: "↓",
    SW: "↙",
    W: "←",
    NW: "↖",
  };

  // Turn icons
  const turnIcons = {
    left: "↰",
    right: "↱",
    "slight-left": "↰",
    "slight-right": "↱",
    "sharp-left": "⬅",
    "sharp-right": "➡",
    "u-turn": "⟲",
  };

  // Floor transition icons
  const floorIcons = {
    up: "🔼",
    down: "🔽",
    elevator: "🛗",
    stairs: "🪜",
  };

  // Start/end icons
  const startEndIcons = {
    start: "🏁",
    destination: "🎯",
  };

  /**
   * Calculate bearing between two coordinates
   * @param {Array} start - Start coordinate [longitude, latitude]
   * @param {Array} end - End coordinate [longitude, latitude]
   * @returns {Number} Bearing in degrees (0-360)
   */
  function calculateBearing(start, end) {
    try {
      const startLat = (parseFloat(start[1]) * Math.PI) / 180;
      const startLng = (parseFloat(start[0]) * Math.PI) / 180;
      const endLat = (parseFloat(end[1]) * Math.PI) / 180;
      const endLng = (parseFloat(end[0]) * Math.PI) / 180;

      const y = Math.sin(endLng - startLng) * Math.cos(endLat);
      const x =
        Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

      let bearing = (Math.atan2(y, x) * 180) / Math.PI;
      if (bearing < 0) {
        bearing += 360;
      }

      return bearing;
    } catch (error) {
      console.error("Error calculating bearing:", error);
      return 0;
    }
  }

  /**
   * Convert bearing to cardinal direction
   * @param {Number} bearing - Bearing in degrees
   * @returns {String} Cardinal direction (N, NE, E, etc.)
   */
  function getCardinalDirection(bearing) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Array} start - Start coordinate [longitude, latitude]
   * @param {Array} end - End coordinate [longitude, latitude]
   * @returns {Number} Distance in meters
   */
  function calculateDistance(start, end) {
    try {
      const R = 6371000; // Earth radius in meters
      const lat1 = (parseFloat(start[1]) * Math.PI) / 180;
      const lat2 = (parseFloat(end[1]) * Math.PI) / 180;
      const deltaLat =
        ((parseFloat(end[1]) - parseFloat(start[1])) * Math.PI) / 180;
      const deltaLng =
        ((parseFloat(end[0]) - parseFloat(start[0])) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLng / 2) *
          Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    } catch (error) {
      console.error("Error calculating distance:", error);
      return 0;
    }
  }

  /**
   * Determine turn direction based on bearing change
   * @param {Number} prevBearing - Previous bearing
   * @param {Number} currentBearing - Current bearing
   * @returns {Object} Turn information with direction and angle
   */
  function determineTurn(prevBearing, currentBearing) {
    let angle = currentBearing - prevBearing;

    // Normalize angle to -180 to 180
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;

    const absAngle = Math.abs(angle);

    // Determine turn direction
    if (absAngle < 10) {
      return { direction: "straight", angle: absAngle };
    } else if (absAngle < 45) {
      return {
        direction: angle > 0 ? "slight-right" : "slight-left",
        angle: absAngle,
      };
    } else if (absAngle < 135) {
      return {
        direction: angle > 0 ? "right" : "left",
        angle: absAngle,
      };
    } else if (absAngle < 180) {
      return {
        direction: angle > 0 ? "sharp-right" : "sharp-left",
        angle: absAngle,
      };
    } else {
      return { direction: "u-turn", angle: absAngle };
    }
  }

  /**
   * Format distance for display
   * @param {Number} distance - Distance in meters
   * @returns {String} Formatted distance string
   */
  function formatDistance(distance) {
    if (distance < 10) {
      return `${Math.round(distance)} meters`;
    } else if (distance < 1000) {
      return `${Math.round(distance / 10) * 10} meters`;
    } else {
      return `${(distance / 1000).toFixed(1)} kilometers`;
    }
  }

  // Process each feature in the GeoJSON
  try {
    // Filter out empty features first to avoid processing them
    const validFeatures = geojsonRoute.features.filter(
      (feature) =>
        feature &&
        feature.geometry &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length > 0
    );

    for (let i = 0; i < validFeatures.length; i++) {
      const feature = validFeatures[i];
      const featureLevel = feature.properties.level;
      const coordinates = feature.geometry.coordinates;

      // Handle floor level change
      if (currentLevel !== null && currentLevel !== featureLevel) {
        const floorChange =
          parseInt(featureLevel) > parseInt(currentLevel) ? "up" : "down";
        const icon = floorIcons[floorChange === "up" ? "up" : "down"];

        instructions.push({
          text: `Take stairs or elevator ${floorChange} to floor ${featureLevel}`,
          icon: icon,
          level: featureLevel,
          coordinates: [previousCoordinate, coordinates[0]],
        });
      }

      currentLevel = featureLevel;

      // Add start instruction if this is the first valid feature
      if (instructions.length === 0) {
        const firstCoord = coordinates[0];
        const secondCoord =
          coordinates.length > 1 ? coordinates[1] : coordinates[0];
        const initialBearing = calculateBearing(firstCoord, secondCoord);
        const direction = getCardinalDirection(initialBearing);

        instructions.push({
          text: `Head ${direction.toLowerCase()} on`,
          icon: startEndIcons.start,
          level: featureLevel,
          coordinates: [firstCoord],
        });

        previousBearing = initialBearing;
      }

      // Process coordinates within the feature
      let segmentStartIndex = 0;
      let segmentDistance = 0;
      let lastDirection = null;

      for (let j = 1; j < coordinates.length; j++) {
        const start = coordinates[j - 1];
        const end = coordinates[j];

        // Skip invalid coordinates
        if (!start || !end || start.length < 2 || end.length < 2) {
          continue;
        }

        const bearing = calculateBearing(start, end);
        const direction = getCardinalDirection(bearing);
        const distance = calculateDistance(start, end);

        segmentDistance += distance;

        // If we have a previous bearing, check for turns
        if (previousBearing !== null && j === 1) {
          const turn = determineTurn(previousBearing, bearing);

          // Only add turn instruction if it's significant
          if (turn.direction !== "straight" && turn.angle > 30) {
            instructions.push({
              text: `Turn ${turn.direction.replace("-", " ")} onto`,
              icon: turnIcons[turn.direction],
              level: featureLevel,
              coordinates: [start],
            });

            segmentStartIndex = j - 1;
            segmentDistance = distance;
          }
        }

        // Check for direction change within feature
        if (lastDirection !== null && direction !== lastDirection && j > 1) {
          const prevCoord = coordinates[j - 2];
          const currCoord = coordinates[j - 1];

          // Skip invalid coordinates
          if (
            !prevCoord ||
            !currCoord ||
            prevCoord.length < 2 ||
            currCoord.length < 2
          ) {
            continue;
          }

          const turn = determineTurn(
            calculateBearing(prevCoord, currCoord),
            bearing
          );

          // Only add turn instruction if it's significant
          if (turn.direction !== "straight" && turn.angle > 30) {
            // Add instruction for the previous segment
            if (j - 1 > segmentStartIndex) {
              const segStartCoord = coordinates[segmentStartIndex];
              const segEndCoord = coordinates[j - 1];

              // Skip invalid coordinates
              if (
                !segStartCoord ||
                !segEndCoord ||
                segStartCoord.length < 2 ||
                segEndCoord.length < 2
              ) {
                continue;
              }

              const prevSegmentDistance = calculateDistance(
                segStartCoord,
                segEndCoord
              );

              instructions.push({
                text: `Continue ${formatDistance(prevSegmentDistance)}`,
                icon: directionIcons[lastDirection],
                level: featureLevel,
                distance: prevSegmentDistance,
                coordinates: [segStartCoord, segEndCoord],
              });
            }

            // Add turn instruction
            instructions.push({
              text: `Turn ${turn.direction.replace("-", " ")} onto`,
              icon: turnIcons[turn.direction],
              level: featureLevel,
              coordinates: [coordinates[j - 1]],
            });

            segmentStartIndex = j - 1;
            segmentDistance = distance;
          }
        }

        lastDirection = direction;
        previousBearing = bearing;
        previousCoordinate = end;

        // If this is the last coordinate in the feature and we've accumulated distance
        if (j === coordinates.length - 1 && segmentDistance > 0) {
          const segStartCoord = coordinates[segmentStartIndex];
          const segEndCoord = coordinates[j];

          // Skip invalid coordinates
          if (
            !segStartCoord ||
            !segEndCoord ||
            segStartCoord.length < 2 ||
            segEndCoord.length < 2
          ) {
            continue;
          }

          instructions.push({
            text: `Continue ${formatDistance(segmentDistance)}`,
            icon: directionIcons[direction],
            level: featureLevel,
            distance: segmentDistance,
            coordinates: [segStartCoord, segEndCoord],
          });
        }
      }
    }

    // Add destination instruction if we have any instructions
    if (instructions.length > 0 && validFeatures.length > 0) {
      const lastFeature = validFeatures[validFeatures.length - 1];
      const lastCoords = lastFeature.geometry.coordinates;

      if (lastCoords && lastCoords.length > 0) {
        const lastCoord = lastCoords[lastCoords.length - 1];

        instructions.push({
          text: "You have reached your destination",
          icon: startEndIcons.destination,
          level: lastFeature.properties.level,
          coordinates: [lastCoord],
        });
      }
    }
  } catch (error) {
    console.error("Error generating navigation instructions:", error);
    // Return empty instructions array in case of error
    return [];
  }

  return instructions;
}

/**
 * Format distance for display in miles or feet
 * @param {Number} meters - Distance in meters
 * @returns {Object} Formatted distance with value and unit
 */
function formatDistanceImperial(meters) {
  if (!meters) return { value: "", unit: "" };

  // Convert to feet (1m ≈ 3.28084ft)
  const feet = meters;

  if (feet < 1000) {
    // Less than 1000 feet, show in feet
    return {
      value: Math.round(feet),
      unit: "meters",
    };
  } else {
    // More than 1000 feet, show in miles
    const miles = feet / 1000;
    return {
      value: miles.toFixed(2),
      unit: "km",
    };
  }
}

/**
 * Calculate total distance and time from instructions
 * @param {Array} instructions - Array of instruction objects
 * @returns {Object} Total distance in meters and estimated time in minutes
 */
function calculateTotals(instructions) {
  let totalDistance = 0;

  instructions.forEach((instruction) => {
    if (instruction.distance) {
      totalDistance += instruction.distance;
    }
  });

  // Estimate time (rough calculation: ~3mph walking speed)
  const minutes = Math.round(totalDistance / 80.4672);

  return {
    distance: totalDistance,
    time: minutes,
  };
}

/**
 * Render navigation instructions to the directions panel
 * @param {Object} geojsonRoute - GeoJSON route object
 * @param {String} containerId - ID of the container element
 */
function renderDirectionsPanel(geojsonRoute, containerId = "directions-panel") {
  try {
    // Generate the navigation instructions
    const instructions = generateNavigationInstructions(geojsonRoute);

    // Calculate totals
    const totals = calculateTotals(instructions);

    // Format total distance
    const totalDistanceFormatted = formatDistanceImperial(totals.distance);

    // Find the container
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    // Build HTML
    let html = `
      <div class="summary">
        <div class="destination"><i class="fa fa-map-marker" aria-hidden="true"></i> ${to_poi_name}&nbsp;min</div>
        <div class="distance"><i class="fa fa-map-o" aria-hidden="true"></i> ${totalDistanceFormatted.value}&nbsp;${totalDistanceFormatted.unit}</div>
        <div class="time"><i class="fa fa-clock-o" aria-hidden="true"></i> ${totals.time}&nbsp;min</div>
        <div><button class="cloes" onclick="ClearRoute()" >✖</button></div>
      </div>
      <div class="expandcollapse" onclick="toggle_instruction_card()"><i class="fa fa-plus-square" aria-hidden="true"></i> Show Instrucions</div>
      <div class="from"><i class="fa fa-circle" aria-hidden="true" style="color: #C96868;"></i> &nbsp; ${from_poi_name}</div>
      <ul class="instructions">
    `;

    // Add instructions
    instructions.forEach((instruction, index) => {
      // Format distance if available
      let distanceHtml = "";
      if (instruction.distance) {
        const distanceFormatted = formatDistanceImperial(instruction.distance);
        distanceHtml = `<div class="distance">${distanceFormatted.value}&nbsp;${distanceFormatted.unit}</div>`;
      }

      // Determine if this is the first instruction (for letter A)
      const isFirst = index === 0;

      // Street name extraction (assuming it follows "onto" or "on")
      let mainText = instruction.text;
      let streetName = "";

      if (mainText.includes(" on ")) {
        const parts = mainText.split(" on ");
        mainText = parts[0];
        streetName = parts[1] || "";
      } else if (mainText.includes(" onto ")) {
        const parts = mainText.split(" onto ");
        mainText = parts[0];
        streetName = parts[1] || "";
      }

      // Build the instruction HTML
      html += `
        <li class="instruction">
          ${
            isFirst
              ? `<div class="letter">A</div>`
              : `<div class="icon">${instruction.icon}</div>`
          }
          <div class="text">
            <div class="main">${mainText} ${streetName}</div>
            ${distanceHtml}
          </div>
        </li>
      `;
    });

    html += "</ul>";

    html +=
      '<div class="to"><i class="fa fa-map-marker" aria-hidden="true" style="font-size: 15px;color : #6A9C89"></i> &nbsp; ' +
      to_poi_name +
      "</div>";

    html += `<button id="endroute"  onclick="ClearRoute()">End Route</button>`;

    // Update the containrouteer
    container.innerHTML = html;
  } catch (error) {
    console.error("Error rendering directions panel:", error);
  }
}

function toggle_instruction_card() {
  const card = document.getElementById("directions-panel");
  const from = card.querySelector(".from");
  const instructions = card.querySelector(".instructions");
  const to = card.querySelector(".to");

  // Check if currently expanded (before toggling)
  const isCurrentlyExpanded = from.classList.contains("expanded");

  // Toggle the class
  from.classList.toggle("expanded");
  instructions.classList.toggle("expanded");
  to.classList.toggle("expanded");
  const windowWidth = window.innerWidth;
  // Call different functions based on new state
  if (!isCurrentlyExpanded) {
    document.getElementsByClassName("expandcollapse")[0].innerHTML =
      '<i class="fa fa-minus-square" aria-hidden="true"></i> Hide Instrucions';
    if (windowWidth >= 768) {
      document.getElementById("menu").style.display = "none";
    }
  } else {
    document.getElementsByClassName("expandcollapse")[0].innerHTML =
      '<i class="fa fa-plus-square" aria-hidden="true"></i> Show Instrucions';
    if (windowWidth >= 768) {
      document.getElementById("menu").style.display = "block";
    }
  }
}

function toggleContent(id) {
  const element = document.getElementsByClassName(id)[0];
  if (element.style.display === "none" || element.style.display === "") {
    element.style.display = "block";
    document.getElementsByClassName("expandcollapse")[0].innerHTML =
      '<i class="fa fa-minus-square" aria-hidden="true"></i> Hide Instrucions';
  } else {
    element.style.display = "none";
    document.getElementsByClassName("expandcollapse")[0].innerHTML =
      '<i class="fa fa-plus-square" aria-hidden="true"></i> Show Instrucions';
  }
}

function enter_into_nvgation_mode(Route_geojson) {
  if (Route_geojson.features[1].geometry.coordinates.length > 1) {
    var point1 = turf.point([
      parseFloat(Route_geojson.features[1].geometry.coordinates[0][0]),
      parseFloat(Route_geojson.features[1].geometry.coordinates[0][1]),
    ]);
    var point2 = turf.point([
      parseFloat(Route_geojson.features[1].geometry.coordinates[1][0]),
      parseFloat(Route_geojson.features[1].geometry.coordinates[1][1]),
    ]);
    var bearing = turf.bearing(point1, point2);
    map.flyTo({
      center: [
        parseFloat(Route_geojson.features[1].geometry.coordinates[0][0]),
        parseFloat(Route_geojson.features[1].geometry.coordinates[0][1]),
      ],
      bearing: bearing,
      pitch: 56.50000000000002,
      zoom: 20.234504452665387,
      duration: 4000,
      essential: true,
    });
    if (parseInt(SmartRoute.features[1].properties.level) != Level_route_poi) {
      switch_to_A_floor();
    }
  }
}

function switch_to_A_floor() {
  var menubtn = document.getElementById("menu");

  for (var i = 0; i < menubtn.childElementCount; i++) {
    var floor = menubtn.children[i].innerText;
    if (floor == "G") {
      floor = 0;
    } else {
      floor = parseInt(floor);
    }
    console.log(
      "Floor : " +
        floor +
        " , " +
        Level_route_poi +
        " : " +
        (floor == Level_route_poi)
    );
    if (floor == from_lvl) {
      console.log("SWITCHED : " + floor);
      menubtn.children[i].click();
    }
  }
}

function exit_into_nvgation_mode() {
  map.flyTo({
    center: [map.getCenter().lng, map.getCenter().lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.343589520103954,
    duration: 4000,
    essential: true,
  });
}

function fly_to_A_point(lng, lat) {
  map.flyTo({
    center: [lng, lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.343589520103954,
    duration: 4000,
    essential: true,
  });
}

function initializeApp() {
  initUI();
  setupMapEventHandlers();
  setupArrowAnimation();
}

initializeApp();
