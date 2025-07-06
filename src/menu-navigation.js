/**
 * @module menu-navigation
 * @description Handles menu navigation state and view transitions
 */

// Menu state management
let currentView = 'categories'; // 'categories', 'subcategories', 'locations', 'details', 'directions'
let isMenuExpanded = false;
let navigationHistory = [];

/**
 * Initialize menu navigation system
 */
export function initMenuNavigation() {
    setupMenuArrow();
    setupBackButtons();
    setupCategoryItems();
    resetToMainView();
}

/**
 * Setup menu arrow functionality
 */
function setupMenuArrow() {
    const menuArrow = document.getElementById('menuArrow');
    const categoriesSection = document.getElementById('categoriesSection');
    
    if (!menuArrow || !categoriesSection) return;

    // Get all additional categories
    const additionalCategories = [];
    for (let row = 2; row <= 7; row++) {
        for (let i = 1; i <= 4; i++) {
            const element = document.getElementById(`row${row}-${i}`);
            if (element) additionalCategories.push(element);
        }
    }

    menuArrow.addEventListener('click', function() {
        isMenuExpanded = !isMenuExpanded;
        this.classList.toggle('expanded');

        if (isMenuExpanded) {
            // Show additional categories with animation
            additionalCategories.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.remove('hidden');
                    item.classList.add('additional-categories');
                }, index * 50);
            });

            // Expand categories section
            categoriesSection.style.maxHeight = '372px';
            categoriesSection.style.overflowY = 'auto';
        } else {
            // Hide additional categories
            additionalCategories.forEach(item => {
                item.classList.add('hidden');
                item.classList.remove('additional-categories');
            });

            // Collapse categories section
            categoriesSection.style.maxHeight = '104px';
            categoriesSection.style.overflowY = 'hidden';
            categoriesSection.scrollTop = 0;
        }
    });
}

/**
 * Setup back button functionality
 */
function setupBackButtons() {
    // Subcategories back button
    const subcategoriesBackBtn = document.getElementById('subcategoriesBackBtn');
    if (subcategoriesBackBtn) {
        subcategoriesBackBtn.addEventListener('click', () => {
            navigateBack();
        });
    }

    // Locations back button
    const locationsBackBtn = document.getElementById('locationsBackBtn');
    if (locationsBackBtn) {
        locationsBackBtn.addEventListener('click', () => {
            //navigateBack();
        });
    }

    // Location details back button
    const locationDetailsBackBtn = document.getElementById('locationDetailsBackBtn');
    if (locationDetailsBackBtn) {
        locationDetailsBackBtn.addEventListener('click', () => {
            //navigateBack();
        });
    }

    // Directions back button
    // const directionsBackBtn = document.getElementById('directionsBackBtn');
    // if (directionsBackBtn) {
    //     directionsBackBtn.addEventListener('click', () => {
    //         //navigateBack();
    //     });
    // }
}

/**
 * Setup category item click handlers
 */
function setupCategoryItems() {
    // const categoryItems = document.querySelectorAll('.category-item');
    // categoryItems.forEach(item => {
    //     item.addEventListener('click', function() {
    //         // Add click animation
    //         this.style.transform = 'scale(0.95)';
    //         this.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';

    //         setTimeout(() => {
    //             this.style.transform = '';
    //             this.style.backgroundColor = '';
    //         }, 300);

    //         // Get category name
    //         const category = this.querySelector('.category-label').textContent;
    //         // Navigate to subcategories view
    //         navigateToSubcategories(category);
    //     });
    // });
}

/**
 * Navigate to subcategories view
 * @param {string} categoryName - Name of the selected category
 */
function navigateToSubcategories(categoryName) {
    // Add current view to history
    navigationHistory.push(currentView);
    currentView = 'subcategories';

    // Hide categories view and show subcategories view
    hideAllViews();
    showView('subcategoriesView');
    
    // Update title
    const subcategoriesTitle = document.getElementById('subcategoriesTitle');
    if (subcategoriesTitle) {
        subcategoriesTitle.textContent = categoryName;
    }

    // Hide menu arrow when in subcategories view
    hideMenuArrow();
}

/**
 * Navigate to locations view
 * @param {string} subcategoryName - Name of the selected subcategory
 */
