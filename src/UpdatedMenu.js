import * as cfg from './config.js';
import * as route from './data/routes.js';
import * as mapc from './mapController.js';
import * as navigation from './navigation.js';
import * as markers from './markers.js';
import * as mapInit from './mapInit.js';
import * as mapTranslator from './i18n/mapTranslator.js';

const state = {
    menuContainer: null,
    menuArrow: null,
    categoriesSection: null,
    subcategoriesView: null,
    locationsView: null,
    locationDetailsView: null,
    directionsView: null,
    navigationView: null,
    searchInput: null,
    searchSectionCategories: null,
    subcategoriesBackBtn: null,
    locationsBackBtn: null,
    locationDetailsBackBtn: null,
    directionsBackBtn: null,
    subcategoriesTitle: null,
    locationsTitle: null,
    subcategoriesList: null,
    locationsList: null,
    locationInfo: null,
    startNavigationBtn: null,
    nextStepBtn: null,
    endNavigationBtn: null,
    currentState: 'search-only',
    currentView: 'categories',
    isDesktop: false,
    isExpanded: false,
    currentCategory: null,
    currentSubcategory: null,
    currentLocation: null,
    currentStep: 0,
    totalSteps: 7,
    categoryItem: null,
    startY: 0,
    currentY: 0,
    isDragging: false,
    dragThreshold: 50,
    subcategoriesData: {},
    locationsData: {},
    navigationSteps: [],
    selectedDeparture: null,
    _stepsButtonClickHandler: null,
    _endRouteClickHandler: null,
    _backButtonClickHandler: null,
    _departureInputHandler: null,
    _popularLocationsBackBtnHandler: null,
    _menuArrowClickHandler: null,
    _searchInputFocusHandler: null,
    _searchInputInputHandler: null,
    _menuContainerTouchStartHandler: null,
    _menuContainerTouchMoveHandler: null,
    _menuContainerTouchEndHandler: null,
    _windowScrollHandler: null,
    _windowWheelHandler: null,
    _windowResizeHandler: null,
    _documentClickListener: null,
    _dropdownOptionClickHandler: null,
    _terminalDropdownListBtnHandler: null,
    _legendToggleHandler: null,
};

 function init() {
    state.menuContainer = document.getElementById('menuContainer');
    state.menuArrow = document.getElementById('menuArrow');
    state.categoriesSection = document.getElementById('categoriesSection');
    state.subcategoriesView = document.getElementById('subcategoriesView');
    state.locationsView = document.getElementById('locationsView');
    state.locationDetailsView = document.getElementById('locationDetailsView');
    state.directionsView = document.getElementById('directionsView');
    state.navigationView = document.getElementById('navigationView');
    state.searchInput = document.getElementById('searchInput');
    state.searchSectionCategories = document.getElementById('searchSectionCategories');
    state.subcategoriesBackBtn = document.getElementById('subcategoriesBackBtn');
    state.locationsBackBtn = document.getElementById('locationsBackBtn');
    state.locationDetailsBackBtn = document.getElementById('locationDetailsBackBtn');
    state.directionsBackBtn = document.getElementById('directionsBackBtn');
    state.subcategoriesTitle = document.getElementById('subcategoriesTitle');
    state.locationsTitle = document.getElementById('locationsTitle');
    state.subcategoriesList = document.getElementById('subcategoriesList');
    state.locationsList = document.getElementById('locationsList');
    state.locationInfo = document.getElementById('locationInfo');
    state.startNavigationBtn = document.getElementById('startNavigationBtn');
    state.nextStepBtn = document.getElementById('nextStepBtn');
    state.endNavigationBtn = document.getElementById('endNavigationBtn');

    state.isDesktop = window.innerWidth > 768;

    // Initialize data from the original class
    state.subcategoriesData = {
        'Food & Drinks': [
            { name: 'Bakery & Desserts', icon: '🧁' },
            { name: 'Bar & Cocktails', icon: '🍸' },
            { name: 'Breakfast', icon: '🥞' },
            { name: 'Drinks', icon: '☕' },
            { name: 'Fast Food', icon: '🍔' },
            { name: 'Grab & Go', icon: '🥪' },
            { name: 'Pizza', icon: '🍕' },
            { name: 'Sandwiches', icon: '🥪' }
        ],
        'Shops': [
            { name: 'Duty Free', icon: '🛍️' },
            { name: 'Electronics', icon: '📱' },
            { name: 'Fashion', icon: '👕' },
            { name: 'Gifts & Souvenirs', icon: '🎁' },
            { name: 'Books & Magazines', icon: '📚' },
            { name: 'Travel Accessories', icon: '🧳' }
        ]
    };

    state.locationsData = {
        'Drinks': [
            { name: 'Starbucks', address: 'L4, Terminal B', type: 'starbucks', hours: '5:00 AM - 11:00 PM', phone: '(555) 123-4567' },
            { name: 'Starbucks', address: 'L3, Terminal C', type: 'starbucks', hours: '5:30 AM - 10:30 PM', phone: '(555) 123-4568' },
            { name: 'Starbucks', address: 'L2, Terminal A', type: 'starbucks', hours: '5:00 AM - 10:00 PM', phone: '(555) 123-4569' }
        ],
        'Fast Food': [
            { name: 'Panda Express', address: 'L4, Terminal B', type: 'panda', hours: '6:00 AM - 10:00 PM', phone: '(555) 234-5678' },
            { name: 'Burger King', address: 'L2, Terminal B', type: 'burger', hours: '5:00 AM - 11:00 PM', phone: '(555) 345-6789' }
        ]
    };

    state.navigationSteps = [
        { text: 'Start at your current location', distance: '57 feet', icon: '🔘' },
        { text: 'Head toward Security Checkpoint B', distance: '72 feet', icon: '↱' },
        { text: 'Take escalator to Level 3', distance: '108 feet', icon: '↑' },
        { text: 'Continue straight past Gate B12', distance: '156 feet', icon: '→' },
        { text: 'Turn left at the main corridor', distance: '89 feet', icon: '↰' },
        { text: 'Walk past the duty-free shop', distance: '134 feet', icon: '→' },
        { text: 'Arrive at Starbucks on your right', distance: '0 feet', icon: '🏁' }
    ];

    updateLayout();
    setupEventListeners();
    setupNavigationSystem();
    showCategoriesView();
}

// Helper functions (from the original file, moved here)
function isItArabic(text) {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicPattern.test(text);
}

function isItEnglish(text) {
    const englishPattern = /^[A-Za-z0-9&/\s-]+$/; // Allows letters, numbers, '&', '/', and spaces
    return englishPattern.test(text);
}

function normalizeArray(input) {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Invalid JSON array string:', input);
      return [];
    }
  }
  return Array.isArray(input) ? input : [];
}

function getEnglishOnly(arr) {
  const items = normalizeArray(arr);
  const englishRegex = /^[\u0000-\u007F]+$/;
  return items.filter(item => englishRegex.test(item));
}

