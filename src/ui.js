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
  initAccessabilty();
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
  // Fade out loader wrapper and splash screen
  $(".loader-wrapper").fadeOut(500);
  $("#splash-screen")
    .fadeOut(500, function () {
      $(this).addClass("hidden");
    });
}


function initAccessabilty()
{
   document.getElementById("closeBtn").addEventListener("click", closeMenu);
   document.getElementById("accessibilityBtn").addEventListener("click", toggleMenu);
   window.toggleCard = toggleCard;
}

 function closeMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.remove("open");
	menu.style.display = "none";
}

/**
 * Toggle the accessabilty card open or closed.
 */
 function toggleMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.toggle("open");
}

/**
 * Toggle a accessability card's active state and apply its related functionality.
 * @param {HTMLElement} element - The card element clicked.
 * @param {string} toolName - The name of the tool to toggle.
 */
export function toggleCard(element, toolName) {
	const isActive = element.classList.toggle("active");

	if (isActive) {
		state.activeTools.add(toolName);
		
	} else {
		state.activeTools.delete(toolName);
	}

	// // Apply or revert tool behavior
	if (toolName == "simpleFont") simpleFont_toggle();
	else if (toolName == "biggerText") toggleTextSize();
	else if (toolName == "desaturation") DesaturationToggle();
	else if (toolName == "contrast") toggleColorScheme();
	else if (toolName == "letterSpacing") toggleLetterSpacing();
	else if (toolName == "lineSpacing") toggleLineSpacing();
	else if (toolName == "readSpeaker") toggleSpeech();
	else if (toolName == "cursor") toggleMapboxAccessibility();
	else if (toolName == "pauseAnimation") pauseAnimationToggle();
}

function toggleColorScheme() {
	state.isBlackWhite = !isBlackWhite;
	updateFilter();
}

function DesaturationToggle() {
	state.isInverted = !isInverted;
	updateFilter();
}

function resetFilters() {
	state.isBlackWhite = false;
	state.isInverted = false;
	updateFilter();
}

function updateFilter() {
	let filter = '';

	if (state.isBlackWhite) {
		filter += 'saturate(0%) ';
	} else {
		filter += 'saturate(100%) ';
	}

	if (state.isInverted) {
		filter += 'invert(1) hue-rotate(180deg)';
	}

	document.documentElement.style.filter = filter.trim();
}


