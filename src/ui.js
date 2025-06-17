import { stringMatch } from "./utils.js";
import { draw_path_to_poi, routeEnabled } from "./data/routes.js";
import {
  floors_titles,
  state,
} from "./config.js";
import { ClearRoute } from "./mapController.js";

/**
 * Initialize the two Select2 dropdowns and swap button.
 */
export function initUI() {
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
    if (fromValue && toValue) select_dropdown_list_item();
  });

  $(".swap-btn").on("click", function () {
    const fromVal = $("#from_location").val();
    const toVal = $("#to_location").val();
    // swap values
    $("#from_location").val(toVal).trigger("change");
    $("#to_location").val(fromVal).trigger("change");
    // re-trigger select2:select handlers
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

/**
 * Case-insensitive match for Select2.
 */
export function matchCustom(params, data) {
  if ($.trim(params.term) === "") return data;
  if (typeof data.text === "undefined") return null;
  if (stringMatch(params.term, data.text)) return data;
  if (stringMatch(params.term, $(data.element).attr("data-foo")))
    return data;
  return null;
}

/**
 * Render each Select2 option with icon + subtitle.
 */
export function formatCustom(state) {
  if (!state.id) return state.text;
  const iconUrl = $(state.element).attr("data-icon");
  return $(
    `<div style="display:flex;align-items:center;">
      <img src="${iconUrl}" style="width:35px;height:35px;margin-right:15px;"/>
      <div>
        <div>${state.text}</div>
        <div class="foo" style="font-size:0.8em;color:gray;">
          ${$(state.element).attr("data-foo")}
        </div>
      </div>
    </div>`
  );
}

/**
 * Hide the splash screen after 3s.
 */
export function screensaver() {
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    splash.style.display = "none";
    splash.classList.add("fade-out");
    document.getElementsByClassName("loader-wrapper")[0].style.display =
      "none";
    setTimeout(() => splash.classList.add("hidden"), 500);
  }, 3000);
}

/**
 * When both dropdowns are selected, draw the path.
 */
export function select_dropdown_list_item() {
  const toSel = document.getElementById("to_location");
  const [to_lg, to_lt, to_floorId] =
    toSel.value.split(",");
  const to_name = toSel.options[toSel.selectedIndex].text;
  const to_lvl = state.level_array[parseInt(to_floorId, 10)];

  const fromSel = document.getElementById("from_location");
  const [from_lg, from_lt, from_floorId] =
    fromSel.value.split(",");
  const from_name = fromSel.options[fromSel.selectedIndex].text;
  const from_lvl = state.level_array[parseInt(from_floorId, 10)];

  if (routeEnabled) ClearRoute();
  draw_path_to_poi(
    from_name,
    from_lg,
    from_lt,
    from_lvl,
    to_name,
    to_lg,
    to_lt,
    to_lvl
  );
}

/**
 * Add one POI option into both dropdowns.
 */
export function Load_dropdown_pois(poi) {
  let level = state.level_array[poi.building_floor_id];
  const levelName = floors_titles[level];
  let category_ar =
    state.buildings_object.buildings[0].name + " - ";
  if (poi.category_id != null) {
    category_ar = state.category_array[poi.category_id] + " - ";
  }
  const icon = poi.icon && poi.icon.url
    ? poi.icon.url
    : "./icontap.png";

  $("#from_location").append(
    $(
      `<option data-foo="${category_ar} ${levelName}" data-icon="${icon}">
         ${poi.title}
       </option>`
    ).attr(
      "value",
      `${poi.longitude},${poi.latitude},${poi.building_floor_id}`
    )
  );

  $("#to_location").append(
    $(
      `<option data-foo="${category_ar} ${levelName}" data-icon="${icon}">
         ${poi.title}
       </option>`
    ).attr(
      "value",
      `${poi.longitude},${poi.latitude},${poi.building_floor_id}`
    )
  );
}