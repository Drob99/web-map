import { map } from "../mapInit.js";
import {
    state,
} from "../config.js";

// bring in each individual layer‐drawing function
import { walls_layer } from "./walls.js";
import { street_layer } from "./street.js";
import { rooms_layer } from "./rooms.js";
import { sidewalk_layer } from "./sidewalk.js";
import { parking_layer } from "./parking.js";
import { outlayer_layer } from "./outlayer.js";
import { otherlayer } from "./other.js";
import { arrows_layer } from "./arrows.js";
import { doors_layer } from "./doors.js";
import { corridors_layer } from "./corridors.js";
import { be_layer } from "./be.js";
import { garden_layer } from "./garden.js";
import { poi_show_by_level, routeEnabled } from "../mapController.js";

/**
 * Process & add layers on each floor.
 * @param {Array} sortedInput
 * @returns {boolean}
 */
export async function layers_level(sortedInput) {
  let isLayersProcessed = true;
  try {
    if (sortedInput.length && sortedInput[0].building_floor.layers.length > 0) {
      for (let c = 0; c < sortedInput.length; c++) {
        let floor_title = sortedInput[c].building_floor.name;
        floor_title = floor_title === "G" ? 0 : parseInt(floor_title, 10);
        const build_id = sortedInput[c].building_floor.building_id;
        const floor_id = sortedInput[c].building_floor.id;
        state.level_array[floor_id] = floor_title;

        for (let m = 0; m < sortedInput[c].building_floor.layers.length; m++) {
          const layer = sortedInput[c].building_floor.layers[m];
          const kind = layer.kind;
          const url = layer.file.url;

          // collect unique layer names
          if (!state.Layersnames.includes(kind)) {
            state.Layersnames.push(kind === "other" ? layer.file.filename : kind);
          }

          try {
            switch (kind) {
              case "walls":
                walls_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "street":
                street_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "rooms":
                rooms_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "sidewalk":
                sidewalk_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "parking":
                parking_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "outlayer":
                outlayer_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "doors":
                doors_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "corridors":
                corridors_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "arrows":
                arrows_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "garden":
                garden_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "be":
                be_layer(`${build_id}/${floor_title}/${kind}`, url);
                break;
              case "other":
                otherlayer(
                  `${build_id}/${floor_title}/${layer.file.filename}`,
                  url
                );
                break;
              default:
                console.warn(`Unhandled layer kind: ${kind}`);
            }
          } catch (err) {
            console.error(`Error processing layer '${kind}':`, err.message);
            isLayersProcessed = false;
          }
        }

        // build the floor‐toggle UI
        if (!state.toggleableLayerIds.includes(floor_title)) {
          state.toggleableLayerIds.push(build_id + "/" + floor_title);
          if (!state.floornametitle.includes(floor_title)) {
            toggleLayer(
              [build_id + "/" + floor_title],
              floor_title === 0 ? "G" : floor_title
            );
            state.floornametitle.push(floor_title);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing layers:", error.message);
    isLayersProcessed = false;
  }
  return isLayersProcessed;
}

/**
 * Create a little link in `#menu` that toggles one floor’s layers.
 * @param {string[]} ids
 * @param {string|number} name
 */
export function toggleLayer(ids, name) {
  const link = document.createElement("a");
  link.href = "#";
  link.textContent = name;

  // detect current visibility of the first sub‐layer
  let active =
    map.getLayer(ids[0] + "/" + name) &&
    map.getLayoutProperty(ids[0] + "/" + name, "visibility");

  if (active === "visible") link.className = "active";

  link.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();

      // update current floor for POI filtering
      const floorNum = name === "G" ? 0 : parseInt(name, 10);
      state.Level_route_poi = floorNum;

    // toggle on this floor, off all others
    state.toggleableLayerIds.forEach((floorId) => {
        // floorId format: "<buildingId>/<floorNum>"
        const [, layerFloorStr] = floorId.split("/");
        const layerFloor = parseInt(layerFloorStr, 10);

    state.Layersnames.forEach((lname) => {
        const layerId = `${floorId}/${lname}`;
        if (!map.getLayer(layerId)) return;
        // make visible only if this layer’s floor matches the clicked floor
        map.setLayoutProperty(
        layerId,
        "visibility",
        layerFloor === floorNum ? "visible" : "none"
        );
    });
    });

    // highlight the active link
    Array.from(document.getElementById("menu").children).forEach((el) => {
      el.className = el === link ? "active" : "";
    });

    // trigger POI & route refresh
    poi_show_by_level();
    if (routeEnabled) {
      remove_route_layer();
      setupArrowAnimation();
      map.moveLayer("arrow-layer");
    }
  };

  document.getElementById("menu").appendChild(link);
}

