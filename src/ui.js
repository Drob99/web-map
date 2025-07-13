/**
 * @module ui
 * @description Initializes UI components and handles user interactions.
 */
// Note: jQuery and Select2 are loaded globally via index.html
import { FLOOR_TITLES, state } from "./config.js";
import { drawPathToPoi } from "./data/routes.js";
import { clearRoute, routeEnabled } from "./mapController.js";
import { stringMatch } from "./utils.js";
import { map } from "./mapInit.js";
import { languageService } from "./i18n/languageService.js";
import { uiTranslator } from "./i18n/uiTranslator.js";
import { mapTranslator } from "./i18n/mapTranslator.js";

/**
 * Initialize UI: dropdowns and swap button.
 */
export function initUI() {
  initDropdown("#from_location");
  initDropdown("#to_location");
  bindSwapButton(".swap-btn");
  //initAccessabilty();
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
  const levelName = languageService.translate(
    "floors",
    level.toString(),
    `Floor ${level}`
  );

  const categoryName =
    poi.category_id != null
      ? languageService.translate(
          "categories",
          state.categoryArray[poi.category_id],
          state.categoryArray[poi.category_id]
        )
      : state.buildingsObject.buildings[0].name;

  const iconUrl = poi.icon?.url || "./icontap.png";

  // Translate POI title if it's a known category
  const translatedTitle = languageService.translate(
    "categories",
    poi.title,
    poi.title
  );

  const optionHtml = `<option 
    data-foo="${categoryName} - ${levelName}" 
    data-icon="${iconUrl}" 
    value="${[poi.longitude, poi.latitude, poi.building_floor_id].join(",")}"
  >${translatedTitle}</option>`;

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
  initAccessabilty()
  // Fade out loader wrapper and splash screen
  $(".loader-wrapper").fadeOut(500);
  $("#splash-screen")
    .fadeOut(500, function () {
      $(this).addClass("hidden");
    });
}



// Language Selection 

// Language mapping
const languageMap = {
  'English': 'EN',
  'عربي': 'AR',
  '中国人': 'ZN'
};

// Update language list initialization
const languageListEl = document.getElementById('languageList');
if (languageListEl) {
  languageListEl.innerHTML = ''; // Clear existing
  
  Object.entries(languageMap).forEach(([displayName, code]) => {
    const li = document.createElement('li');
    li.classList.add('language-item');
    li.setAttribute('data-lang', code);
    
    if (languageService.getCurrentLanguage() === code) {
      li.classList.add('active');
      li.innerHTML = `${displayName} <i class="bi bi-check-lg"></i>`;
    } else {
      li.textContent = displayName;
    }
    
    li.addEventListener('click', () => selectLanguage(li, code));
    languageListEl.appendChild(li);
  });
}


/**
 * Handle language selection with proper translation updates
 * @param {HTMLElement} selectedEl - Selected list item
 * @param {string} langCode - Language code
 */
function selectLanguage(selectedEl, langCode) {
  // Store current floor level to maintain context
  const currentFloor = state.levelRoutePoi || state.currentLevel || 1;

  // Update visual selection in UI
  document.querySelectorAll(".language-item").forEach((item) => {
    item.classList.remove("active");
    const icon = item.querySelector("i");
    if (icon) icon.remove();
  });

  selectedEl.classList.add("active");
  selectedEl.innerHTML += ' <i class="bi bi-check-lg"></i>';

  // Visual feedback animation
  selectedEl.style.transform = "scale(1.05)";
  setTimeout(() => {
    selectedEl.style.transform = "scale(1)";
  }, 150);

  if (languageService.setLanguage(langCode)) {
    console.log(`Language changed to: ${langCode}`);
    
    // 1. Restore floor level context
    state.levelRoutePoi = currentFloor;

    // 2. Update UI translations first
    uiTranslator.updateUITranslations();

    // 3. Update POI data and map layers
    updatePOITranslations();

    // 4. Update other map layers if needed
    updateMapLayers(langCode);
    loadLanguage(langCode)

    // 5. Hide language panel after successful change
    setTimeout(() => {
      languageMenu();
    }, 300);
  }
}

