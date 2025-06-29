/**
 * @module ui
 * @description Initializes UI components and handles user interactions.
 */
// Note: jQuery and Select2 are loaded globally via index.html
import { FLOOR_TITLES, state } from "./config.js";
import { drawPathToPoi } from "./data/routes.js";
import { clearRoute, routeEnabled } from "./mapController.js";
import { stringMatch } from "./utils.js";

/**
 * Initialize UI: dropdowns and swap button.
 */
export function initUI() {
  initDropdown("#from_location");
  initDropdown("#to_location");
  bindSwapButton(".swap-btn");
}

/**
 * Sets up a Select2 dropdown with custom matcher and template.
 * @param {string} selector - CSS selector for the dropdown.
 */
function initDropdown(selector) {
  const $elem = $(selector);
  $elem.select2({ matcher, templateResult: formatOption });
  $elem.on("select2:select", () => {
    const fromVal = $("#from_location").val();
    const toVal = $("#to_location").val();
    if (fromVal && toVal) handleSelection();
  });
}

/**
 * Binds click on swap button to exchange dropdown values.
 * @param {string} selector - CSS selector for the swap button.
 */
function bindSwapButton(selector) {
  $(selector).on("click", () => {
    const $from = $("#from_location");
    const $to = $("#to_location");
    const fromVal = $from.val();
    const toVal = $to.val();
    $from.val(toVal).trigger("change");
    $to.val(fromVal).trigger("change");
    // Retrigger selection handlers
    [$from, $to].forEach(($el) =>
      $el.trigger({
        type: "select2:select",
        params: { data: $el.select2("data")[0] },
      })
    );
  });
}

/**
 * Custom matcher for Select2 options.
 * @param {Object} params - Search parameters.
 * @param {Object} data - Option data.
 * @returns {Object|null}
 */
function matcher(params, data) {
  if (!params.term || !data.text) return data;
  const term = params.term.trim();
  if (!term) return data;
  const subtitle = $(data.element).attr("data-foo");
  return stringMatch(term, data.text) || stringMatch(term, subtitle)
    ? data
    : null;
}

/**
 * Template formatter for Select2 options with icon and subtitle.
 * @param {Object} state - Option state.
 * @returns {jQuery|String}
 */
function formatOption(state) {
  if (!state.id) return state.text;
  const $el = $(state.element);
  const iconUrl = $el.attr("data-icon");
  const subtitle = $el.attr("data-foo");
  return $(
    `<div style="display:flex;align-items:center;">
       <img src="${iconUrl}" style="width:35px;height:35px;margin-right:15px;"/>
       <div>
         <div>${state.text}</div>
         <div style="font-size:0.8em;color:gray;">${subtitle}</div>
       </div>
     </div>`
  );
}

/**
 * Handles selection of both dropdowns to draw a route.
 */
function handleSelection() {
  if (routeEnabled) clearRoute();
  const from = parseSelection("#from_location");
  const to = parseSelection("#to_location");
  drawPathToPoi(
    from.name,
    from.lng,
    from.lat,
    from.level,
    to.name,
    to.lng,
    to.lat,
    to.level
  );
}

/**
 * Parses a dropdown value into its components.
 * @param {string} selector - CSS selector for the dropdown.
 * @returns {Object} Parsed { name, lng, lat, level }.
 */
function parseSelection(selector) {
  const sel = document.querySelector(selector);
  const [lng, lat, floorId] = sel.value.split(",");
  const name = sel.options[sel.selectedIndex].text;
  const level = state.levelArray[parseInt(floorId, 10)];
  return { name, lng, lat, level };
}

/**
 * Add a POI option into both dropdowns.
 * @param {Object} poi - POI data.
 */
export function loadDropdownPoi(poi) {
  const level = state.levelArray[poi.building_floor_id];
  const levelName = FLOOR_TITLES[level];
  const category =
    poi.category_id != null
      ? `${state.categoryArray[poi.category_id]} - `
      : `${state.buildingsObject.buildings[0].name} - `;
  const iconUrl = poi.icon?.url || "./icontap.png";
  const optionHtml = `<option data-foo="${category}${levelName}" data-icon="${iconUrl}" value="${[
    poi.longitude,
    poi.latitude,
    poi.building_floor_id,
  ].join(",")}">${poi.title}</option>`;
  ["#from_location", "#to_location"].forEach((selector) =>
    $(selector).append($(optionHtml))
  );
}

/**
 * Hides the splash screen after 3 seconds.
 */
/**
 * Hides the splash screen and loader after a 3-second delay.
 * Uses jQuery's delay and fadeOut for smooth transitions.
 */
export function screensaver() {
  // Fade out loader wrapper after 3 seconds
  $(".loader-wrapper").delay(3000).fadeOut(500);

  // Fade out splash screen and add 'hidden' class after fade completes
  $("#splash-screen")
    .delay(3000)
    .fadeOut(500, function () {
      $(this).addClass("hidden");
    });
}