function getArabicOnly(arr) {
  const items = normalizeArray(arr);
  const arabicRegex = /^[\u0600-\u06FF\s]+$/;
  return items.filter(item => arabicRegex.test(item));
}

function getChineseOnly(arr) {
  const items = normalizeArray(arr);
  const chineseRegex = /^[\u3400-\u4DBF\u4E00-\u9FFF\s]+$/;
  return items.filter(item => chineseRegex.test(item));
}

function parseCenter(center) {
  if (typeof center === 'string') {
    try {
      center = JSON.parse(center);
    } catch (e) {
      console.error('Invalid center format:', center);
      return [0, 0]; // fallback default
    }
  }

  if (Array.isArray(center) && center.length === 2) {
    return [parseFloat(center[0]), parseFloat(center[1])];
  }

  console.error('Invalid center format:', center);
  return [0, 0]; // fallback default
}

function getPOITitleByLang(poi, lang = 'EN') {
    if (!poi) return '';

    const normalizedLang = lang.toLowerCase();
    const key = `title_${normalizedLang}`;
    const localizedTitle = poi[key];
    if (localizedTitle && localizedTitle.trim()) {
        return localizedTitle;
    }

    return poi.title || '';
}

function sortLocationsByLang(locations, lang = 'EN') {
    const normalizedLang = lang.toLowerCase();
    const key = `title_${normalizedLang}`;

    locations.sort((a, b) => {
        const titleA = a.properties[key] || '';
        const titleB = b.properties[key] || '';
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    });

    return locations;
}

// All methods from the class will be converted to functions here
function setupEventListeners() {
    // Arrow click functionality
    if (state.menuArrow) {
        state._menuArrowClickHandler = (e) => {
            e.preventDefault();
            if (state.isDesktop) {
                toggleDesktopMenu();
            } else {
                toggleMobileState();
            }
        };
        state.menuArrow.addEventListener('click', state._menuArrowClickHandler);
    }

    // Search functionality
    setupSearchInteractions();

    // Subcategories functionality
    setupSubcategoriesInteractions();

    // Mobile touch/drag functionality
    setupMobileInteractions();

    // Scroll detection for mobile
    setupScrollDetection();

    // Window resize handler
    state._windowResizeHandler = () => {
        state.isDesktop = window.innerWidth > 768;
        updateLayout();
    };
    window.addEventListener('resize', state._windowResizeHandler);

    // Global click listener for dropdowns
    state._documentClickListener = function (event) {
        const dropdown = document.querySelector('.dropdown');
        const list = document.getElementById('dropdownList');
        if (dropdown && list && !dropdown.contains(event.target)) {
            list.classList.remove('show');
        }
    };
    document.addEventListener('click', state._documentClickListener);

    // Legend Toggle
    const toggle = document.getElementById('legendToggle');
    const panel = document.getElementById('legendPanel');
    if (toggle && panel) {
        state._legendToggleHandler = () => {
            panel.classList.toggle('show');
        };
        toggle.addEventListener('click', state._legendToggleHandler);
    }

    // Terminals Dropdown List Button
    const TerminalsDropdownListBtn = document.getElementById('TerminalsDropdownListBtn');
    if (TerminalsDropdownListBtn) {
        state._terminalDropdownListBtnHandler = () => {
            toggleDropdown();
        };
        TerminalsDropdownListBtn.addEventListener('click', state._terminalDropdownListBtnHandler);
    }

    // Dropdown Options
    const dropdownList = document.getElementById("dropdownList");
    if (dropdownList) {
        const options = dropdownList.querySelectorAll(".dropdown-option");
        options.forEach(option => {
            state._dropdownOptionClickHandler = function () {
                const selectedTerminal = option.getAttribute("data-terminal-id");
                const dropdownSubtitle = document.querySelector(".dropdown-subtitle");
                if (dropdownSubtitle) {
                    dropdownSubtitle.textContent = selectedTerminal;
                }
                dropdownList.classList.remove("show");

                if (selectedTerminal == "All") {
                    cfg.state.selectedTerminal = null;
                } else {
                    cfg.state.selectedTerminal = selectedTerminal;
                    mapc.flyToTerminal(selectedTerminal);
                }
            };
            option.addEventListener("click", state._dropdownOptionClickHandler);
        });
    }
}

function toggleDropdown() {
    const list = document.getElementById('dropdownList');
    if (list) {
        list.classList.toggle('show');
    }
}

function setupSubcategoriesInteractions() {
    setupMenuItemClicks();

    if (state.subcategoriesBackBtn) {
        state.subcategoriesBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCategoriesView();
        });
    }

    if (state.locationsBackBtn) {
        state.locationsBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.currentSubcategory != null) {
                showSubcategoriesView(state.currentCategory);
            } else {
                showCategoriesView();
                document.getElementById("menuArrow").style.display = "flex";
            }
        });
    }

    if (state.locationDetailsBackBtn) {
        state.locationDetailsBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.currentSubcategory != null) {
                console.error("state.currentSubcategory : ", state.currentSubcategory);
                showLocationsView(state.currentSubcategory);
                document.getElementById("menuArrow").style.display = "none";
            } else {
                showCategoriesView();
                state.isExpanded = false;
                document.getElementById("menuArrow").style.display = "flex";
            }
        });
    }

    if (state.directionsBackBtn) {
        state.directionsBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const departureContainer = document.getElementsByClassName("departure-input-container")[0];
            const destinationContainer = document.getElementsByClassName("destination-container")[0];
            state.navigationView.style.display = "none";
            departureContainer.style.display = "block";
            destinationContainer.style.display = "block";
            console.log("ENDED NAVIGATION", state.currentLocation);
            showLocationDetailsView(state.currentLocation);
            mapc.clearRoute();
            document.getElementById("stepsButton").innerHTML = `Show Steps`;
        });
    }

    if (state.startNavigationBtn) {
        state.startNavigationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showNavigationView();
        });
    }

    if (state.nextStepBtn) {
        state.nextStepBtn.addEventListener('click', (e) => {
            e.preventDefault();
            nextNavigationStep();
        });
    }

    const departureInput = document.getElementById('departureInput');
    if (departureInput) {
        state._departureInputHandler = (e) => {
            e.preventDefault();
        };
        departureInput.addEventListener('click', state._departureInputHandler);
    }

    const popularLocationsBackBtn = document.getElementById('popularLocationsBackBtn');
    if (popularLocationsBackBtn) {
        state._popularLocationsBackBtnHandler = (e) => {
            e.preventDefault();
            showCategoriesView(state.currentLocation);
        };
        popularLocationsBackBtn.addEventListener('click', state._popularLocationsBackBtnHandler);
    }
}

function setCurrentLocation(location) {
    state.currentLocation = location;
}

function clearLocations() {
    state.departureLocation = null;
    state.currentLocation = null;
}

function setupMenuItemClicks() {
    const menuItems = document.querySelectorAll('.category-item');
    menuItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryName = item.querySelector('.category-label').textContent;
            state.categoryItem = categoryName;
            showSubcategoriesView(categoryName);
        });
    });
}