/**
 * Loads and applies translations for the selected language.
 * Supports both text content and HTML attributes (e.g., placeholder, title).
 *
 * @param {string} lang - The language code (e.g., 'en', 'ar', 'zh').
 */
function loadLanguage(lang) {
  // Normalize the language code to lowercase (e.g., 'EN' -> 'en')
  const langCode = lang.toLowerCase();

  // Fetch the translation JSON file corresponding to the selected language
  fetch(`src/i18n/locales/${langCode}.json`)
    .then(res => res.json()) // Parse the JSON response
    .then(translations => {
      // Loop through all elements with a 'data-i18n' attribute
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");         // Translation key
        const attr = el.getAttribute("data-i18n-attr");   // Optional target attribute (e.g., placeholder, title)

        if (translations[key]) {
          if (attr) {
            // If a specific attribute is defined, set the translated value as that attribute
            el.setAttribute(attr, translations[key]);
          } else {
            // Otherwise, replace the element's text content with the translated string
            el.textContent = translations[key];
          }
        }
      });

      // Update the page's text direction: RTL for Arabic, LTR for others
      document.documentElement.dir = (langCode === "ar") ? "rtl" : "ltr";

      // Update the lang attribute on the <html> element for accessibility and SEO
      document.documentElement.lang = langCode;
    })
    .catch(err => {
      // Handle any errors that occur while loading or parsing the translation file
      console.error(`Error loading ${langCode}.json:`, err);
    });
}


/**
 * Complete POI translation update workflow
 */
function updatePOITranslations() {
  try {
    // Step 1: Re-render POIs with new language (this updates the source data)
    if (typeof showPoisByLevel === 'function') {
      showPoisByLevel();
    }

    // Step 2: Force refresh map translator (this updates the text-field expressions) 
    mapTranslator.refreshAllPOITranslations();

    // Step 3: Ensure map source is properly updated with a small delay
    setTimeout(() => {
      if (map && map.getSource("municipalities")) {
        // Trigger a source refresh
        const source = map.getSource("municipalities");
        if (source && typeof source.setData === 'function') {
          // Force re-evaluation of the source
          const currentData = source.serialize().data;
          if (currentData) {
            source.setData(currentData);
          }
        }
      }
    }, 50);

    console.log("POI translations updated successfully");
  } catch (error) {
    console.error("Error updating POI translations:", error);
  }
}

/**
 * Update map layer text fields
 * @param {string} langCode - Language code
 */
function updateMapLayers(langCode) {
  if (!map) return;
  
  console.log(`Updating map layers for language: ${langCode}`);
  
  // Let the mapTranslator handle the text field updates
  // as it has better logic for language-specific expressions
  mapTranslator.updatePOILabels();
  
  // Additional layer updates can be added here if needed
  // For example, updating other text layers not handled by mapTranslator
}

export function openLanguageFromMenu() {
    document.querySelector('.language-panel').style.display = 'block';
    document.getElementById('menuContainer').style.display = 'none';
    document.getElementById('nearbyContainer').style.display = 'none';
}

export function languageMenu() {
    const languagePanel = document.querySelector(".language-panel");
    const menuContainer = document.getElementById("menuContainer");

    if (languagePanel.classList.contains("show")) {
        // Hide language panel
        languagePanel.classList.remove("show");
        languagePanel.classList.add("hide");
        languagePanel.style.display = "none";

        // Show main menu
        menuContainer.classList.remove("hide");
        menuContainer.classList.add("show");
        menuContainer.style.display = "block";
    } else {
        // Show language panel
        languagePanel.classList.remove("hide");
        languagePanel.classList.add("show");
        languagePanel.style.display = "block";

        // Hide main menu
        menuContainer.classList.remove("show");
        menuContainer.classList.add("hide");
        menuContainer.style.display = "none";
    }
}


function toggleNearbyMenu() {
    const nearbyContainer = document.getElementById("nearbyContainer");
    const menuContainer = document.getElementById("menuContainer");

    const isNearbyVisible = nearbyContainer.style.display === 'block';

    if (isNearbyVisible) {
        // Hide Nearby, Show Main Menu
        nearbyContainer.style.display = 'none';
        menuContainer.style.display = 'block';
    } else {
        // Show Nearby, Hide Main Menu
        nearbyContainer.style.display = 'block';
        menuContainer.style.display = 'none';
    }
}

