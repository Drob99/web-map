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
  initAccessabilty();
}


function initAccessabilty() {
  //  document.getElementById("closeBtn").addEventListener("click", closeMenu);
  //  document.getElementById("accessibilityBtn").addEventListener("click", toggleMenu);
  //  window.toggleCard = toggleCard;
  //  window.resetSettings = resetSettings;
}

function closeMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.remove("open");
	menu.style.display = "none";
}

function toggleMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.toggle("open");
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

    // 5. Hide language panel after successful change
    setTimeout(() => {
      languageMenu();
    }, 300);
  }
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


document.addEventListener("DOMContentLoaded", function() {
    const languageButton = document.getElementById("languageToggleButton");
    const nearbyButton = document.getElementById("nearbyToggleButton");
    const languageBackButton = document.getElementById("languageBack");
    const nearbyBackButton = document.getElementById("nearbyBack");

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
});

 // Nearby Menu
 const nearbyRestaurants = [
      {
        name: "Somewhere Bujairi",
        rating: "4.3",
        reviews: "(2,642)",
        price: "SAR 200+",
        type: "Restaurant",
        icon: "fa-utensils",
        status: "Open",
        hours: "Closes 12 AM",
        tags: "Dine-in · Takeaway · No delivery",
        image: "./src/images/missingpoi.png"
      },
      {
        name: "Brunch & Cake Al Bujairi",
        rating: "4.4",
        reviews: "(2,880)",
        price: "-",
        type: "Brunch",
        icon: "fa-coffee",
        status: "Open",
        hours: "Closes 11:45 PM",
        tags: "Dine-in · Takeaway · No-contact delivery",
        image: "./src/images/missingpoi.png"
      },
      {
        name: "Bujairi Terrace",
        rating: "4.6",
        reviews: "(11,789)",
        price: "-",
        type: "Tourist attraction",
        icon: "fa-map-marker-alt",
        status: "Open",
        hours: "Closes 12 AM",
        tags: "Dine-in · Takeaway",
        image: "./src/images/missingpoi.png"
      },
      {
        name: "Dim Light Restaurant",
        rating: "3.7",
        reviews: "(3,981)",
        price: "$$",
        type: "Restaurant",
        icon: "fa-utensils",
        status: "Open 24 hours",
        hours: "24/7",
        tags: "Dine-in · Takeaway · No-contact delivery",
        image: "./src/images/missingpoi.png"
      },
      {
        name: "Sum+Things",
        rating: "3.9",
        reviews: "(2,072)",
        price: "$$$",
        type: "Restaurant",
        icon: "fa-utensils",
        status: "Closed",
        hours: "Opens 5 PM",
        tags: "Dine-in · Takeaway · No-contact delivery",
        image: "./src/images/missingpoi.png"
      },
      {
        name: "Cafe De L’ Esplanade",
        rating: "3.6",
        reviews: "(492)",
        price: "SAR 200+",
        type: "French",
        icon: "fa-wine-glass-alt",
        status: "Opens soon",
        hours: "10 AM",
        tags: "Dine-in · Takeaway",
        image: "./src/images/missingpoi.png"
      }
    ];

    const nearbyRestaurantList = document.getElementById("nearbyRestaurantList");

    nearbyRestaurants.forEach(nearbyRestaurant => {
      const nearbyCard = document.createElement("div");
      nearbyCard.className = "nearby-restaurant-card";

      const nearbyInfoDiv = document.createElement("div");
      nearbyInfoDiv.className = "nearby-restaurant-info";

      nearbyInfoDiv.innerHTML = `
        <div class="nearby-restaurant-name">${nearbyRestaurant.name}</div>
        <div class="nearby-rating">⭐ ${nearbyRestaurant.rating} ${nearbyRestaurant.reviews} · ${nearbyRestaurant.price}</div>
        <div class="nearby-restaurant-type"><i class="fas ${nearbyRestaurant.icon}"></i> ${nearbyRestaurant.type}</div>
        <div class="nearby-restaurant-status" style="color: ${nearbyRestaurant.status.includes('Open') ? 'green' : (nearbyRestaurant.status.includes('Closed') ? 'red' : '#fbbc05')}">${nearbyRestaurant.status}</div>
        <div class="nearby-restaurant-hours">${nearbyRestaurant.hours}</div>
        <div class="nearby-restaurant-tags">${nearbyRestaurant.tags}</div>
      `;

      const nearbyImg = document.createElement("img");
      nearbyImg.src = nearbyRestaurant.image;
      nearbyImg.className = "nearby-restaurant-image";

      nearbyCard.appendChild(nearbyInfoDiv);
      nearbyCard.appendChild(nearbyImg);

      nearbyRestaurantList.appendChild(nearbyCard);
    });

// Menu navigation is now handled by the menu-navigation module
// This code has been moved to menu-navigation.js for better organization