function setupSearchInteractions() {
    if (state.searchInput) {
        state._searchInputFocusHandler = () => {
            // This function was empty in the original code, or had commented out logic
        };
        state.searchInput.addEventListener('focus', state._searchInputFocusHandler);

        state._searchInputInputHandler = (e) => {
            console.log('Search input changed:', e.target.value);
            const query = e.target.value.trim();
            if (query.length > 0) {
                state.currentSubcategory = null;
                state.categoryItem = null;
                populateLocationSearch(query);
                expandMenu();
                document.getElementById("menuArrow").style.display = "none";
            } else {
                showCategoriesView();
                document.getElementById("menuArrow").style.display = "flex";
            }
        };
        state.searchInput.addEventListener('input', state._searchInputInputHandler);
    }
}

function setupMobileInteractions() {
    if (!state.menuContainer) return;

    state._menuContainerTouchStartHandler = (e) => {
        if (state.isDesktop) return;
        state.startY = e.touches[0].clientY;
        state.isDragging = true;
    };
    state.menuContainer.addEventListener('touchstart', state._menuContainerTouchStartHandler, { passive: true });

    state._menuContainerTouchMoveHandler = (e) => {
        if (!state.isDragging || state.isDesktop) return;
        state.currentY = e.touches[0].clientY;
    };
    state.menuContainer.addEventListener('touchmove', state._menuContainerTouchMoveHandler, { passive: true });

    state._menuContainerTouchEndHandler = () => {
        if (!state.isDragging || state.isDesktop) return;
        handleDragEnd();
        state.isDragging = false;
    };
    state.menuContainer.addEventListener('touchend', state._menuContainerTouchEndHandler, { passive: true });
}

function setupScrollDetection() {
    let scrollTimeout;
    let scrollCount = 0;

    state._windowScrollHandler = () => {
        if (state.isDesktop) return;

        clearTimeout(scrollTimeout);
        scrollCount++;

        scrollTimeout = setTimeout(() => {
            if (scrollCount > 0) {
                handleScrollDetection();
            }
            scrollCount = 0;
        }, 100);
    };
    window.addEventListener('scroll', state._windowScrollHandler, { passive: true });

    state._windowWheelHandler = (e) => {
        if (state.isDesktop) return;

        if (e.deltaY < 0) {
            handleUpwardScroll();
        }
    };
    window.addEventListener('wheel', state._windowWheelHandler, { passive: true });
}

function setupNavigationSystem() {
    // console.log('Navigation system initialized');
}

function hasSubcategories(categoryName) {
    return state.subcategoriesData.hasOwnProperty(categoryName);
}

function showCategoriesView() {
    state.currentView = 'categories';

    if (state.categoriesSection) state.categoriesSection.style.display = 'block';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'block';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';

    const menuArrow = document.getElementById('menuArrow');
    if (menuArrow) {
        menuArrow.style.display = 'flex';
    }

    if (state.menuContainer) {
        if (state.isExpanded || state.menuContainer.classList.contains('desktop-expanded')) {
            state.menuContainer.style.maxHeight = '785px';
        } else {
            state.menuContainer.style.maxHeight = '250px';
        }
    }
    expandMenu();

    // Show search bar when going back to categories
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }

    // Also show the main search input
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput) {
        searchInput.style.display = 'block';
    }

    // Hide popular locations view if it exists
    const popularView = document.getElementById('popularLocationsView');
    if (popularView) popularView.style.display = 'none';
}

export function expandMenu() {
    if (state.isMobile) return;

    state.isExpanded = true;
    state.menuContainer.classList.add('desktop-expanded');
    state.menuContainer.classList.remove('desktop-collapsed');
    updateArrowDirection();
}

function showSubcategoriesView(categoryName) {
    state.currentView = 'subcategories';
    state.currentCategory = categoryName;

    expandMenu();

    if (state.subcategoriesTitle) {
        state.subcategoriesTitle.textContent = categoryName;
    }

    populateSubcategories(categoryName);

    const menuArrow = document.getElementById('menuArrow');
    if (menuArrow) {
        menuArrow.style.display = 'none';
    }

    if (state.menuContainer) {
        state.menuContainer.style.maxHeight = 'fit-content';
    }

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'block';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';
}

function showLocationsViewByID(categoryID) {
    state.currentView = 'locations';
    state.currentSubcategory = null;

    expandMenu();

    populateLocationsByID(categoryID);

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'block';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';
}

function showLocationDetailsView(location) {
    console.log('Showing location details view for', location);
    state.currentView = 'location-details';
    state.currentLocation = location;
    console.log("showLocationDetailsView :", state.currentLocation);

    expandMenu();

    populateLocationDetails(location);

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'block';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';
}

function showDirectionsView(location) {
    state.currentView = 'directions';
    state.currentLocation = location;

    const destinationText = document.getElementById('destinationInput');
    if (destinationText && location) {
        destinationText.value = getPOITitleByLang(location.properties, cfg.state.language) || 'Selected Location';
        destinationText.disabled = true;
    }

    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.display = 'none';
    }

    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput) {
        searchInput.style.display = 'none';
    }

    setupDepartureSearch();

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'block';
    if (state.navigationView) state.navigationView.style.display = 'none';

    const popularView = document.getElementById('popularLocationsView');
    if (popularView) popularView.style.display = 'none';
}

function setupDepartureSearch() {
    const departureInput = document.getElementById('departureInput');
    const departureResults = document.getElementById('departureResults');

    if (!departureInput || !departureResults) return;

    departureInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            showPopularLocationsView();
            populatePopularLocationsByName(query);
        } else {
            departureResults.style.display = 'none';
        }
    });

    departureInput.addEventListener('focus', () => {
        if (departureInput.value.trim() === '') {
            // showPopularDepartureLocations();
        }
    });

    document.addEventListener('click', (e) => {
        if (!departureInput.contains(e.target) && !departureResults.contains(e.target)) {
            // departureResults.style.display = 'none';
        }
    });
}