var nearbyRestaurantList;
document.addEventListener("DOMContentLoaded", function() {
    const languageButton = document.getElementById("languageToggleButton");
    const nearbyButton = document.getElementById("nearbyToggleButton");
    const languageBackButton = document.getElementById("languageBack");
    const nearbyBackButton = document.getElementById("nearbyBack");
    const nearbySearchInput = document.getElementById("nearbySearchInput");
    nearbyRestaurantList = document.getElementById("nearbyRestaurantList");

    if (languageButton) {
        languageButton.addEventListener("click", languageMenu);
    }

    if (nearbyButton) {
        nearbyButton.addEventListener("click", toggleNearbyMenu);
    }

    if (languageBackButton) {
        languageBackButton.addEventListener("click", languageMenu);
    }

    if (nearbyBackButton) {
        nearbyBackButton.addEventListener("click", toggleNearbyMenu);
    }

    if(nearbySearchInput)
    {
      nearbySearchInput.addEventListener("input", function (e) {
          const query = e.target.value.trim();
          searchNearBy(query);
      });
    }
});

// Menu navigation is now handled by the menu-navigation module
// This code has been moved to menu-navigation.js for better organization
function searchNearBy(query) {
  const listContainer = document.getElementById("nearbyRestaurantList");
  listContainer.innerHTML = ""; // Clear previous results

  const filteredLocations = [];

  state.allPoiGeojson.features.forEach((feature) => {
    feature.properties = mapTranslator.translatePOIProperties(feature);

    const title = getPOITitleByLang(feature.properties, state.language);
    if (title.toLowerCase().includes(query.toLowerCase())) {
      filteredLocations.push(feature);
    }
  });

  if (filteredLocations.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center;color:#aaa;padding:28px 0 10px 0;">No results found</div>`;
    return;
  }

  const self = this; // Capture 'this' context

  filteredLocations.forEach((feature) => {
    const title = getPOITitleByLang(feature.properties, state.language);
    const poiTerminalLocation = state.terminalTranslations[state.language][feature.properties.location] || "Undefined";
    const poiLevel = state.floorsNames[state.language][feature.properties.level] || "Unknown Floor";

    const locationItem = document.createElement("div");
    locationItem.className = "location-item";
    locationItem.style.cursor = "pointer";

    const locationIcon = document.createElement("div");
    locationIcon.className = "location-icon";
    locationIcon.innerHTML = `<img style="width: 40px; border-radius: 5px;" src="${feature.properties.iconUrl || './src/images/missingpoi.png'}" alt="${title}">`;

    const locationDetails = document.createElement("div");
    locationDetails.className = "location-details";
    locationDetails.innerHTML = `
      <div class="location-name">${title}</div>
      <div class="location-address">${poiTerminalLocation} - ${poiLevel}</div>
    `;

    result

    locationItem.appendChild(locationIcon);
    locationItem.appendChild(locationDetails);
    listContainer.appendChild(locationItem);

    // 🔘 Add Click Action: Call your method
    locationItem.addEventListener("click", () => {
      state.airportMenu.showLocationDetailsView(feature); // Your method call
    });
  });
}


function initAccessabilty() {
   document.getElementById("closeBtn").addEventListener("click", closeMenu);
   document.getElementById("accessibilityBtn").addEventListener("click", toggleMenu);
   window.toggleCard = toggleCard;
   window.resetSettings = resetSettings;
}

/**
 * Close the side accessibility menu by removing the 'open' class.
 */
function closeMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.remove("open");
}

/**
 * Toggle the visibility of the side accessibility menu.
 */
function toggleMenu() {
  console.log("Toggle Accessability !!!");
	const menu = document.getElementById("sideMenu");
	menu.classList.toggle("open");
}

/**
 * Toggle a specific accessibility tool and apply its effect.
 * @param {HTMLElement} element - The clicked card element.
 * @param {string} toolName - The name of the tool to enable/disable.
 */
