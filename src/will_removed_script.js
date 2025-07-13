
// Airport Menu Component - Interactive Functionality

(function () {
    'use strict';

    // Ensure we don't redeclare if already exists
    if (window.AirportMenuComponent) {
        return;
    }
    import('/src/config.js').then(cfg => window.cfg = cfg);
    import('/src/data/routes.js').then(route => {
        window.route = route;
    }).catch(err => {
        console.error('Failed to load route:', err);
    });

    import('/src/mapController.js').then(mapc => {
        window.mapc = mapc;
    }).catch(err => {
        console.error('Failed to load route:', err);
    });

    import('/src/navigation.js').then(navigation => {
        window.navigation = navigation;
    }).catch(err => {
        console.error('Failed to load route:', err);
    });

    import('/src/markers.js').then(markers => {
        window.markers = markers;
    }).catch(err => {
        console.error('Failed to load markers:', err);
    });

    import('/src/mapInit.js').then(mapInit => {
        window.mapInit = mapInit;
    }).catch(err => {
        console.error('Failed to load markers:', err);
    });


    import('/src/i18n/mapTranslator.js').then(mapTranslator => {
        window.mapTranslator = mapTranslator.mapTranslator;
    }).catch(err => {
        console.error('Failed to load mapTranslator:', err);
    });



    const toggle = document.getElementById('legendToggle');
    const panel = document.getElementById('legendPanel');

    toggle.addEventListener('click', () => {
        panel.classList.toggle('show');
    });

    const TerminalsDropdownListBtn = document.getElementById('TerminalsDropdownListBtn');
    TerminalsDropdownListBtn.addEventListener('click', () => {
        toggleDropdown();
    });

    const dropdownList = document.getElementById("dropdownList");
    const dropdownSubtitle = document.querySelector(".dropdown-subtitle");
    const options = dropdownList.querySelectorAll(".dropdown-option");
    options.forEach(option => {
        option.addEventListener("click", function () {
            const selectedTerminal = option.getAttribute("data-terminal-id");
            dropdownSubtitle.textContent = selectedTerminal;

            // Hide the dropdown list after selection
            dropdownList.classList.remove("show");

            // Optional: log or use the value
            //console.log("Selected terminal:", selectedTerminal);

            if (selectedTerminal == "All") {
                cfg.state.selectedTerminal = null
            } else {
                cfg.state.selectedTerminal = selectedTerminal
                mapc.flyToTerminal(selectedTerminal);
            }

        });
    });
    function toggleDropdown() {
        const list = document.getElementById('dropdownList');
        list.classList.toggle('show');
    }

    // Optional: close dropdown on outside click
    document.addEventListener('click', function (event) {
        const dropdown = document.querySelector('.dropdown');
        const list = document.getElementById('dropdownList');
        if (!dropdown.contains(event.target)) {
            list.classList.remove('show');
        }
    });

    class AirportMenuComponent {
        constructor() {
            this.menuContainer = document.getElementById('menuContainer');
            this.menuArrow = document.getElementById('menuArrow');

            // Main sections
            this.categoriesSection = document.getElementById('categoriesSection');
            this.subcategoriesView = document.getElementById('subcategoriesView');
            this.locationsView = document.getElementById('locationsView');
            this.locationDetailsView = document.getElementById('locationDetailsView');
            this.directionsView = document.getElementById('directionsView');
            this.navigationView = document.getElementById('navigationView');

            // Search elements
            this.searchInput = document.getElementById('searchInput');
            this.searchSectionCategories = document.getElementById("searchSectionCategories");

            // Navigation elements
            this.subcategoriesBackBtn = document.getElementById('subcategoriesBackBtn');
            this.locationsBackBtn = document.getElementById('locationsBackBtn');
            this.locationDetailsBackBtn = document.getElementById('locationDetailsBackBtn');
            this.directionsBackBtn = document.getElementById('directionsBackBtn');
            this.subcategoriesTitle = document.getElementById('subcategoriesTitle');
            this.locationsTitle = document.getElementById('locationsTitle');
            this.subcategoriesList = document.getElementById('subcategoriesList');
            this.locationsList = document.getElementById('locationsList');
            this.locationInfo = document.getElementById('locationInfo');
            this.startNavigationBtn = document.getElementById('startNavigationBtn');
            this.nextStepBtn = document.getElementById('nextStepBtn');
            this.endNavigationBtn = document.getElementById('endNavigationBtn');

            this.currentState = 'search-only'; // search-only, partial, full
            this.currentView = 'categories'; // categories, subcategories, locations, location-details, directions, navigation
            this.isDesktop = window.innerWidth > 768;
            this.isExpanded = false; // Start collapsed on desktop
            this.currentCategory = null;
            this.currentSubcategory = null;
            this.currentLocation = null;
            this.currentStep = 0;
            this.totalSteps = 7;
            this.categoryItem;
            // Touch/drag variables
            this.startY = 0;
            this.currentY = 0;
            this.isDragging = false;
            this.dragThreshold = 50;

            // Subcategories data
            this.subcategoriesData = {
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

            // Locations data
            this.locationsData = {
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

            // Navigation steps data
            this.navigationSteps = [
                { text: 'Start at your current location', distance: '57 feet', icon: '🔘' },
                { text: 'Head toward Security Checkpoint B', distance: '72 feet', icon: '↱' },
                { text: 'Take escalator to Level 3', distance: '108 feet', icon: '↑' },
                { text: 'Continue straight past Gate B12', distance: '156 feet', icon: '→' },
                { text: 'Turn left at the main corridor', distance: '89 feet', icon: '↰' },
                { text: 'Walk past the duty-free shop', distance: '134 feet', icon: '→' },
                { text: 'Arrive at Starbucks on your right', distance: '0 feet', icon: '🏁' }
            ];

            // console.log('AirportMenuComponent initialized', {
            //     isDesktop: this.isDesktop,
            //     menuContainer: !!this.menuContainer,
            //     categoriesSection: !!this.categoriesSection,
            //     subcategoriesView: !!this.subcategoriesView,
            //     locationsView: !!this.locationsView
            // });

            this.init();
        }

        init() {
            this.updateLayout();
            this.setupEventListeners();
            this.setupNavigationSystem();
            this.showCategoriesView();
        }

        setupEventListeners() {
            // Arrow click functionality
            if (this.menuArrow) {
                this.menuArrow.addEventListener('click', (e) => {
                    e.preventDefault();
                    //console.log('Menu arrow clicked');
                    if (this.isDesktop) {
                        this.toggleDesktopMenu();
                    } else {
                        this.toggleMobileState();
                    }
                });
            }

            // Search functionality
            this.setupSearchInteractions();

            // Subcategories functionality
            this.setupSubcategoriesInteractions();

            // Mobile touch/drag functionality
            this.setupMobileInteractions();

            // Scroll detection for mobile
            this.setupScrollDetection();

            // Window resize handler
            window.addEventListener('resize', () => {
                this.isDesktop = window.innerWidth > 768;
                this.updateLayout();
            });
        }

        setupSubcategoriesInteractions() {
            // Menu item clicks for subcategories
            this.setupMenuItemClicks();

            // Back button handlers
            if (this.subcategoriesBackBtn) {
                this.subcategoriesBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showCategoriesView();
                });
            }

            if (this.locationsBackBtn) {
                this.locationsBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.currentSubcategory != null) {
                        this.showSubcategoriesView(this.currentCategory);
                    } else {
                        this.showCategoriesView();
                        document.getElementById("menuArrow").style.display = "flex";
                    }
                });
            }

            if (this.locationDetailsBackBtn) {
                this.locationDetailsBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.currentSubcategory != null) {
                        console.error("this.currentSubcategory : ", this.currentSubcategory);
                        this.showLocationsView(this.currentSubcategory);
                        document.getElementById("menuArrow").style.display = "none";
                    } else {
                        this.showCategoriesView();
                        this.isExpanded = false;
                        document.getElementById("menuArrow").style.display = "flex";
                    }
                });
            }

            if (this.directionsBackBtn) {
                this.directionsBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const departureContainer = document.getElementsByClassName("departure-input-container")[0];
                    const destinationContainer = document.getElementsByClassName("destination-container")[0];
                    const directionsSearchBox = document.getElementsByClassName("direction-search-box")[0];
                    directionsSearchBox.style.display = "flex";
                    departureContainer.style.display = "block";
                    destinationContainer.style.display = "block";
                    console.log("ENDED NAVIGATION" ,this.currentLocation );
                    this.showLocationDetailsView(this.currentLocation);
                    mapc.clearRoute();
                    document.getElementById("stepsButton").innerHTML = `Show Steps`;
                });
            }

            if (this.startNavigationBtn) {
                this.startNavigationBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showNavigationView();
                });
            }

            if (this.nextStepBtn) {
                this.nextStepBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.nextNavigationStep();
                });
            }

            // if (this.endNavigationBtn) {
            //     this.endNavigationBtn.addEventListener('click', (e) => {
            //         e.preventDefault();
            //         this.endNavigation();
            //     });
            // }

            // New directions interface event handlers
            const departureInput = document.getElementById('departureInput');
            if (departureInput) {
                departureInput.addEventListener('click', (e) => {
                    e.preventDefault();
                    //this.showPopularLocationsView();
                });
            }

            const popularLocationsBackBtn = document.getElementById('popularLocationsBackBtn');
            if (popularLocationsBackBtn) {
                popularLocationsBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showCategoriesView(this.currentLocation);
                });
            }
        }

        setCurrentLocation(location) {
            cfg.state.airportMenu.currentLocation = location;
        }

        clearLocations() {
            cfg.state.airportMenu.departureLocation = null;
            cfg.state.airportMenu.currentLocation = null;
        }

        setupMenuItemClicks() {
            const menuItems = document.querySelectorAll('.category-item');
            menuItems.forEach((item, index) => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryName = item.querySelector('.category-label').textContent;
                    this.categoryItem = categoryName;
                    //if (this.hasSubcategories(categoryName)) {
                    this.showSubcategoriesView(categoryName);
                    //}
                });
            });
        }

        setupSearchInteractions() {
            if (this.searchInput) {
                this.searchInput.addEventListener('focus', () => {
                    const query = e.target.value.trim();
                    if (query.length > 0) {
                        this.currentSubcategory = null;
                        this.categoryItem = null;
                        this.populateLocationSearch(query);
                        this.expandMenu();
                        document.getElementById("menuArrow").style.display = "none";
                    } else {
                        this.showCategoriesView();
                        document.getElementById("menuArrow").style.display = "flex";
                    }
                });

                this.searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    if (query.length > 0) {
                        this.currentSubcategory = null;
                        this.categoryItem = null;
                        this.populateLocationSearch(query);
                        this.expandMenu();
                        document.getElementById("menuArrow").style.display = "none";
                    } else {
                        this.showCategoriesView();
                        document.getElementById("menuArrow").style.display = "flex";
                    }
                });
            }
        }

        setupMobileInteractions() {
            if (!this.menuContainer) return;

            this.menuContainer.addEventListener('touchstart', (e) => {
                if (this.isDesktop) return;
                this.startY = e.touches[0].clientY;
                this.isDragging = true;
            }, { passive: true });

            this.menuContainer.addEventListener('touchmove', (e) => {
                if (!this.isDragging || this.isDesktop) return;
                this.currentY = e.touches[0].clientY;
            }, { passive: true });

            this.menuContainer.addEventListener('touchend', () => {
                if (!this.isDragging || this.isDesktop) return;
                this.handleDragEnd();
                this.isDragging = false;
            }, { passive: true });
        }

        setupScrollDetection() {
            let scrollTimeout;
            let scrollCount = 0;

            window.addEventListener('scroll', () => {
                if (this.isDesktop) return;

                clearTimeout(scrollTimeout);
                scrollCount++;

                scrollTimeout = setTimeout(() => {
                    if (scrollCount > 0) {
                        this.handleScrollDetection();
                    }
                    scrollCount = 0;
                }, 100);
            }, { passive: true });

            window.addEventListener('wheel', (e) => {
                if (this.isDesktop) return;

                if (e.deltaY < 0) {
                    this.handleUpwardScroll();
                }
            }, { passive: true });
        }

        setupNavigationSystem() {
            // Initialize navigation system components
            // console.log('Navigation system initialized');
        }

        hasSubcategories(categoryName) {
            return this.subcategoriesData.hasOwnProperty(categoryName);
        }

        showCategoriesView() {
            //console.log('Showing categories view');
            this.currentView = 'categories';

            if (this.categoriesSection) this.categoriesSection.style.display = 'block';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'block';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';

            // Restore menu arrow visibility when returning to categories view
            const menuArrow = document.getElementById('menuArrow');
            if (menuArrow) {
                menuArrow.style.display = 'flex';
            }

            // Restore proper container sizing for categories view
            if (this.menuContainer) {
                // Check if menu is expanded and set appropriate height
                if (this.isExpanded || this.menuContainer.classList.contains('desktop-expanded')) {
                    this.menuContainer.style.maxHeight = '785px';
                } else {
                    this.menuContainer.style.maxHeight = '250px';
                }
            }
            this.expandMenu();
        }

        // Auto-expand menu when clicking categories, subcategories, or locations
        expandMenu() {
            if (this.isMobile) return; // Only for desktop

            this.isExpanded = true;
            this.menuContainer.classList.add('desktop-expanded');
            this.menuContainer.classList.remove('desktop-collapsed');
            this.updateArrowDirection();
        }

        showSubcategoriesView(categoryName) {
            //console.log('1 - Showing subcategories view for', categoryName);
            this.currentView = 'subcategories';
            this.currentCategory = categoryName;

            // Auto-expand menu
            this.expandMenu();

            if (this.subcategoriesTitle) {
                this.subcategoriesTitle.textContent = categoryName;
            }

            this.populateSubcategories(categoryName);

            // Hide menu arrow in subcategories view and adjust container
            const menuArrow = document.getElementById('menuArrow');
            if (menuArrow) {
                menuArrow.style.display = 'none';
            }

            // Show subcategories view and hide others
            // if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            // if (this.subcategoriesView) this.subcategoriesView.style.display = 'block';
            // if (this.locationsView) this.locationsView.style.display = 'none';
            // if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            // if (this.directionsView) this.directionsView.style.display = 'none';
            // if (this.navigationView) this.navigationView.style.display = 'none';

            // Adjust container height to fit content
            if (this.menuContainer) {
                this.menuContainer.style.maxHeight = 'fit-content';
            }
        }

        showLocationsViewByID(categoryID) {
            //console.log('Showing locations view for', subcategoryName);
            this.currentView = 'locations';
            this.currentSubcategory = null;

            // Auto-expand menu
            this.expandMenu();

            this.populateLocationsByID(categoryID);

            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'block';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';
        }

        showLocationDetailsView(location) {
            console.log('Showing location details view for', location);
            this.currentView = 'location-details';
            this.currentLocation = location;
            console.log("showLocationDetailsView :",this.currentLocation)

            // Auto-expand menu
            this.expandMenu();

            this.populateLocationDetails(location);

            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'block';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';
        }

        showDirectionsView(location) {
            this.currentView = 'directions';
            this.currentLocation = location;
            // Set destination
            const destinationText = document.getElementById('destinationInput');
            if (destinationText && location) {
                destinationText.value = getPOITitleByLang(location.properties, cfg.state.language) || 'Selected Location';
                destinationText.disabled = true;
            }

            // Hide search bar when showing directions
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }

            // Also hide the main search input
            const searchInput = document.querySelector('input[placeholder="Search..."]');
            if (searchInput) {
                searchInput.style.display = 'none';
            }

            // Setup departure input search functionality
            this.setupDepartureSearch();

            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'block';
            if (this.navigationView) this.navigationView.style.display = 'none';

            // Hide popular locations view if it exists
            const popularView = document.getElementById('popularLocationsView');
            if (popularView) popularView.style.display = 'none';
        }

        setupDepartureSearch() {
            const departureInput = document.getElementById('departureInput');
            const departureResults = document.getElementById('departureResults');

            if (!departureInput || !departureResults) return;

            // Handle input events for search
            departureInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    this.showPopularLocationsView();
                    this.populatePopularLocationsByName(query);
                } else {
                    departureResults.style.display = 'none';
                }
            });

            // Handle focus to show popular locations
            departureInput.addEventListener('focus', () => {
                if (departureInput.value.trim() === '') {
                    //this.showPopularDepartureLocations();
                }
            });

            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!departureInput.contains(e.target) && !departureResults.contains(e.target)) {
                    //departureResults.style.display = 'none';
                }
            });
        }



        getLocationIcon(category) {
            const icons = {
                'food': '🥡',
                'drinks': '☕',
                'services': '💳',
                'security': '🛡️',
                'baggage': '🧳',
                'transportation': '🚌',
                'parking': '🅿️',
                'default': '📍'
            };
            return icons[category] || icons['default'];
        }

        // selectDepartureLocation(departureLocation) {
        //      console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXX', departureLocation);
        //     console.log('Selected departure location:', departureLocation);

        //     // Set the departure input value
        //     const departureInput = document.getElementById('departureInput');
        //     if (departureInput) {
        //         departureInput.value = departureLocation.name;
        //     }

        //     // Hide search results
        //     const departureResults = document.getElementById('departureResults');
        //     if (departureResults) {
        //         departureResults.style.display = 'none';
        //     }

        //     // Show the complete directions interface
        //     this.showCompleteDirectionsInterface(departureLocation);
        // }

        // Updated showCompleteDirectionsInterface function
        showCompleteDirectionsInterface(departureLocation) {
            console.log('Showing complete directions interface for:', departureLocation , this.currentLocation);

            // Ensure we're in the directions view
            this.currentView = 'directions';

            // Show directions view
            if (this.directionsView) {
                this.directionsView.style.display = 'block';
            }

            // Hide other views
            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';

            // Hide search bar and departure results
            const searchContainer = document.querySelector('.search-container');
            const searchInput = document.querySelector('input[placeholder="Search..."]');
            const departureResults = document.getElementById('departureResults');
            const popularView = document.getElementById('popularLocationsView');

            if (searchContainer) searchContainer.style.display = 'none';
            if (searchInput) searchInput.style.display = 'none';
            if (departureResults) departureResults.style.display = 'none';
            if (popularView) popularView.style.display = 'none';

            // Show back button and header controls
            const backBtn = document.getElementById('directionsBackBtn');
            const headerOptions = document.querySelector('.header-options');
            const accessibilityToggle = document.querySelector('.accessibility-toggle');
            const optionsMenu = document.querySelector('.options-menu');

            if (backBtn) backBtn.style.display = 'block';
            if (headerOptions) headerOptions.style.display = 'flex';
            if (accessibilityToggle) accessibilityToggle.style.display = 'block';
            if (optionsMenu) optionsMenu.style.display = 'block';

            const [fromLng, fromLat] = parseCenter(departureLocation.properties.center);
            const [toLng, toLat] = parseCenter(this.currentLocation.properties.center);

            route.drawPathToPoi(
                departureLocation.properties.title,
                fromLng,
                fromLat,
                departureLocation.properties.level,
                this.currentLocation.properties.title,
                toLng,
                toLat,
                this.currentLocation.properties.level
            );
            // Replace departure input with selected departure display
            // const departureContainer = document.querySelector('.destination-container');
            // if (departureContainer) {
            //     const icon = this.getLocationIcon(departureLocation.type || departureLocation.category || 'default');
            //     departureContainer.innerHTML = `
            //         <div class="selected-departure">
            //             <span class="destination-text">${departureLocation.properties.title}</span>
            //         </div>
            //     `;
            // }

            // // Update destination to show current location with proper styling
            // const destinationContainer = document.querySelector('.destination-container');
            // if (destinationContainer && this.currentLocation) {
            //     console.log(this.currentLocation.properties.title);
            //     destinationContainer.innerHTML = `
            //     <div class="destination-text"><input type="text" class="departure-input" id="destinationInput" placeholder="Choose Destination" disabled="" value = "${this.currentLocation.properties.title}"></div>`;
            // }

            // Show "Add destination" section
            const addDestination = document.querySelector('.add-destination');
            if (addDestination) {
                addDestination.style.display = 'flex';
            }

            // Show route summary with time estimate and steps button
            const routeSummary = document.getElementById('routeSummary');
            if (routeSummary) {
                routeSummary.style.display = 'block';

                // Update time estimate (you can calculate this based on distance)
                // const timeValue = document.querySelector('.time-value');
                // if (timeValue) {
                //     // Calculate estimated time based on locations
                //     const estimatedTime = this.calculateTravelTime(departureLocation, this.currentLocation);
                //     timeValue.textContent = `${estimatedTime} minutes`;
                // }

                // Add event listener for Steps button
                const stepsButton = document.getElementById('stepsButton');
                if (stepsButton) {
                    stepsButton.removeEventListener('click', this.handleStepsClick); // Remove old listener
                    this.handleStepsClick = () => {
                        this.showNavigationSteps(departureLocation, this.currentLocation);
                    };
                    stepsButton.addEventListener('click', this.handleStepsClick);
                }

                const endroutebtn = document.getElementById('endRoutebtn');
                endroutebtn.removeEventListener('click', this.handleEndRouteClick); // Remove old listener
                this.handleEndRouteClick = () => {
                    mapc.clearRoute();
                    document.getElementById("directionsBackBtn").click();
                };
                endroutebtn.addEventListener('click', this.handleEndRouteClick);
            }

            // Show journey breakdown
            const journeyBreakdown = document.querySelector('.journey-breakdown');
            if (journeyBreakdown) {
                journeyBreakdown.style.display = 'none';
            }

            // Store the selected departure
            this.selectedDeparture = departureLocation;

            // Setup back button functionality
            if (backBtn) {
                backBtn.removeEventListener('click', this.handleBackClick); // Remove old listener
                this.handleBackClick = () => {
                    routeSummary.style.display = 'none';
                    const departureInput = document.getElementById('departureInput');
                    if (departureInput) {
                        departureInput.value = "";
                    }

                    const destinationInput = document.getElementById('destinationInput');
                    if (destinationInput) {
                        destinationInput.value = "";
                    }
                    this.showLocationDetailsView(this.currentLocation);
                };
                backBtn.addEventListener('click', this.handleBackClick);
            }

            // Setup swap locations functionality
            const swapBtn = document.getElementById('swapIcon');
            if (swapBtn) {
                swapBtn.removeEventListener('click', this.handleSwapClick); // Remove old listener
                this.handleSwapClick = () => {
                    this.swapDepartureDestination();
                }
                swapBtn.addEventListener('click', this.handleSwapClick);
            }
        }

        // Helper function to calculate travel time
        calculateTravelTime(from, to) {
            // Simple calculation - you can make this more sophisticated
            if (window.AIRPORT_DATA) {
                const path = window.AIRPORT_DATA.getPathBetween(from.id, to.id);
                if (path && path.duration) {
                    return path.duration;
                }
            }

            // Default estimate
            return Math.floor(Math.random() * 10) + 5; // 5-15 minutes
        }

        // Helper function to swap departure and destination
        swapDepartureDestination() {
            // Prevent swap if either is null or undefined
            if (!this.selectedDeparture || !this.currentLocation) {
                console.warn('Swap aborted: selectedDeparture or currentLocation is null');
                return;
            }

            const temp = this.selectedDeparture;
            this.selectedDeparture = this.currentLocation;
            this.currentLocation = temp;

            const departureInput = document.getElementById('departureInput');
            if (departureInput) {
                departureInput.value = getPOITitleByLang(this.selectedDeparture.properties, cfg.state.language);
                departureInput.classList.add('filled');
            }

            const destinationInput = document.getElementById('destinationInput');
            if (destinationInput) {
                destinationInput.value = getPOITitleByLang(this.currentLocation.properties, cfg.state.language);
                destinationInput.classList.add('filled');
            }

            this.showCompleteDirectionsInterface(this.selectedDeparture);
        }

        // Helper function to get location icons
        getLocationIcon(type) {
            const icons = {
                'starbucks': '☕',
                'panda': '🥡',
                'amex': '💳',
                'burger': '🍔',
                'duty_free': '🛍️',
                'food': '🍽️',
                'shops': '🛍️',
                'services': '🏪',
                'default': '📍'
            };
            return icons[type] || icons['default'];
        }


        // Updated JavaScript functions for clean navigation HTML structure

        // Replace your existing showNavigationSteps function with this:
        showNavigationSteps() {
            //console.log('Toggling navigation steps view');

            // Check if navigation view is currently visible
            const isNavigationVisible = this.navigationView &&
                this.navigationView.style.display === 'block';

            if (isNavigationVisible) {
                // Hide navigation steps and show directions interface
                this.hideNavigationSteps();
            } else {
                // Show navigation steps and hide directions interface
                this.displayNavigationSteps();
            }
        }

        // Replace your existing displayNavigationSteps function with this:
        displayNavigationSteps() {
            // console.log('Displaying navigation steps');

            // Update current view state
            this.currentView = 'navigation';

            // Show navigation view
            if (this.navigationView) {
                this.navigationView.style.display = 'block';
            }

            // Hide directions view elements but keep the main directions view visible
            if (this.directionsView) {
                this.directionsView.style.display = 'block';
            }

            // Hide departure and destination containers
            const departureContainer = document.getElementsByClassName("departure-input-container")[0];
            const destinationContainer = document.getElementsByClassName("destination-container")[0];
            const addDestination = document.querySelector('.add-destination');
            const routeSummary = document.getElementById('routeSummary');
            const directionsSearchBox = document.getElementsByClassName("direction-search-box")[0];
            directionsSearchBox.style.display = "none";

            if (departureContainer) departureContainer.style.display = 'none';
            if (destinationContainer) destinationContainer.style.display = 'none';
            if (addDestination) addDestination.style.display = 'none';
            // if (routeSummary) routeSummary.style.display = 'none';

            // Update the Steps button text to indicate it can close
            const stepsButton = document.getElementById('stepsButton');
            if (stepsButton) {
                //         stepsButton.innerHTML = `
                //     Hide Steps
                //     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                //         <path d="M18 6L6 18"></path>
                //         <path d="M6 6l12 12"></path>
                //     </svg>
                // `;
                stepsButton.innerHTML = `Hide Steps`;
                stepsButton.style.background = '#4DA8DA !important'; // Red color for close
            }

            // Populate clean navigation steps list
            this.populateCleanNavigationSteps();
        }

        // Replace your existing hideNavigationSteps function with this:
        hideNavigationSteps() {
            // console.log('Hiding navigation steps');

            // Update current view state
            this.currentView = 'directions';

            // Hide navigation view
            if (this.navigationView) {
                this.navigationView.style.display = 'none';
            }

            // Show directions view elements with timeout to ensure proper display
            setTimeout(() => {
                const departureContainer = document.getElementsByClassName("departure-input-container")[0];
                const destinationContainer = document.getElementsByClassName("destination-container")[0];
                const addDestination = document.querySelector('.add-destination');
                const routeSummary = document.getElementById('routeSummary');
                const directionsSearchBox = document.getElementsByClassName("direction-search-box")[0];

                if (departureContainer) {
                    departureContainer.style.display = 'block';
                    departureContainer.style.visibility = 'visible';
                    directionsSearchBox.style.display = "flex";
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

            // Restore the Steps button text and color
            const stepsButton = document.getElementById('stepsButton');
            if (stepsButton) {
                //         stepsButton.innerHTML = `
                //     Steps
                //     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                //         <path d="M9 18l6-6-6-6"></path>
                //     </svg>
                // `;
                stepsButton.innerHTML = `Show Steps`;
                stepsButton.style.background = '#4DA8DA !important'; // Blue color for steps
            }
        }

        // Replace your existing populateCleanNavigationSteps function with this:
        populateCleanNavigationSteps() {
            // Use the new HTML structure - navigationStepsList instead of stepsContainer
            const navigationStepsList = document.getElementById('navigationStepsList');
            if (!navigationStepsList) {
                console.error('navigationStepsList element not found');
                return;
            }

            const instructions = navigation.generateNavigationInstructions(mapc.smartRoute, cfg.state.language);
            // Clear existing steps
            navigationStepsList.innerHTML = '';

            // Add departure location header with green dot
            if (this.selectedDeparture) {
                const departureHeader = document.createElement('div');
                departureHeader.className = 'location-header';
                departureHeader.innerHTML = `
            <div class="location-dot departure"></div>
            <div class="location-text">${getPOITitleByLang(this.selectedDeparture.properties, cfg.state.language)}</div>
        `;
                navigationStepsList.appendChild(departureHeader);
            }
            // Add each step with clean design and timeline dots
            instructions.forEach((step, index) => {
                const stepElement = document.createElement('div');
                stepElement.className = 'clean-step-item';

                // Add step number as data attribute for potential styling
                stepElement.setAttribute('data-step', index + 1);

                // Different styling for destination step
                if (step.type === 'destination') {
                    stepElement.innerHTML = `
                <div class="clean-step-icon">${step.icon}</div>
                <div class="clean-step-content">
                    <div class="clean-step-text">${step.text}</div>
                    \
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

                stepElement.addEventListener('click', () => {
                    if (step.coordinates.length > 1) {
                        this.highlightRouteSegment(window.mapInit.map, window.mapInit.map.getSource('route')._data, step.coordinates[0], step.coordinates[1], cfg.state.levelRoutePoi, mapc.switchFloorByNo, '#FFB534')
                    } else {
                        markers.flyToPointA(step.coordinates[0][0], step.coordinates[0][1]);
                        this.highlightRouteSegment(window.mapInit.map, window.mapInit.map.getSource('route')._data, step.coordinates[0], step.coordinates[0], cfg.state.levelRoutePoi, mapc.switchFloorByNo, '#FFB534')
                    }
                });

                navigationStepsList.appendChild(stepElement);
            });

            // Add destination location footer with red dot
            if (this.currentLocation) {
                const destinationFooter = document.createElement('div');
                destinationFooter.className = 'location-header';
                destinationFooter.innerHTML = `
            <div class="location-dot destination"></div>
            <div class="location-text">${getPOITitleByLang(this.currentLocation.properties, cfg.state.language)}</div>
        `;
                navigationStepsList.appendChild(destinationFooter);
            }

            // Apply timeline styling
            //this.applyTimelineStyles();
        }



        highlightRouteSegment(map, geojsonData, startCoord, endCoord, levelRoutePoi, switchFloorByOn, highlightColor = '#FF0000') {
            const startStr = startCoord.map(c => Number(c).toFixed(6)).join(',');
            const endStr = endCoord.map(c => Number(c).toFixed(6)).join(',');

            const currentKey = `${startStr}_${endStr}`;

            // Toggle: remove highlight if user clicks again on the same instruction
            if (cfg.state.lastHighlighted === currentKey) {
                if (map.getLayer('highlight-segment-layer')) map.removeLayer('highlight-segment-layer');
                if (map.getSource('highlight-segment')) map.removeSource('highlight-segment');
                if (map.getLayer('highlight-dot-layer')) map.removeLayer('highlight-dot-layer');
                if (map.getSource('highlight-dot')) map.removeSource('highlight-dot');
                cfg.state.lastHighlighted = null;
                return;
            }

            // Remove any existing highlights
            if (map.getLayer('highlight-segment-layer')) map.removeLayer('highlight-segment-layer');
            if (map.getSource('highlight-segment')) map.removeSource('highlight-segment');
            if (map.getLayer('highlight-dot-layer')) map.removeLayer('highlight-dot-layer');
            if (map.getSource('highlight-dot')) map.removeSource('highlight-dot');

            cfg.state.lastHighlighted = currentKey;

            if (startStr !== endStr) {
                // Convert to numbers
                const lng1 = Number(startCoord[0]);
                const lat1 = Number(startCoord[1]);
                const lng2 = Number(endCoord[0]);
                const lat2 = Number(endCoord[1]);

                // Calculate bearing
                const point1 = turf.point([lng1, lat1]);
                const point2 = turf.point([lng2, lat2]);
                const bearing = turf.bearing(point1, point2);

                // Midpoint
                const center = [(lng1 + lng2) / 2, (lat1 + lat2) / 2];

                map.flyTo({
                    center: center,
                    bearing: bearing,
                    zoom: map.getZoom(), // or custom zoom level
                    speed: 1.2,
                    pitch: 60,
                    duration: 3000
                });
            }
            // === CASE: Same start and end => draw dot ===
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
                map.moveLayer("arrow-layer")
                return;
            }

            // === CASE: Find segment between points ===
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
            // === Check level and switch if needed ===
            if (segmentLevel !== null && segmentLevel !== levelRoutePoi) {
                if (segmentLevel == 0) {
                    segmentLevel = "G";
                }
                switchFloorByOn(segmentLevel);
            }

            // === Highlight Line Segment ===
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
            map.moveLayer("arrow-layer")

        }

        // Remove or comment out the old populateNavigation function since it's no longer needed
        // The old function used stepsContainer, navigationProgress, currentInstruction, nextStepBtn
        // which are all removed in the new clean design

        // Replace your existing endNavigation function with this enhanced version:
        endNavigation() {

            // Reset navigation state
            this.currentStep = 0;
            this.currentView = 'categories';

            // Hide navigation view
            if (this.navigationView) {
                this.navigationView.style.display = 'none';
            }

            // Ensure all direction elements are restored with timeout
            setTimeout(() => {
                const departureContainer = document.getElementsByClassName("departure-input-container")[0];
                const destinationContainer = document.getElementsByClassName("destination-container")[0];
                const addDestination = document.querySelector('.add-destination');
                const routeSummary = document.getElementById('routeSummary');
                const directionsSearchBox = document.getElementsByClassName("direction-search-box")[0];

                if (departureContainer) {
                    departureContainer.style.display = 'block';
                    departureContainer.style.visibility = 'visible';
                    directionsSearchBox.style.display = "flex";
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

                // Restore the Steps button
                const stepsButton = document.getElementById('stepsButton');
                if (stepsButton) {
                    //         stepsButton.innerHTML = `
                    //     Steps
                    //     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    //         <path d="M9 18l6-6-6-6"></path>
                    //     </svg>
                    // `;
                    stepsButton.innerHTML = `Show Steps`;
                    stepsButton.style.background = '#4DA8DA !important';
                }
            }, 100);

            // Return to categories view
            this.showCategoriesView();
        }



        showPopularDepartureLocations() {
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

            this.displayDepartureResults(popularLocations);
        }

        displayDepartureResults(locations) {
            const departureResults = document.getElementById('departureResults');
            if (!departureResults) return;

            departureResults.innerHTML = '';

            locations.forEach(location => {
                const resultItem = document.createElement('div');
                resultItem.className = 'departure-result-item';

                const iconClass = location.icon || 'default';
                const iconText = location.iconText || '📍';

                resultItem.innerHTML = `
                    <div class="departure-result-icon ${iconClass}" style="background-color: ${this.getIconColor(iconClass)}">
                        ${iconText}
                    </div>
                    <div class="departure-result-details">
                        <div class="departure-result-name">${location.name}</div>
                        <div class="departure-result-address">${location.address}</div>
                    </div>
                `;

                resultItem.addEventListener('click', () => {
                    console.log("Selected !!!")
                    this.selectDepartureLocation(location);
                });

                departureResults.appendChild(resultItem);
            });

            departureResults.style.display = 'block';
        }

        getIconColor(iconClass) {
            const colors = {
                'amex': '#2E5BBA',
                'panda': '#D32F2F',
                'starbucks': '#00704A',
                'default': '#666'
            };
            return colors[iconClass] || colors.default;
        }

        // selectDepartureLocation(departureLocation) {
        //     const departureInput = document.getElementById('departureInput');
        //     const departureResults = document.getElementById('departureResults');
        //     const routeSummary = document.getElementById('routeSummary');
        //     const backButton = document.getElementById('directionsBackBtn');
        //     const headerOptions = document.querySelector('.header-options');
        //     if (departureInput) {
        //         departureInput.value = departureLocation.properties.title;
        //         departureInput.classList.add('filled');
        //     }

        //     if (departureResults) {
        //         departureResults.style.display = 'none';
        //     }

        //     // Show the complete interface after departure is set
        //     if (routeSummary) {
        //         routeSummary.style.display = 'block';
        //     }

        //     if (backButton) {
        //         backButton.style.display = 'block';
        //     }

        //     if (headerOptions) {
        //         headerOptions.style.display = 'flex';
        //     }

        //     // Update departure location in the interface
        //     const departureLocationElement = document.querySelector('.departure-location-name');
        //     if (departureLocationElement) {
        //         departureLocationElement.textContent = ddepartureLocation.properties.title;
        //     }
        // }

        showNavigationView() {
            // console.log('Showing navigation view');
            this.currentView = 'navigation';
            this.currentStep = 0;

            this.populateNavigation();

            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'block';

            // Hide popular locations view if it exists
            const popularView = document.getElementById('popularLocationsView');
            if (popularView) popularView.style.display = 'none';
        }
        showPopularLocationsView() {
            //console.log('Showing popular locations view');
            this.currentView = 'popular-locations';

            // Set destination in popular view
            const destinationTextPopular = document.getElementById('destinationTextPopular');
            if (destinationTextPopular && this.currentLocation) {
                destinationTextPopular.textContent = this.currentLocation.name || 'Selected Location';
            }

            // Hide search bar when showing popular locations
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }

            // Also hide the main search input
            const searchInput = document.querySelector('input[placeholder="Search..."]');
            if (searchInput) {
                searchInput.style.display = 'none';
            }

            // Show popular locations view
            const popularView = document.getElementById('popularLocationsView');
            if (popularView) {
                popularView.style.display = 'block';
                this.populatePopularLocations();
            }

            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'block';
            if (this.navigationView) this.navigationView.style.display = 'none';
        }



        populateLocationsByName(poiName) {

            // Get all locations from airport data if available, otherwise use legacy data
            let allLocations = [];

            cfg.state.allPoiGeojson.features.forEach((feature) => {
                feature.properties = window.mapTranslator.translatePOIProperties(feature);
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

            this.locationsList.innerHTML = '';
            sortLocationsByLang(allLocations, cfg.state.language);
            allLocations.forEach(location => {
                var icon = location?.properties?.iconUrl
                    ? location.properties.iconUrl
                    : "./src/images/missingpoi.png";
                var title = getPOITitleByLang(location.properties, cfg.state.language);
                var language = cfg.state.language
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
                    this.showLocationDetailsView(location);
                });

                this.locationsList.appendChild(item);
            });
        }

        populatePopularLocationsByName(poiName) {
            const popularLocationsList = document.getElementById('popularLocationsList');
            if (!popularLocationsList) return;

            // Get all locations from airport data if available, otherwise use legacy data
            let allLocations = [];

            cfg.state.allPoiGeojson.features.forEach((feature) => {
                feature.properties = window.mapTranslator.translatePOIProperties(feature);
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
                var language = cfg.state.language
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
                    this.selectDepartureLocation(location);
                });

                popularLocationsList.appendChild(item);
            });
        }

        populatePopularLocations() {
            const popularLocationsList = document.getElementById('popularLocationsList');
            if (!popularLocationsList) return;

            // Get all locations from airport data if available, otherwise use legacy data
            let allLocations = [];

            cfg.state.allPoiGeojson.features.forEach((feature) => {
                // const location = feature.properties.location;
                if (!cfg.state.selectedTerminal || location === cfg.state.selectedTerminal) {
                    feature.properties = window.mapTranslator.translatePOIProperties(feature);
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
                var language = cfg.state.language
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
                    this.selectDepartureLocation(location);
                });

                popularLocationsList.appendChild(item);
            });
        }

        selectDepartureLocation(departureLocation) {
            // console.log('Departure location selected:', departureLocation);

            // Store the selected departure location
            this.selectedDeparture = departureLocation;
            const departureInput = document.getElementById('departureInput');
            if (departureInput) {
                departureInput.value = getPOITitleByLang(departureLocation.properties, cfg.state.language);
                departureInput.classList.add('filled');
            }

            const destinationInput = document.getElementById('destinationInput');
            if (destinationInput) {
                destinationInput.value = getPOITitleByLang(this.currentLocation.properties, cfg.state.language);
                destinationInput.classList.add('filled');
            }


            // Hide the popular locations view
            const popularView = document.getElementById('popularLocationsView');
            if (popularView) {
                popularView.style.display = 'none';
            }

            // Hide departure results if showing
            const departureResults = document.getElementById('departureResults');
            if (departureResults) {
                departureResults.style.display = 'none';
            }

            // Show the complete directions interface
            this.showCompleteDirectionsInterface(departureLocation);
        }

        showCategoriesView() {
            //console.log('Showing categories view');
            this.currentView = 'categories';

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

            if (this.categoriesSection) this.categoriesSection.style.display = 'block';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'block';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'none';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';

            // Hide popular locations view if it exists
            const popularView = document.getElementById('popularLocationsView');
            if (popularView) popularView.style.display = 'none';
        }

        showLocationsView(subcategoryName) {
            //console.log('Showing locations view for', subcategoryName);
            this.currentView = 'locations';
            this.currentSubcategory = subcategoryName;

            // Auto-expand menu
            this.expandMenu();

            this.populateLocations(subcategoryName);

            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'block';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';
        }

        populateSubcategories(categoryName) {
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

            // ALL
            // cfg.state.allPoiGeojson.features.forEach((feature) => {
            //     if (feature.properties.category_id == clickedCategoryId) {
            //         if (feature.properties.subcategories.length > 0) {
            //             subcategories.push(...feature.properties.subcategories);
            //             found = true;
            //         }
            //     }
            // });

            // BY TERMINALS

            const subcategoryMap = {
                EN: "All",
                AR: "الكل",
                ZN: "全部"
            };

            // Start with the translated "All"
            let subcategories = [subcategoryMap[cfg.state.language] || "All"];
            let found = false;

            // Collect subcategories
            cfg.state.allPoiGeojson.features.forEach((feature) => {
                const { category_id, location, subcategories: featureSubcategories } = feature.properties;

                const matchesCategory = category_id === clickedCategoryId;
                const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

                if (matchesCategory && matchesTerminal && featureSubcategories.length > 0) {
                    subcategories.push(...featureSubcategories);
                    found = true;
                }
            });

            // Remove duplicates (preserving the first "All") and sort the rest
            const uniqueSubcategories = [...new Set(subcategories)];

            // Get "All" value and rest separately
            const allValue = subcategoryMap[cfg.state.language] || "All";
            const sortedSubcategories = [
                allValue,
                ...uniqueSubcategories
                    .filter(sc => sc !== allValue)
                    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            ];

            subcategories = sortedSubcategories;

            // If no subcategories were found, remove "All"
            if (!found) {
                subcategories = [];
                this.subcategoriesList.innerHTML = '';
                this.showLocationsViewByID(clickedCategoryId);

            } else {
                subcategories = [...new Set(subcategories)];
                //subcategories.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
                this.subcategoriesList.innerHTML = '';
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
                            this.showLocationsView(subcategory);
                        } else {
                            subcategories = [];
                            this.subcategoriesList.innerHTML = '';
                            this.showLocationsViewByID(clickedCategoryId);
                        }

                    });

                    this.subcategoriesList.appendChild(item);
                });

                if (this.categoriesSection) this.categoriesSection.style.display = 'none';
                if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
                if (this.subcategoriesView) this.subcategoriesView.style.display = 'block';
                if (this.locationsView) this.locationsView.style.display = 'none';
                if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
                if (this.directionsView) this.directionsView.style.display = 'none';
                if (this.navigationView) this.navigationView.style.display = 'none';
            }
        }


        populateLocationSearch(query) {

            this.populateLocationsByName(query)
            if (this.categoriesSection) this.categoriesSection.style.display = 'none';
            if (this.searchSectionCategories) this.searchSectionCategories.style.display = 'none';
            if (this.subcategoriesView) this.subcategoriesView.style.display = 'none';
            if (this.locationsView) this.locationsView.style.display = 'block';
            if (this.locationDetailsView) this.locationDetailsView.style.display = 'none';
            if (this.directionsView) this.directionsView.style.display = 'none';
            if (this.navigationView) this.navigationView.style.display = 'none';
        }




        populateLocations(subcategoryName) {

            //if (!this.locationsList) return;

            // Get locations from airport data if available, otherwise use legacy data
            let locations = [];
            // if (window.AIRPORT_DATA) {
            //     locations = window.AIRPORT_DATA.getLocationsBySubcategory(this.currentCategory, subcategoryName);
            // }

            // Fallback to legacy data if no locations found
            // if (locations.length === 0) {
            //     locations = this.locationsData[subcategoryName] || [];
            // }
            var language = cfg.state.language
            cfg.state.allPoiGeojson.features.forEach((feature) => {
                const { subcategories = [], location } = feature.properties;

                const matchesSubcategory = subcategories.includes(subcategoryName);
                const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;

                if (matchesSubcategory && matchesTerminal) {
                    feature.properties = window.mapTranslator.translatePOIProperties(feature);
                    locations.push(feature);
                }
            });

            if (locations.length < 1) {
                document.getElementById("NoResultsFound").style.display = "block";
            } else {
                document.getElementById("NoResultsFound").style.display = "none";
            }

            this.locationsList.innerHTML = '';

            sortLocationsByLang(locations, language); // Sorts by Arabic title

            locations.forEach(location => {
                var icon = location?.properties?.iconUrl
                    ? location.properties.iconUrl
                    : "./src/images/missingpoi.png";
                // var title = mapTranslator.getTranslatedPOIName(location.properties.title , cfg.state.language , location);

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
                    //console.log('Location clicked', location);
                    this.showLocationDetailsView(location);
                });

                this.locationsList.appendChild(item);
            });
        }



        populateLocationsByID(categoryID) {

            let locations = [];

            cfg.state.allPoiGeojson.features.forEach((feature) => {
                const { category_id, location } = feature.properties;

                const matchesCategory = category_id === categoryID;
                const matchesTerminal = !cfg.state.selectedTerminal || location === cfg.state.selectedTerminal;
                //workhere
                if (matchesCategory && matchesTerminal) {
                    feature.properties = window.mapTranslator.translatePOIProperties(feature);
                    locations.push(feature);
                }
            });
            if (locations.length < 1) {
                document.getElementById("NoResultsFound").style.display = "block";
            } else {
                document.getElementById("NoResultsFound").style.display = "none";
            }

            this.locationsList.innerHTML = '';

            sortLocationsByLang(locations, cfg.state.language);
            locations.forEach(location => {
                var icon = location?.properties?.iconUrl
                    ? location.properties.iconUrl
                    : "./src/images/missingpoi.png";
                var title = getPOITitleByLang(location.properties, cfg.state.language);
                var language = cfg.state.language
                var title = getPOITitleByLang(location.properties, language);
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
                    this.showLocationDetailsView(location);
                });

                this.locationsList.appendChild(item);
            });
        }

        populateLocationDetails(location) {
            if (!this.locationInfo) return;

            var language = cfg.state.language;
            var amenities = [];
            if (language == "EN") {
                amenities = getEnglishOnly(location?.properties?.subcategories);
            } else if (language == "AR") {
                amenities = getArabicOnly(location?.properties?.subcategories);
            } else if (language == "ZN") {
                amenities = getChineseOnly(location?.properties?.subcategories);
            }

            if (this.categoryItem != null) {
                amenities.push(this.categoryItem);
            }

            console.log("amenities size : "+amenities.length);
            var display = "block";
            if (amenities.length < 1) {
                display = "none";
            } else {
                display = "block";
            }
            var title = getPOITitleByLang(location?.properties, cfg.state.language);
            const [fromLng, fromLat] = parseCenter(location?.properties.center);
            var language = cfg.state.language
            var icon = location?.properties?.iconUrl
                ? location.properties.iconUrl
                : "./src/images/missingpoi.png";
            var poiTerminalLocation = cfg.state.terminalTranslations[language][location?.properties.location];
            markers.flyToPointA(fromLng, fromLat);
            mapc.switchFloorByNo(location?.properties.level);
            this.locationInfo.innerHTML = `
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

        populateDirections(location) {
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

        populateNavigation() {
            const navigationProgress = document.getElementById('navigationProgress');
            const currentInstruction = document.getElementById('currentInstruction');
            const stepsContainer = document.getElementById('stepsContainer');

            if (navigationProgress) {
                navigationProgress.textContent = `Step ${this.currentStep + 1} / ${this.totalSteps}`;
            }

            if (currentInstruction) {
                const step = this.navigationSteps[this.currentStep];
                currentInstruction.innerHTML = `
                    <div class="instruction-icon">${step.icon}</div>
                    <div class="instruction-text">${step.text}</div>
                    <div class="instruction-distance">${step.distance}</div>
                `;
            }

            if (stepsContainer) {
                stepsContainer.innerHTML = '';
                this.navigationSteps.forEach((step, index) => {
                    const stepItem = document.createElement('div');
                    stepItem.className = 'step-item';

                    let stepClass = 'upcoming';
                    if (index < this.currentStep) stepClass = 'completed';
                    else if (index === this.currentStep) stepClass = 'current';

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

            // Update button states
            if (this.nextStepBtn) {
                this.nextStepBtn.disabled = this.currentStep >= this.totalSteps - 1;
            }
        }

        nextNavigationStep() {
            if (this.currentStep < this.totalSteps - 1) {
                this.currentStep++;
                this.populateNavigation();
            }
        }

        endNavigation() {
            this.currentStep = 0;
            this.showCategoriesView();
        }

        getLocationIcon(type) {
            const icons = {
                'starbucks': '☕',
                'panda': '🐼',
                'burger': '🍔',
                'amex': '💳',
                'generic': '📍'
            };
            return icons[type] || icons.generic;
        }

        handleDragEnd() {
            if (!this.startY || !this.currentY) return;

            const deltaY = this.startY - this.currentY;

            if (Math.abs(deltaY) > this.dragThreshold) {
                if (deltaY > 0) {
                    // Dragged up
                    this.handleUpwardDrag();
                } else {
                    // Dragged down
                    this.handleDownwardDrag();
                }
            }
        }

        handleUpwardDrag() {
            switch (this.currentState) {
                case 'search-only':
                    this.currentState = 'partial';
                    break;
                case 'partial':
                    this.currentState = 'full';
                    break;
            }
            this.updateLayout();
        }

        handleDownwardDrag() {
            switch (this.currentState) {
                case 'full':
                    this.currentState = 'partial';
                    break;
                case 'partial':
                    this.currentState = 'search-only';
                    break;
            }
            this.updateLayout();
        }

        handleScrollDetection() {
            this.handleUpwardDrag();
        }

        handleUpwardScroll() {
            this.handleUpwardDrag();
        }

        toggleMobileState() {
            if (this.isDesktop) return;

            if (this.currentState === 'search-only') {
                this.currentState = 'partial';
            } else if (this.currentState === 'partial') {
                this.currentState = 'full';
            } else {
                this.currentState = 'search-only';
            }
            this.updateLayout();
        }

        toggleDesktopMenu() {
            if (!this.isDesktop) return;

            this.isExpanded = !this.isExpanded;
            //console.log('Toggling desktop menu', { isExpanded: this.isExpanded });
            this.updateLayout();
        }

        updateLayout() {
            if (!this.menuContainer) return;

            if (this.isDesktop) {
                this.menuContainer.classList.remove('mobile-search-only', 'mobile-partial', 'mobile-full');

                if (this.isExpanded) {
                    this.menuContainer.classList.remove('desktop-collapsed');
                    this.menuContainer.classList.add('desktop-expanded');
                } else {
                    this.menuContainer.classList.remove('desktop-expanded');
                    this.menuContainer.classList.add('desktop-collapsed');
                }
            } else {
                this.menuContainer.classList.remove('desktop-collapsed', 'desktop-expanded');
                this.menuContainer.classList.remove('mobile-search-only', 'mobile-partial', 'mobile-full');
                this.menuContainer.classList.add(`mobile-${this.currentState.replace('-', '-')}`);
            }

            this.updateArrowDirection();
        }

        updateArrowDirection() {
            if (!this.menuArrow) return;

            if (this.isDesktop) {
                if (this.isExpanded) {
                    this.menuArrow.classList.add('expanded');
                } else {
                    this.menuArrow.classList.remove('expanded');
                }
            } else {
                // Mobile arrow behavior
                if (this.currentState === 'full') {
                    this.menuArrow.classList.add('expanded');
                } else {
                    this.menuArrow.classList.remove('expanded');
                }
            }
        }
    }

    // Initialize the component when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        import('/src/config.js').then(cfg => window.cfg = cfg);
        cfg.state.airportMenu = new AirportMenuComponent();
    });

    // Also initialize if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            //cfg.state.airportMenu = new AirportMenuComponent();
        });
    } else {
        window.airportMenu = new AirportMenuComponent();
    }

    // Export the class for external use
    window.AirportMenuComponent = AirportMenuComponent;
})();


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

    const normalizedLang = lang.toLowerCase(); // ✅ fix here
    const key = `title_${normalizedLang}`;
    const localizedTitle = poi[key];
    if (localizedTitle && localizedTitle.trim()) {
        return localizedTitle;
    }

    return poi.title || '';
}

function sortLocationsByLang(locations, lang = 'EN') {
    const normalizedLang = lang.toLowerCase(); // Ensure key matches: title_en, title_ar, etc.
    const key = `title_${normalizedLang}`;

    locations.sort((a, b) => {
        const titleA = a.properties[key] || '';
        const titleB = b.properties[key] || '';
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    });

    return locations;
}