function showCompleteDirectionsInterface(departureLocation) {
    console.log('Showing complete directions interface for:', departureLocation, state.currentLocation);

    state.currentView = 'directions';

    if (state.directionsView) {
        state.directionsView.style.display = 'block';
    }

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';

    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    const departureResults = document.getElementById('departureResults');
    const popularView = document.getElementById('popularLocationsView');

    if (searchContainer) searchContainer.style.display = 'none';
    if (searchInput) searchInput.style.display = 'none';
    if (departureResults) departureResults.style.display = 'none';
    if (popularView) popularView.style.display = 'none';

    const backBtn = document.getElementById('directionsBackBtn');
    const headerOptions = document.querySelector('.header-options');
    const accessibilityToggle = document.querySelector('.accessibility-toggle');
    const optionsMenu = document.querySelector('.options-menu');

    if (backBtn) backBtn.style.display = 'block';
    if (headerOptions) headerOptions.style.display = 'flex';
    if (accessibilityToggle) accessibilityToggle.style.display = 'block';
    if (optionsMenu) optionsMenu.style.display = 'block';

    const [fromLng, fromLat] = parseCenter(departureLocation.properties.center);
    const [toLng, toLat] = parseCenter(state.currentLocation.properties.center);

    route.drawPathToPoi(
        departureLocation.properties.title,
        fromLng,
        fromLat,
        departureLocation.properties.level,
        state.currentLocation.properties.title,
        toLng,
        toLat,
        state.currentLocation.properties.level
    );

    const addDestination = document.querySelector('.add-destination');
    if (addDestination) {
        addDestination.style.display = 'flex';
    }

    const routeSummary = document.getElementById('routeSummary');
    if (routeSummary) {
        routeSummary.style.display = 'block';

        const stepsButton = document.getElementById('stepsButton');
        if (stepsButton) {
            if (state._stepsButtonClickHandler) {
                stepsButton.removeEventListener('click', state._stepsButtonClickHandler);
            }
            state._stepsButtonClickHandler = () => {
                showNavigationSteps(departureLocation, state.currentLocation);
            };
            stepsButton.addEventListener('click', state._stepsButtonClickHandler);
        }

        const endroutebtn = document.getElementById('endRoutebtn');
        if (endroutebtn) {
            if (state._endRouteClickHandler) {
                endroutebtn.removeEventListener('click', state._endRouteClickHandler);
            }
            state._endRouteClickHandler = () => {
                mapc.clearRoute();
                document.getElementById("directionsBackBtn").click();
            };
            endroutebtn.addEventListener('click', state._endRouteClickHandler);
        }
    }

    const journeyBreakdown = document.querySelector('.journey-breakdown');
    if (journeyBreakdown) {
        journeyBreakdown.style.display = 'none';
    }

    state.selectedDeparture = departureLocation;

    if (backBtn) {
        if (state._backButtonClickHandler) {
            backBtn.removeEventListener('click', state._backButtonClickHandler);
        }
        state._backButtonClickHandler = () => {
            routeSummary.style.display = 'none';
            const departureInput = document.getElementById('departureInput');
            if (departureInput) {
                departureInput.value = "";
            }
            const destinationInput = document.getElementById('destinationInput');
            if (destinationInput) {
                destinationInput.value = "";
            }
            showLocationDetailsView(state.currentLocation);
        };
        backBtn.addEventListener('click', state._backButtonClickHandler);
    }

    const swapBtn = document.getElementById('swapLocationsBtn');
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            swapDepartureDestination();
        });
    }
}

function calculateTravelTime(from, to) {
    if (window.AIRPORT_DATA) {
        const path = window.AIRPORT_DATA.getPathBetween(from.id, to.id);
        if (path && path.duration) {
            return path.duration;
        }
    }
    return Math.floor(Math.random() * 10) + 5;
}

function swapDepartureDestination() {
    const temp = state.selectedDeparture;
    state.selectedDeparture = state.currentLocation;
    state.currentLocation = temp;
    showCompleteDirectionsInterface(state.selectedDeparture);
}

function getLocationIcon(type) {
    const icons = {
        'starbucks': '☕',
        'panda': '🐼',
        'burger': '🍔',
        'amex': '💳',
        'generic': '📍'
    };
    return icons[type] || icons.generic;
}

function showNavigationSteps() {
    const isNavigationVisible = state.navigationView && state.navigationView.style.display === 'block';
    if (isNavigationVisible) {
        console.log("1 - Hide");
        hideNavigationSteps();
    } else {
        console.log("1 - display");
        displayNavigationSteps();
    }
}

function displayNavigationSteps() {
    state.currentView = 'navigation';

    if (state.navigationView) {
        state.navigationView.style.display = 'block';
    }

    if (state.directionsView) {
        state.directionsView.style.display = 'block';
    }

    const departureContainer = document.getElementsByClassName("departure-input-container")[0];
    const destinationContainer = document.getElementsByClassName("destination-container")[0];
    const addDestination = document.querySelector('.add-destination');
    const routeSummary = document.getElementById('routeSummary');

    if (departureContainer) departureContainer.style.display = 'none';
    if (destinationContainer) destinationContainer.style.display = 'none';
    if (addDestination) addDestination.style.display = 'none';

    const stepsButton = document.getElementById('stepsButton');
    if (stepsButton) {
        stepsButton.innerHTML = `Hide Steps`;
        stepsButton.style.background = '#4DA8DA !important';
    }

    populateCleanNavigationSteps();
}

function hideNavigationSteps() {
    state.currentView = 'directions';

    if (state.navigationView) {
        state.navigationView.style.display = 'none';
    }

    setTimeout(() => {
        const departureContainer = document.getElementsByClassName("departure-input-container")[0];
        const destinationContainer = document.getElementsByClassName("destination-container")[0];
        const addDestination = document.querySelector('.add-destination');
        const routeSummary = document.getElementById('routeSummary');

        if (departureContainer) {
            departureContainer.style.display = 'block';
            departureContainer.style.visibility = 'visible';
        }
        if (destinationContainer) {
            destinationContainer.style.display = 'flex';
            destinationContainer.style.visibility = 'visible';
        }
        if (addDestination) {
            addDestination.style.display = 'flex';
            addDestination.style.visibility = 'visible';
        }
        if (routeSummary) {
            routeSummary.style.display = 'block';
            routeSummary.style.visibility = 'visible';
        }
    }, 100);

    const stepsButton = document.getElementById('stepsButton');
    if (stepsButton) {
        stepsButton.innerHTML = `Show Steps`;
        stepsButton.style.background = '#4DA8DA !important';
    }
}

function populateCleanNavigationSteps() {
    const navigationStepsList = document.getElementById('navigationStepsList');
    if (!navigationStepsList) {
        console.error('navigationStepsList element not found');
        return;
    }

    const instructions = navigation.generateNavigationInstructions(mapc.smartRoute, cfg.state.language);
    navigationStepsList.innerHTML = '';

    if (state.selectedDeparture) {
        const departureHeader = document.createElement('div');
        departureHeader.className = 'location-header';
        departureHeader.innerHTML = `
            <div class="location-dot departure"></div>
            <div class="location-text">${getPOITitleByLang(state.selectedDeparture.properties, cfg.state.language)}</div>
        `;
        navigationStepsList.appendChild(departureHeader);
    }

    instructions.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'clean-step-item';
        stepElement.setAttribute('data-step', index + 1);

        if (step.type === 'destination') {
            stepElement.innerHTML = `
                <div class="clean-step-icon">${step.icon}</div>
                <div class="clean-step-content">
                    <div class="clean-step-text">${step.text}</div>
                </div>
            `;
        } else {
            const distance = step?.distance ? navigation.formatDistanceImperial(step.distance, cfg.state.language) : null;
            stepElement.innerHTML = `
                <div class="clean-step-icon">${step.icon}</div>
                <div class="clean-step-content">
                    <div class="clean-step-text">${step.text}</div>
                    <div class="clean-step-time">
                    ${distance ? `${distance.value}&nbsp;${distance.unit}` : ''}
                    </div>
                </div>
            `;
        }
        navigationStepsList.appendChild(stepElement);
    });

    if (state.currentLocation) {
        const destinationFooter = document.createElement('div');
        destinationFooter.className = 'location-header';
        destinationFooter.innerHTML = `
            <div class="location-dot destination"></div>
            <div class="location-text">${getPOITitleByLang(state.currentLocation.properties, cfg.state.language)}</div>
        `;
        navigationStepsList.appendChild(destinationFooter);
    }
}