export function toggleCard(element, toolName) {
	const isActive = element.classList.toggle("active");

	if (isActive) {
		state.activeTools.add(toolName);
	} else {
		state.activeTools.delete(toolName);
	}

	// Activate/deactivate the corresponding tool
	if (toolName == "simpleFont") simpleFont_toggle();
	else if (toolName == "biggerText") toggleTextSize();
	else if (toolName == "desaturation") desaturationToggle();
	else if (toolName == "contrast") toggleColorScheme();
	else if (toolName == "letterSpacing") toggleLetterSpacing();
	else if (toolName == "lineSpacing") toggleLineSpacing();
	else if (toolName == "readSpeaker") toggleSpeech();
	else if (toolName == "cursor") toggleMapboxAccessibility();
	else if (toolName == "pauseAnimation") pauseAnimationToggle();
}

/**
 * Toggle between normal and high-contrast (black-and-white) mode.
 */
function toggleColorScheme() {
	state.isBlackWhite = !state.isBlackWhite;
	updateFilter();
}

/**
 * Toggle desaturation (grayscale) mode.
 */
function desaturationToggle() {
	state.isInverted = !state.isInverted;
	updateFilter();
}

/**
 * Reset both black-white and grayscale filters to default.
 */
function resetFilters() {
	state.isBlackWhite = false;
	state.isInverted = false;
	updateFilter();
}

/**
 * Apply current filter state to the document's root element.
 */
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

/**
 * Toggle letter spacing in the map's text layer.
 */
function toggleLetterSpacing() {
	state.spacing = state.isLetterSpaced ? 0 : 0.3;
	map.setLayoutProperty('municipality-name', 'text-letter-spacing', state.spacing);
	state.isLetterSpaced = !state.isLetterSpaced;
}

/**
 * Reset letter spacing to default.
 */
function resetLetterSpacing() {
	map.setLayoutProperty('municipality-name', 'text-letter-spacing', 0);
	state.isLetterSpaced = false;
}

/**
 * Toggle line spacing in the map's text layer.
 */
function toggleLineSpacing() {
	state.lineHeight = state.isLineSpaced ? 1.2 : 2.0;
	map.setLayoutProperty('municipality-name', 'text-line-height', state.lineHeight);
	state.isLineSpaced = !state.isLineSpaced;
}

/**
 * Reset line spacing to default.
 */
function resetLineSpacing() {
	map.setLayoutProperty('municipality-name', 'text-line-height', 1.2);
	state.isLineSpaced = false;
}

/**
 * Toggle text size between normal and large.
 */
function toggleTextSize() {
	state.size = state.isBigText ? 14 : 20;
	map.setLayoutProperty('municipality-name', 'text-size', state.size);
	state.isBigText = !state.isBigText;
}

/**
 * Reset text size to default.
 */
function resetTextStyle() {
	map.setLayoutProperty('municipality-name', 'text-size', 14);
	state.isBigText = false;
}

/**
 * Toggle between default font and simplified font (e.g. Arial).
 */
function simpleFont_toggle() {
	state.font = state.isSimpleFont
		? ['Arial Unicode MS Regular']
		: ['Arial Unicode MS Regular']; // Same font in this case; change if needed
	map.setLayoutProperty('municipality-name', 'text-font', state.font);
	state.isSimpleFont = !state.isSimpleFont;
}

/**
 * Reset font to default.
 */
function resetFont() {
	map.setLayoutProperty('municipality-name', 'text-font', ['Arial Unicode MS Regular']);
	state.isSimpleFont = false;
}

/**
 * Toggle speech reader functionality.
 */
function toggleSpeech() {
	state.isSpeechEnabled = !state.isSpeechEnabled;
}

/**
 * Disable speech reader functionality.
 */
function SpeechReset() {
	state.isSpeechEnabled = false;
}

/**
 * Toggle pause/resume of animations (e.g., route animations).
 * Function is currently commented and may require implementation.
 */
function pauseAnimationToggle() {
	// Placeholder: Add logic to pause/resume animation if needed
}

/**
 * Reset animation state to default.
 */
function resetAnimation() {
	// Placeholder: Add logic to reset animation if needed
}

/**
 * Toggle map-specific accessibility features like a custom cursor.
 */
function toggleMapboxAccessibility() {
	// Placeholder: Add logic to toggle custom cursor or other features
}