export function navigateToLocations(subcategoryName) {
    navigationHistory.push(currentView);
    currentView = 'locations';

    hideAllViews();
    showView('locationsView');
    
    // Update title
    const locationsTitle = document.getElementById('locationsTitle');
    if (locationsTitle) {
        locationsTitle.textContent = subcategoryName;
    }

    hideMenuArrow();
}

/**
 * Navigate to location details view
 * @param {Object} locationData - Location data object
 */
export function navigateToLocationDetails(locationData) {
    navigationHistory.push(currentView);
    currentView = 'details';

    hideAllViews();
    showView('locationDetailsView');
    
    // Update title and content
    const locationDetailsTitle = document.getElementById('locationDetailsTitle');
    if (locationDetailsTitle) {
        locationDetailsTitle.textContent = locationData.name || 'Location Details';
    }

    hideMenuArrow();
}

/**
 * Navigate to directions view
 * @param {Object} destinationData - Destination data object
 */
export function navigateToDirections(destinationData) {
    navigationHistory.push(currentView);
    currentView = 'directions';

    hideAllViews();
    showView('directionsView');
    
    // Update destination text
    const destinationText = document.getElementById('destinationText');
    if (destinationText) {
        destinationText.textContent = destinationData.name || 'Destination';
    }

    hideMenuArrow();
}

/**
 * Navigate back to previous view
 */
function navigateBack() {
    showMenuArrow();
}

/**
 * Reset to main categories view
 */
function resetToMainView() {
    currentView = 'categories';
    navigationHistory = [];
    
    hideAllViews();
    showView('categoriesSection');
    showMenuArrow();
    
    // Reset menu expansion state
    resetMenuExpansion();
}

/**
 * Hide all menu views
 */
function hideAllViews() {
    const views = [
        'categoriesSection',
        'subcategoriesView',
        'locationsView',
        'locationDetailsView',
        'directionsView',
        'popularLocationsView'
    ];

    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'none';
        }
    });
}

/**
 * Show specific view
 * @param {string} viewId - ID of the view element to show
 */
function showView(viewId) {
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'block';
    }
}

/**
 * Get view element ID from view name
 * @param {string} viewName - Name of the view
 * @returns {string} Element ID
 */
function getViewElementId(viewName) {
    const viewMap = {
        'categories': 'categoriesSection',
        'subcategories': 'subcategoriesView',
        'locations': 'locationsView',
        'details': 'locationDetailsView',
        'directions': 'directionsView'
    };
    return viewMap[viewName] || 'categoriesSection';
}

/**
 * Hide menu arrow
 */
function hideMenuArrow() {
    const menuArrow = document.getElementById('menuArrow');
    if (menuArrow) {
        menuArrow.style.display = 'none';
    }
}

/**
 * Show menu arrow
 */
function showMenuArrow() {
    const menuArrow = document.getElementById('menuArrow');
    if (menuArrow) {
        menuArrow.style.display = 'flex';
    }
}

/**
 * Reset menu expansion state
 */
function resetMenuExpansion() {
    const menuArrow = document.getElementById('menuArrow');
    const categoriesSection = document.getElementById('categoriesSection');
    
    if (!menuArrow || !categoriesSection) return;

    // Reset expansion state
    isMenuExpanded = false;
    menuArrow.classList.remove('expanded');

    // Hide additional categories
    const additionalCategories = [];
    for (let row = 2; row <= 7; row++) {
        for (let i = 1; i <= 4; i++) {
            const element = document.getElementById(`row${row}-${i}`);
            if (element) {
                element.classList.add('hidden');
                element.classList.remove('additional-categories');
                additionalCategories.push(element);
            }
        }
    }

    // Reset categories section
    categoriesSection.style.maxHeight = '104px';
    categoriesSection.style.overflowY = 'hidden';
    categoriesSection.scrollTop = 0;
}

/**
 * Get current view
 * @returns {string} Current view name
 */
export function getCurrentView() {
    return currentView;
}

/**
 * Check if menu is expanded
 * @returns {boolean} Menu expansion state
 */
export function isMenuCurrentlyExpanded() {
    return isMenuExpanded;
}