function highlightRouteSegment(map, geojsonData, startCoord, endCoord, levelRoutePoi, switchFloorByOn, highlightColor = '#FF0000') {
    const startStr = startCoord.map(c => Number(c).toFixed(6)).join(',');
    const endStr = endCoord.map(c => Number(c).toFixed(6)).join(',');

    const currentKey = `${startStr}_${endStr}`;

    if (cfg.state.lastHighlighted === currentKey) {
        if (map.getLayer('highlight-segment-layer')) map.removeLayer('highlight-segment-layer');
        if (map.getSource('highlight-segment')) map.removeSource('highlight-segment');
        if (map.getLayer('highlight-dot-layer')) map.removeLayer('highlight-dot-layer');
        if (map.getSource('highlight-dot')) map.removeSource('highlight-dot');
        cfg.state.lastHighlighted = null;
        return;
    }

    if (map.getLayer('highlight-segment-layer')) map.removeLayer('highlight-segment-layer');
    if (map.getSource('highlight-segment')) map.removeSource('highlight-segment');
    if (map.getLayer('highlight-dot-layer')) map.removeLayer('highlight-dot-layer');
    if (map.getSource('highlight-dot')) map.removeSource('highlight-dot');

    cfg.state.lastHighlighted = currentKey;

    if (startStr !== endStr) {
        const lng1 = Number(startCoord[0]);
        const lat1 = Number(startCoord[1]);
        const lng2 = Number(endCoord[0]);
        const lat2 = Number(endCoord[1]);

        const point1 = turf.point([lng1, lat1]);
        const point2 = turf.point([lng2, lat2]);
        const bearing = turf.bearing(point1, point2);

        const center = [(lng1 + lng2) / 2, (lat1 + lat2) / 2];

        map.flyTo({
            center: center,
            bearing: bearing,
            zoom: map.getZoom(),
            speed: 1.2,
            pitch: 60,
            duration: 3000
        });
    }

    if (startStr === endStr) {
        const dotFeature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: startCoord.map(Number)
            }
        };

        map.addSource('highlight-dot', {
            type: 'geojson',
            data: dotFeature
        });

        map.addLayer({
            id: 'highlight-dot-layer',
            type: 'circle',
            source: 'highlight-dot',
            paint: {
                'circle-radius': 8,
                'circle-color': highlightColor,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
        map.moveLayer("arrow-layer");
        return;
    }

    let foundStart = false;
    let foundEnd = false;
    let segmentCoords = [];
    let segmentLevel = null;

    for (const feature of geojsonData.features || []) {
        const coords = feature.geometry?.coordinates || [];
        if (!coords.length) continue;

        const featureLevel = parseInt(feature.properties?.level);

        for (let i = 0; i < coords.length; i++) {
            const pointStr = coords[i].map(c => Number(c).toFixed(6)).join(',');

            if (!foundStart && pointStr === startStr) {
                foundStart = true;
                segmentLevel = featureLevel;
                segmentCoords.push(coords[i].map(Number));
                continue;
            }

            if (foundStart && !foundEnd) {
                segmentCoords.push(coords[i].map(Number));
                if (pointStr === endStr) {
                    foundEnd = true;
                    break;
                }
            }
        }

        if (foundEnd) break;
    }

    if (!foundStart || !foundEnd) {
        console.warn("Start or end coordinate not found in the route.");
        cfg.state.lastHighlighted = null;
        return;
    }
    console.log("1 - segmentLevel : ", segmentLevel);

    if (segmentLevel !== null && segmentLevel !== levelRoutePoi) {
        if (segmentLevel == 0) {
            segmentLevel = "G";
        }
        switchFloorByOn(segmentLevel);
    }

    const segmentGeoJSON = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: segmentCoords
        }
    };

    map.addSource('highlight-segment', {
        type: 'geojson',
        data: segmentGeoJSON
    });

    map.addLayer({
        id: 'highlight-segment-layer',
        type: 'line',
        source: 'highlight-segment',
        paint: {
            'line-color': highlightColor,
            'line-width': 15
        }
    });
    map.moveLayer("arrow-layer");
}

function endNavigation() {
    state.currentStep = 0;
    showCategoriesView();

    if (state.navigationView) {
        state.navigationView.style.display = 'none';
    }

    setTimeout(() => {
        const departureContainer = document.getElementsByClassName("departure-input-container")[0];
        const destinationContainer = document.getElementsByClassName("destination-container")[0];
        const addDestination = document.querySelector('.add-destination');
        const routeSummary = document.getElementById('routeSummary');

        if (departureContainer) {
            departureContainer.style.display = 'block';
            departureContainer.style.visibility = 'visible';
        }
        if (destinationContainer) {
            destinationContainer.style.display = 'flex';
            destinationContainer.style.visibility = 'visible';
        }
        if (addDestination) {
            addDestination.style.display = 'flex';
            addDestination.style.visibility = 'visible';
        }
        if (routeSummary) {
            routeSummary.style.display = 'block';
            routeSummary.style.visibility = 'visible';
        }

        const stepsButton = document.getElementById('stepsButton');
        if (stepsButton) {
            stepsButton.innerHTML = `Show Steps`;
            stepsButton.style.background = '#4DA8DA !important';
        }
    }, 100);
}

function showPopularDepartureLocations() {
    const popularLocations = [
        {
            id: 'centurion_lounge_b_l4',
            name: 'American Express-The Centurion',
            address: 'L4, Terminal B',
            icon: 'amex',
            iconText: '💳'
        },
        {
            id: 'panda_b_l4',
            name: 'Panda Express',
            address: 'L4, Terminal B',
            icon: 'panda',
            iconText: '🥡'
        },
        {
            id: 'starbucks_b_l4',
            name: 'Starbucks',
            address: 'L4, Terminal B',
            icon: 'starbucks',
            iconText: '☕'
        },
        {
            id: 'starbucks_l1_2',
            name: 'Starbucks',
            address: 'L1, Terminal 2',
            icon: 'starbucks',
            iconText: '☕'
        }
    ];
    displayDepartureResults(popularLocations);
}

function displayDepartureResults(locations) {
    const departureResults = document.getElementById('departureResults');
    if (!departureResults) return;

    departureResults.innerHTML = '';

    locations.forEach(location => {
        const resultItem = document.createElement('div');
        resultItem.className = 'departure-result-item';

        const iconClass = location.icon || 'default';
        const iconText = location.iconText || '📍';

        resultItem.innerHTML = `
            <div class="departure-result-icon ${iconClass}" style="background-color: ${getIconColor(iconClass)}">
                ${iconText}
            </div>
            <div class="departure-result-details">
                <div class="departure-result-name">${location.name}</div>
                <div class="departure-result-address">${location.address}</div>
            </div>
        `;

        resultItem.addEventListener('click', () => {
            console.log("Selected !!!");
            selectDepartureLocation(location);
        });

        departureResults.appendChild(resultItem);
    });

    departureResults.style.display = 'block';
}

