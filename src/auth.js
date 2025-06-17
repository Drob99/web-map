import { API_BASE, state } from "./config.js";
import { getCurrentTime } from "./utils.js";
import { get_category } from "./data/categories.js";
import { get_buildings }    from "./data/buildings.js";
import { get_floor_json }   from "./data/floors.js";
import { Load_Layer_data }  from "./data/layers.js";
import { load_pois_floors } from "./mapController.js";
import { load_routes, start_routes } from "./data/routes.js";
import { fly_to_building } from "./navigation.js";
import { link_elevators } from "./data/routeHelpers.js";
import { layers_level } from "./layers/layerController.js";


let start_time;

export function isAccessTokenExpired() {
  const createdAt = localStorage.getItem("created_at"); // Time when the token was created
  const expiresIn = localStorage.getItem("expires_in"); // Expiry time in seconds
  const currentTime = getCurrentTime();
  return currentTime >= parseInt(createdAt) + parseInt(expiresIn);
}

export function get_Authentication(Visitor_ID, Visitor_Secret) {
  return new Promise((resolve, reject) => {
    localStorage.clear();
    sessionStorage.clear();


    if (!localStorage.getItem("access_token") || isAccessTokenExpired()) {
      const settings = {
        url: `${API_BASE}saas_companies/KKIA/oauth/token`,
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
        state.Bearer_token = response.access_token;
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        localStorage.setItem("created_at", getCurrentTime());
        localStorage.setItem("expires_in", response.expires_in);
      
        Loadmap()
          .then(() => resolve(state.Bearer_token))
          .catch((err) => reject(err));
      })
        .fail(function (jqXHR, textStatus, errorThrown) {
          reject(
            new Error(
              `Failed to authenticate (status ${jqXHR.status}): ${errorThrown}`
            )
          );
        })
    } else {
      console.log("Access Token is still valid");
      state.Bearer_token = localStorage.getItem("access_token");
      Loadmap()
        .then(() => resolve(state.Bearer_token))
        .catch((err) => reject(err));
    }
  });
}

export async function Loadmap() {
  try {
    start_time = performance.now();
    const isFetched = await get_category(state.Bearer_token);
    if (isFetched) {
      var end_time = performance.now();
      var executionTime = end_time - start_time; // Store execution time in a variable
      //console.log("1 - Categories fetched successfully! : "+executionTime);
      try {
        var data, isDataFetched;
        if (!sessionStorage.getItem("state.buildings_object")) {
          //console.log("1 - Get new Building");
          var { data, isDataFetched } = await get_buildings(state.Bearer_token);
          state.buildings_object = JSON.parse(data);
          fly_to_building();
        } else {
          //console.log("1 - Used cached Building");
          state.buildings_object = JSON.parse(
            sessionStorage.getItem("state.buildings_object")
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
            if (!sessionStorage.getItem("state.floors_objects")) {
              //console.log("Get New Floor");
              isFloorsFetched = await get_floor_json();
              sessionStorage.setItem(
                "state.floors_objects",
                JSON.stringify(state.floors_objects)
              );
            } else {
              //console.log("Used Cached Floor");
              state.floors_objects = JSON.parse(
                sessionStorage.getItem("state.floors_objects")
              );
              isFloorsFetched = true;
            }
            if (isFloorsFetched) {
              end_time = performance.now();
              executionTime = end_time - start_time;
              //console.log("3 - Floors fetched successfully! : "+executionTime);
              try {
                var isLayersFetched;

                if (!sessionStorage.getItem("state.Layers_objects")) {
                  //console.log("Get new layers");
                  isLayersFetched = await Load_Layer_data();
                  sessionStorage.setItem(
                    "state.Layers_objects",
                    JSON.stringify(state.Layers_objects)
                  );
                } else {
                  //console.log("Used Cached Floor");
                  isLayersFetched = true;
                  state.Layers_objects = JSON.parse(
                    sessionStorage.getItem("state.Layers_objects")
                  );
                }
                if (isLayersFetched) {
                  end_time = performance.now();
                  executionTime = end_time - start_time;
                  //console.log("4 - Layers fetched successfully! : "+executionTime);
                  let sortedInput = state.Layers_objects;

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
                  let fixed_layers = sortedInput;
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