/**
 * Reset map-specific accessibility features to default.
 */
function resetMapboxAccessibility() {
	// Placeholder: Add logic to reset map accessibility state
}

/**
 * Reset all accessibility tools and settings to default values.
 */
function resetSettings() {
	resetFont();
	resetTextStyle();
	resetFilters();
	resetLetterSpacing();
	resetLineSpacing();
	SpeechReset();
	resetMapboxAccessibility();
	resetAnimation();

	document.querySelectorAll(".tool-card.active").forEach(card => {
		card.classList.remove("active", "green");
	});
	state.activeTools.clear();

}
 
// Share Button And QR Code :
// Get references to the elements
 const shareIcon = document.getElementById('shareIcon');
    const shareDropdownMenu = document.getElementById('shareDropdownMenu');
    const qrModal = document.getElementById('qrModal');
    const closeModalBtn = document.getElementById('closeModal');
    const notification = document.getElementById('notification');
    const currentUrl = window.location.href;

    // Toggle dropdown menu
    shareIcon.addEventListener('click', function (e) {
      e.stopPropagation();
      shareDropdownMenu.classList.toggle('open');
    });

    // Close dropdown and modal when clicking outside
    document.addEventListener('click', function (event) {
      if (!shareIcon.contains(event.target) && !shareDropdownMenu.contains(event.target)) {
        shareDropdownMenu.classList.remove('open');
      }
      if (event.target === qrModal) {
        qrModal.classList.remove('active');
      }
    });

    // Close modal button
    closeModalBtn.addEventListener('click', function () {
      qrModal.classList.remove('active');
    });

    // Copy link to clipboard
    document.getElementById('shareCopyLink').addEventListener('click', function () {

        const url = "https://maps.kkia.sa/share/map.html?dest=";
        let rawCenter = state.airportMenu?.currentLocation?.properties?.center;
        let destCenter = [0, 0];
        var linkWithParameters = "";

        // Try to convert string → array if needed
        if (typeof rawCenter === 'string') {
          try {
            rawCenter = JSON.parse(rawCenter);
          } catch (e) {
            console.warn('❌ Failed to parse rawCenter string:', rawCenter);
            rawCenter = null;
          }
        }

        if (Array.isArray(rawCenter) && rawCenter.length === 2) {
          const lng = parseFloat(rawCenter[0]);
          const lat = parseFloat(rawCenter[1]);

          if (!isNaN(lng) && !isNaN(lat)) {
            destCenter = [lng, lat];
          } else {
            console.warn('❌ Invalid numeric values:', rawCenter);
          }
        } else {
          console.warn('❌ Invalid rawCenter structure:', rawCenter);
        }

        console.log('✅ Final destCenter:', destCenter);

        const destLevel = state.airportMenu.currentLocation.properties.level;
        const destTitle = state.airportMenu.currentLocation.properties.title;
        const destArabic = state.airportMenu.currentLocation.properties.title_ar;
        const destChinese = state.airportMenu.currentLocation.properties.title_zn;
        const destTerminal = state.airportMenu.currentLocation.properties.location;
        const original_code = OpenLocationCode.encode(destCenter[0], destCenter[1], 11);

          if (state.airportMenu.language == "AR") {
            linkWithParameters =
              url +
              original_code +
              "&fl=" +
              destLevel +
              "&name=" +
              encodeForURL(destArabic) +
              "&terminal=" + 
              destTerminal +
              "&floor=" +
              destLevel
              +
              "&location="
              +
              "Null";

          }
          else if (state.airportMenu.language == "ZN") {
            linkWithParameters =
              url +
              original_code +
              "&fl=" +
              destLevel +
              "&name=" +
              encodeForURL(destChinese) +
              "&terminal=" + 
              destTerminal +
              "&floor=" +
              destLevel
              +
              "&location="
              +
              "Null";
          }
          else {
            linkWithParameters =
              url +
              original_code +
              "&fl=" +
              destLevel +
              "&name=" +
              destTitle;
              "&terminal=" + 
              destTerminal +
              "&floor=" +
              destLevel +
              "&location="+
              "Null";
          }

      navigator.clipboard.writeText(linkWithParameters)
        .then(() => {
          notification.classList.add('show');
          
          setTimeout(() => {
            notification.classList.remove('show');
          }, 2000);
          shareDropdownMenu.classList.remove('open');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    });

    // Show QR Code
    document.getElementById('shareShowQR').addEventListener('click', function () {

      document.getElementById('qrcode').innerHTML = '';
      console.log(state.airportMenu.currentLocation.properties.center);
      const url = "https://maps.kkia.sa/share/map.html?dest=";
      //const rawCenter = state.airportMenu.currentLocation.properties.center || [0, 0];
      // const destCenter = [parseFloat(rawCenter[0]), parseFloat(rawCenter[1])];

      //let destCenter = [0, 0]; // default fallback

      let rawCenter = state.airportMenu?.currentLocation?.properties?.center;
      let destCenter = [0, 0];

      // Try to convert string → array if needed
      if (typeof rawCenter === 'string') {
        try {
          rawCenter = JSON.parse(rawCenter);
        } catch (e) {
          console.warn('❌ Failed to parse rawCenter string:', rawCenter);
          rawCenter = null;
        }
      }

      if (Array.isArray(rawCenter) && rawCenter.length === 2) {
        const lng = parseFloat(rawCenter[0]);
        const lat = parseFloat(rawCenter[1]);

        if (!isNaN(lng) && !isNaN(lat)) {
          destCenter = [lng, lat];
        } else {
          console.warn('❌ Invalid numeric values:', rawCenter);
        }
      } else {
        console.warn('❌ Invalid rawCenter structure:', rawCenter);
      }

      console.log('✅ Final destCenter:', destCenter);

      const destLevel = state.airportMenu.currentLocation.properties.level;
      const destTitle = state.airportMenu.currentLocation.properties.title;
      const destArabic = state.airportMenu.currentLocation.properties.title_ar;
      const destChinese = state.airportMenu.currentLocation.properties.title_zn;
      const destTerminal = state.airportMenu.currentLocation.properties.location;
      const original_code = OpenLocationCode.encode(destCenter[0], destCenter[1], 11);

      if (state.airportMenu.language == "AR") {
        var qrCodeText =
          url +
          original_code +
          "&fl=" +
          destLevel +
          "&name=" +
          encodeForURL(destArabic) +
          "&terminal=" + 
          destTerminal +
          "&floor=" +
          destLevel
          +
          "&location="
          +
          "Null";
     
          new QRCode(document.getElementById('qrcode'), {
            text: createArabicURL(qrCodeText, destArabic) + "&lang=AR",
            width: 200,
            height: 200,
            colorDark: "rgb(96, 96, 96)",
            colorLight: "#F8F9FB",
            correctLevel: QRCode.CorrectLevel.H,
            version: 10,
          });
      }
      else if (state.airportMenu.language == "ZN") {
        var qrCodeText =
          url +
          original_code +
          "&fl=" +
          destLevel +
          "&name=" +
          encodeForURL(destChinese) +
          "&terminal=" + 
          destTerminal +
          "&floor=" +
          destLevel
          +
          "&location="
          +
          "Null";
     
          new QRCode(document.getElementById('qrcode'), {
            text: createArabicURL(qrCodeText, destChinese) + "&lang=ZN",
            width: 200,
            height: 200,
            colorDark: "rgb(96, 96, 96)",
            colorLight: "#F8F9FB",
            correctLevel: QRCode.CorrectLevel.H,
            version: 10,
          });
      }
      else {
        var qrCodeText =
          url +
          original_code +
          "&fl=" +
          destLevel +
          "&name=" +
          destTitle;
          "&terminal=" + 
          destTerminal +
          "&floor=" +
          destLevel +
          "&location="+
          "Null";
     
          new QRCode(document.getElementById('qrcode'), {
            text: createArabicURL(qrCodeText, destTitle) ,
            width: 200,
            height: 200,
            colorDark: "rgb(96, 96, 96)",
            colorLight: "#F8F9FB",
            correctLevel: QRCode.CorrectLevel.H,
            version: 10,
          });
      }
      console.log(qrCodeText);
      qrModal.classList.add('active');
      shareDropdownMenu.classList.remove('open');
    });


function encodeForURL(text) {
	return encodeURIComponent(text);
}

// Function to handle Arabic text in URLs
function createArabicURL(baseUrl, arabicText) {
	// Method 1: Using encodeURIComponent
	const encodedText = encodeURIComponent(arabicText);
	return `${baseUrl}&name=${encodedText}`;
}


function getAllUrlParams(url) {
	// get query string from url (optional) or window
	var queryString = url ? url.split("?")[1] : window.location.search.slice(1);

	// we'll store the parameters here
	var obj = {};

	// if query string exists
	if (queryString) {
		// stuff after # is not part of query string, so get rid of it
		queryString = queryString.split("#")[0];

		// split our query string into its component parts
		var arr = queryString.split("&");

		for (var i = 0; i < arr.length; i++) {
			// separate the keys and the values
			var a = arr[i].split("=");

			// set parameter name and value (use 'true' if empty)
			var paramName = a[0];
			var paramValue = typeof a[1] === "undefined" ? true : a[1];

			// (optional) keep case consistent
			paramName = paramName.toLowerCase();
			if (typeof paramValue === "string")
				paramValue = paramValue.toLowerCase();

			// if the paramName ends with square brackets, e.g. colors[] or colors[2]
			if (paramName.match(/\[(\d+)?\]$/)) {
				// create key if it doesn't exist
				var key = paramName.replace(/\[(\d+)?\]/, "");
				if (!obj[key]) obj[key] = [];

				// if it's an indexed array e.g. colors[2]
				if (paramName.match(/\[\d+\]$/)) {
					// get the index value and add the entry at the appropriate position
					var index = /\[(\d+)\]/.exec(paramName)[1];
					obj[key][index] = paramValue;
				} else {
					// otherwise add the value to the end of the array
					obj[key].push(paramValue);
				}
			} else {
				// we're dealing with a string
				if (!obj[paramName]) {
					// if it doesn't exist, create property
					obj[paramName] = paramValue;
				} else if (
					obj[paramName] &&
					typeof obj[paramName] === "string"
				) {
					// if property does exist and it's a string, convert it to an array
					obj[paramName] = [obj[paramName]];
					obj[paramName].push(paramValue);
				} else {
					// otherwise add the property
					obj[paramName].push(paramValue);
				}
			}
		}
	}

	return obj;
}

var flag_open_link_with_paramaters = false;
var flag_open_link_with_paramaters_lang = false;

var open_link_name = "";
function check_link_parameters() {
	if (getAllUrlParams().lang != undefined) {
		var lang = getAllUrlParams().lang.toUpperCase();
		if (language != lang) {
			changelang(lang);
		}
	}
	
	if (getAllUrlParams().location != undefined) {
		flyToTerminalFromUrl(window.location);
	}
	if (getAllUrlParams().dest != undefined) {
		var destination_coordinates = getAllUrlParams().dest;
		//console.log(destination_coordinates);
		var area = OpenLocationCode.decode(destination_coordinates);
		//console.log(area);

		var original_code = OpenLocationCode.encode(
			area.latitudeCenter,
			area.longitudeCenter,
			area.codeLength
		);

		var decoded = OpenLocationCode.decode(original_code);

		var name = getAllUrlParams().name.replace(/%20/g, " ");
		open_link_name = name;
		
		if(firstGpsMove){
			flag_open_link_with_paramaters = true;
		}
		flag_open_link_with_paramaters_lang = true;
		setTimeout(() => {
			//searchInputNearby.value = name;
			document.getElementById("poi-menu").style.display = "block";
			show_pois_menu(name);
			map.flyTo({
				center: [decoded.longitudeCenter, decoded.latitudeCenter],
				zoom: 19.489296826958224,
				duration: 3000,
			});
			switchtofloor(getAllUrlParams().fl)
			//console.log("Flooooor : "+getAllUrlParams().fl);
		}, 3000);

		// setTimeout(() => {
		// 	draw_path_to_poi(
		// 		name,
		// 		decoded.longitudeCenter,
		// 		decoded.latitudeCenter,
		// 		getAllUrlParams().fl,
		// 		"",
		// 		""
		// 	);
		// }, 10000);
	}
}