function getIconColor(iconClass) {
    const colors = {
        'amex': '#2E5BBA',
        'panda': '#D32F2F',
        'starbucks': '#00704A',
        'default': '#666'
    };
    return colors[iconClass] || colors.default;
}

function selectDepartureLocation(departureLocation) {
    state.selectedDeparture = departureLocation;
    console.log("-----------------------------");
    console.log("1 - Departure : " + getPOITitleByLang(departureLocation.properties, cfg.state.language));
    console.log("2 - Destination : " + getPOITitleByLang(state.currentLocation.properties, cfg.state.language));
    const departureInput = document.getElementById('departureInput');
    if (departureInput) {
        departureInput.value = getPOITitleByLang(departureLocation.properties, cfg.state.language);
        departureInput.classList.add('filled');
    }

    const destinationInput = document.getElementById('destinationInput');
    if (destinationInput) {
        destinationInput.value = getPOITitleByLang(state.currentLocation.properties, cfg.state.language);
        destinationInput.classList.add('filled');
    }

    const popularView = document.getElementById('popularLocationsView');
    if (popularView) {
        popularView.style.display = 'none';
    }

    const departureResults = document.getElementById('departureResults');
    if (departureResults) {
        departureResults.style.display = 'none';
    }

    showCompleteDirectionsInterface(departureLocation);
}

function showNavigationView() {
    state.currentView = 'navigation';
    state.currentStep = 0;

    populateNavigation();

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'block';

    const popularView = document.getElementById('popularLocationsView');
    if (popularView) popularView.style.display = 'none';
}

function showPopularLocationsView() {
    state.currentView = 'popular-locations';

    const destinationTextPopular = document.getElementById('destinationTextPopular');
    if (destinationTextPopular && state.currentLocation) {
        destinationTextPopular.textContent = state.currentLocation.name || 'Selected Location';
    }

    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.display = 'none';
    }

    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput) {
        searchInput.style.display = 'none';
    }

    const popularView = document.getElementById('popularLocationsView');
    if (popularView) {
        popularView.style.display = 'block';
        populatePopularLocations();
    }

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'none';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'block';
    if (state.navigationView) state.navigationView.style.display = 'none';
}

function populateLocationsByName(poiName) {
    let allLocations = [];

    cfg.state.allPoiGeojson.features.forEach((feature) => {
        feature.properties = mapTranslator.translatePOIProperties(feature);
        const { title = '', location } = feature.properties;

        const matchesPoiName = getPOITitleByLang(feature.properties, cfg.state.language).toLowerCase().includes(poiName.toLowerCase());
        const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

        if (matchesPoiName && matchesTerminal) {
            allLocations.push(feature);
        }
    });

    if (allLocations.length < 1) {
        document.getElementById("NoResultsFound").style.display = "block";
    } else {
        document.getElementById("NoResultsFound").style.display = "none";
    }

    state.locationsList.innerHTML = '';
    sortLocationsByLang(allLocations, cfg.state.language);
    allLocations.forEach(location => {
        var icon = location?.properties?.iconUrl
            ? location.properties.iconUrl
            : "./src/images/missingpoi.png";
        var title = getPOITitleByLang(location.properties, cfg.state.language);
        var language = cfg.state.language;
        var poiTerminalLocation = cfg.state.terminalTranslations[language][location?.properties.location];
        var poiLevel = cfg.state.floorsNames[language][location.properties.level];
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <div class="location-icon">
                <img style="width: 40px; border-radius: 5px;" src="${icon}" />
            </div>
            <div class="location-details">
                <div class="location-name">${title}</div>
                <div class="location-address">${poiTerminalLocation} - ${poiLevel}</div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            showLocationDetailsView(location);
        });

        state.locationsList.appendChild(item);
    });
}

function populatePopularLocationsByName(poiName) {
    const popularLocationsList = document.getElementById('popularLocationsList');
    if (!popularLocationsList) return;

    let allLocations = [];

    cfg.state.allPoiGeojson.features.forEach((feature) => {
        feature.properties = mapTranslator.translatePOIProperties(feature);
        const { title = '', location } = feature.properties;

        const matchesPoiName = getPOITitleByLang(feature.properties, cfg.state.language).toLowerCase().includes(poiName.toLowerCase());
        const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

        if (matchesPoiName && matchesTerminal) {
            allLocations.push(feature);
        }
    });

    popularLocationsList.innerHTML = '';
    sortLocationsByLang(allLocations, cfg.state.language);

    allLocations.forEach(location => {
        var icon = location?.properties?.iconUrl
            ? location.properties.iconUrl
            : "./src/images/missingpoi.png";
        var title = getPOITitleByLang(location.properties, cfg.state.language);
        var language = cfg.state.language;
        var poiTerminalLocation = cfg.state.terminalTranslations[language][location.properties.location];
        var level = cfg.state.floorsNames[language][location.properties.level];
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <div class="location-icon">
                <img style="width: 40px;" border-radius: 5px; src="${icon}" />
            </div>
            <div class="location-details">
                <div class="location-name">${title}</div>
                <div class="location-address">${poiTerminalLocation} - ${level}</div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            selectDepartureLocation(location);
        });

        popularLocationsList.appendChild(item);
    });
}

function populatePopularLocations() {
    const popularLocationsList = document.getElementById('popularLocationsList');
    if (!popularLocationsList) return;

    let allLocations = [];

    cfg.state.allPoiGeojson.features.forEach((feature) => {
        const { location } = feature.properties;
        if (!cfg.state.selectedTerminal || location === cfg.state.selectedTerminal) {
            feature.properties = mapTranslator.translatePOIProperties(feature);
            allLocations.push(feature);
        }
    });

    popularLocationsList.innerHTML = '';
    sortLocationsByLang(allLocations, cfg.state.language);

    allLocations.forEach(location => {
        var icon = location?.properties?.iconUrl
            ? location.properties.iconUrl
            : "./src/images/missingpoi.png";
        var title = getPOITitleByLang(location.properties, cfg.state.language);
        var language = cfg.state.language;
        var poiTerminalLocation = cfg.state.terminalTranslations[language][location.properties.location];
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <div class="location-icon">
                <img style="width: 40px;" border-radius: 5px; src="${icon}" />
            </div>
            <div class="location-details">
                <div class="location-name">${title}</div>
                <div class="location-address">${poiTerminalLocation}</div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            selectDepartureLocation(location);
        });

        popularLocationsList.appendChild(item);
    });
}

function showLocationsView(subcategoryName) {
    state.currentView = 'locations';
    state.currentSubcategory = subcategoryName;

    expandMenu();

    populateLocations(subcategoryName);

    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'block';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';
}

function populateSubcategories(categoryName) {
    var clickedCategoryId;
    var language = cfg.state.language;
    for (var t = 0; t < cfg.state.categoryObject.building_poi_categories.length; t++) {
        if (
            cfg.state.categoryObject.building_poi_categories[t].name ===
            cfg.state.reversedCategoryTranslations[language][categoryName]
        ) {
            clickedCategoryId = cfg.state.categoryObject.building_poi_categories[t].id;
            break;
        }
    }

    const subcategoryMap = {
        EN: "All",
        AR: "الكل",
        ZN: "全部"
    };

    let subcategories = [subcategoryMap[cfg.state.language] || "All"];
    let found = false;

    cfg.state.allPoiGeojson.features.forEach((feature) => {
        const { category_id, location, subcategories: featureSubcategories } = feature.properties;

        const matchesCategory = category_id === clickedCategoryId;
        const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

        if (matchesCategory && matchesTerminal && featureSubcategories.length > 0) {
            subcategories.push(...featureSubcategories);
            found = true;
        }
    });

    const uniqueSubcategories = [...new Set(subcategories)];

    const allValue = subcategoryMap[cfg.state.language] || "All";
    const sortedSubcategories = [
        allValue,
        ...uniqueSubcategories
            .filter(sc => sc !== allValue)
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    ];

    subcategories = sortedSubcategories;

    if (!found) {
        subcategories = [];
        state.subcategoriesList.innerHTML = '';
        showLocationsViewByID(clickedCategoryId);

    } else {
        subcategories = [...new Set(subcategories)];
        state.subcategoriesList.innerHTML = '';
        subcategories.forEach(subcategory => {
            if (cfg.state.language === "EN") {
                if (!isItEnglish(subcategory)) return;
            } else if (cfg.state.language === "AR") {
                if (!isItArabic(subcategory)) return;
            } else if (cfg.state.language === "ZN") {
                if (isItEnglish(subcategory) || isItArabic(subcategory)) return;
            }
            const item = document.createElement('div');
            item.className = 'subcategory-item';
            item.innerHTML = `
                <div class="subcategory-icon"></div>
                <div class="subcategory-label">${subcategory}</div>
            `;

            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (subcategory != "All" && subcategory != "الكل" && subcategory != "All") {
                    showLocationsView(subcategory);
                } else {
                    subcategories = [];
                    state.subcategoriesList.innerHTML = '';
                    showLocationsViewByID(clickedCategoryId);
                }
            });

            state.subcategoriesList.appendChild(item);
        });

        if (state.categoriesSection) state.categoriesSection.style.display = 'none';
        if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
        if (state.subcategoriesView) state.subcategoriesView.style.display = 'block';
        if (state.locationsView) state.locationsView.style.display = 'none';
        if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
        if (state.directionsView) state.directionsView.style.display = 'none';
        if (state.navigationView) state.navigationView.style.display = 'none';
    }
}

function populateLocationSearch(query) {
    populateLocationsByName(query);
    if (state.categoriesSection) state.categoriesSection.style.display = 'none';
    if (state.searchSectionCategories) state.searchSectionCategories.style.display = 'none';
    if (state.subcategoriesView) state.subcategoriesView.style.display = 'none';
    if (state.locationsView) state.locationsView.style.display = 'block';
    if (state.locationDetailsView) state.locationDetailsView.style.display = 'none';
    if (state.directionsView) state.directionsView.style.display = 'none';
    if (state.navigationView) state.navigationView.style.display = 'none';
}

function populateLocations(subcategoryName) {
    let locations = [];
    var language = cfg.state.language;
    cfg.state.allPoiGeojson.features.forEach((feature) => {
        const { subcategories = [], location } = feature.properties;

        const matchesSubcategory = subcategories.includes(subcategoryName);
        const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

        if (matchesSubcategory && matchesTerminal) {
            feature.properties = mapTranslator.translatePOIProperties(feature);
            locations.push(feature);
        }
    });

    if (locations.length < 1) {
        document.getElementById("NoResultsFound").style.display = "block";
    } else {
        document.getElementById("NoResultsFound").style.display = "none";
    }

    state.locationsList.innerHTML = '';

    sortLocationsByLang(locations, language);

    locations.forEach(location => {
        var icon = location?.properties?.iconUrl
            ? location.properties.iconUrl
            : "./src/images/missingpoi.png";
        var title = getPOITitleByLang(location.properties, language);
        var poiTerminalLocation = cfg.state.terminalTranslations[language][location.properties.location];
        var poiLevel = cfg.state.floorsNames[language][location.properties.level];
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <div class="location-icon">
                <img style="width: 40px;" border-radius: 5px; src="${icon}" />
            </div>
            <div class="location-details">
                <div class="location-name">${title}</div>
                <div class="location-address">${poiTerminalLocation} - ${poiLevel}</div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Location clicked', location);
            showLocationDetailsView(location);
        });

        state.locationsList.appendChild(item);
    });
}

function populateLocationsByID(categoryID) {
    let locations = [];

    cfg.state.allPoiGeojson.features.forEach((feature) => {
        const { category_id, location } = feature.properties;

        const matchesCategory = category_id === categoryID;
        const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

        if (matchesCategory && matchesTerminal) {
            feature.properties = mapTranslator.translatePOIProperties(feature);
            locations.push(feature);
        }
    });
    if (locations.length < 1) {
        document.getElementById("NoResultsFound").style.display = "block";
    } else {
        document.getElementById("NoResultsFound").style.display = "none";
    }

    state.locationsList.innerHTML = '';

    sortLocationsByLang(locations, cfg.state.language);
    locations.forEach(location => {
        var icon = location?.properties?.iconUrl
            ? location.properties.iconUrl
            : "./src/images/missingpoi.png";
        var title = getPOITitleByLang(location.properties, cfg.state.language);
        var language = cfg.state.language;
        var poiTerminalLocation = cfg.state.terminalTranslations[language][location.properties.location];
        var poiLevel = cfg.state.floorsNames[language][location.properties.level];
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <div class="location-icon">
                <img style="width: 40px; border-radius: 5px;" src="${icon}" />
            </div>
            <div class="location-details">
                <div class="location-name">${title}</div>
                <div class="location-address">${poiTerminalLocation} - ${poiLevel}</div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            showLocationDetailsView(location);
        });

        state.locationsList.appendChild(item);
    });
}

function populateLocationDetails(location) {
    if (!state.locationInfo) return;

    var language = cfg.state.language;
    var amenities = [];
    console.log("CHECK : ", location?.properties);
    if (language == "EN") {
        amenities = getEnglishOnly(location?.properties?.subcategories);
    } else if (language == "AR") {
        amenities = getArabicOnly(location?.properties?.subcategories);
    } else if (language == "ZN") {
        amenities = getChineseOnly(location?.properties?.subcategories);
    }

    if (state.categoryItem != null) {
        amenities.push(state.categoryItem);
    }

    console.log("amenities size : " + amenities.length);
    var display = "block";
    if (amenities.length < 1) {
        display = "none";
    } else {
        display = "block";
    }
    var title = getPOITitleByLang(location?.properties, cfg.state.language);
    const [fromLng, fromLat] = parseCenter(location?.properties.center);
    var icon = location?.properties?.iconUrl
        ? location.properties.iconUrl
        : "./src/images/missingpoi.png";
    var poiTerminalLocation = cfg.state.terminalTranslations[language][location?.properties.location];
    markers.flyToPointA(fromLng, fromLat);
    mapc.switchFloorByNo(location?.properties.level);
    state.locationInfo.innerHTML = `
        <div class="location-title-with-icon">
            <div class="location-text-column">
            <div class="location-title">${title}</div>
            <div class="location-subtitle">${poiTerminalLocation}</div>
            </div>
            <div class="location-icon-column">
            <img src="${icon}" class="location-icon-img" alt="POI Icon" />
            </div>
        </div>

        <div class="location-amenities" style="display: ${display};">
            <div class="amenities-title">Categories</div>
            <div class="amenities-list">
            ${amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
            </div>
        </div>

        <div class="location-actions">
            <button class="action-button primary-button" onclick="cfg.state.airportMenu.showDirectionsView(cfg.state.airportMenu.currentLocation)">
            Start Directions
            </button>
        </div>
        `;
}

function populateDirections(location) {
    const routeSummary = document.getElementById('routeSummary');
    if (!routeSummary) return;

    routeSummary.innerHTML = `
        <div class="route-info">
            <div class="route-time">4 minutes</div>
            <div class="route-distance">0.3 miles</div>
        </div>
        <div class="route-difficulty">Easy</div>
        <div class="path-visualization">
            <svg class="path-svg" viewBox="0 0 300 120">
                <!-- Start marker -->
                <circle class="path-marker start" cx="20" cy="60" r="8"/>
                <!-- Path line -->
                <path class="path-line" d="M 28 60 Q 150 30 272 60" stroke-dasharray="5,5"/>
                <!-- End marker -->
                <circle class="path-marker end" cx="280" cy="60" r="8"/>
            </svg>
        </div>
    `;
}

function populateNavigation() {
    const navigationProgress = document.getElementById('navigationProgress');
    const currentInstruction = document.getElementById('currentInstruction');
    const stepsContainer = document.getElementById('stepsContainer');

    if (navigationProgress) {
        navigationProgress.textContent = `Step ${state.currentStep + 1} / ${state.totalSteps}`;
    }

    if (currentInstruction) {
        const step = state.navigationSteps[state.currentStep];
        currentInstruction.innerHTML = `
            <div class="instruction-icon">${step.icon}</div>
            <div class="instruction-text">${step.text}</div>
            <div class="instruction-distance">${step.distance}</div>
        `;
    }

    if (stepsContainer) {
        stepsContainer.innerHTML = '';
        state.navigationSteps.forEach((step, index) => {
            const stepItem = document.createElement('div');
            stepItem.className = 'step-item';

            let stepClass = 'upcoming';
            if (index < state.currentStep) stepClass = 'completed';
            else if (index === state.currentStep) stepClass = 'current';

            stepItem.innerHTML = `
                <div class="step-number ${stepClass}">${index + 1}</div>
                <div class="step-content">
                    <div class="step-text">${step.text}</div>
                    <div class="step-distance">${step.distance}</div>
                </div>
            `;

            stepsContainer.appendChild(stepItem);
        });
    }

    if (state.nextStepBtn) {
        state.nextStepBtn.disabled = state.currentStep >= state.totalSteps - 1;
    }
}

function nextNavigationStep() {
    if (state.currentStep < state.totalSteps - 1) {
        state.currentStep++;
        populateNavigation();
    }
}

function handleDragEnd() {
    if (!state.startY || !state.currentY) return;

    const deltaY = state.startY - state.currentY;

    if (Math.abs(deltaY) > state.dragThreshold) {
        if (deltaY > 0) {
            handleUpwardDrag();
        } else {
            handleDownwardDrag();
        }
    }
}

function handleUpwardDrag() {
    switch (state.currentState) {
        case 'search-only':
            state.currentState = 'partial';
            break;
        case 'partial':
            state.currentState = 'full';
            break;
    }
    updateLayout();
}

function handleDownwardDrag() {
    switch (state.currentState) {
        case 'full':
            state.currentState = 'partial';
            break;
        case 'partial':
            state.currentState = 'search-only';
            break;
    }
    updateLayout();
}

function handleScrollDetection() {
    handleUpwardDrag();
}

function handleUpwardScroll() {
    handleUpwardDrag();
}

function toggleMobileState() {
    if (state.isDesktop) return;

    if (state.currentState === 'search-only') {
        state.currentState = 'partial';
    } else if (state.currentState === 'partial') {
        state.currentState = 'full';
    } else {
        state.currentState = 'search-only';
    }
    updateLayout();
}

function toggleDesktopMenu() {
    if (!state.isDesktop) return;

    state.isExpanded = !state.isExpanded;
    updateLayout();
}

function updateLayout() {
    if (!state.menuContainer) return;

    if (state.isDesktop) {
        state.menuContainer.classList.remove('mobile-search-only', 'mobile-partial', 'mobile-full');

        if (state.isExpanded) {
            state.menuContainer.classList.remove('desktop-collapsed');
            state.menuContainer.classList.add('desktop-expanded');
        } else {
            state.menuContainer.classList.remove('desktop-expanded');
            state.menuContainer.classList.add('desktop-collapsed');
        }
    } else {
        state.menuContainer.classList.remove('desktop-collapsed', 'desktop-expanded');
        state.menuContainer.classList.remove('mobile-search-only', 'mobile-partial', 'mobile-full');
        state.menuContainer.classList.add(`mobile-${state.currentState.replace('-', '-')}`);
    }

    updateArrowDirection();
}

function updateArrowDirection() {
    if (!state.menuArrow) return;

    if (state.isDesktop) {
        if (state.isExpanded) {
            state.menuArrow.classList.add('expanded');
        } else {
            state.menuArrow.classList.remove('expanded');
        }
    } else {
        if (state.currentState === 'full') {
            state.menuArrow.classList.add('expanded');
        } else {
            state.menuArrow.classList.remove('expanded');
        }
    }
}

export { init, setCurrentLocation, clearLocations, showDirectionsView, showCompleteDirectionsInterface, endNavigation, showPopularDepartureLocations, selectDepartureLocation, showCategoriesView, showLocationsView, populateLocationsByName, populatePopularLocationsByName, populatePopularLocations, populateSubcategories, populateLocationSearch, populateLocations, populateLocationsByID, populateLocationDetails, populateDirections, populateNavigation, nextNavigationStep, getLocationIcon, handleDragEnd, handleUpwardDrag, handleDownwardDrag, handleScrollDetection, handleUpwardScroll, toggleMobileState, toggleDesktopMenu, updateLayout, updateArrowDirection, showNavigationSteps, displayNavigationSteps, hideNavigationSteps, populateCleanNavigationSteps, highlightRouteSegment };


