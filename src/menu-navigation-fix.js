/**
 * @module menu-navigation-fix
 * @description Simple fix for menu arrow disappearance and view consistency issues
 */

// Initialize the fix when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initMenuFix();
});

function initMenuFix() {
    // Override the existing category click handlers to preserve menu arrow
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        // Remove existing event listeners by cloning the element
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add new event listener that preserves menu arrow
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            this.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';

            setTimeout(() => {
                this.style.transform = '';
                this.style.backgroundColor = '';
            }, 300);

            // Get category name
            const category = this.querySelector('.category-label').textContent;
            console.log('Category clicked:', category);
            
            // Show subcategories view
            showSubcategoriesView(category);
        });
    });
    
    // Setup back button handlers
    setupBackButtons();
    
    // Setup menu arrow functionality
    setupMenuArrow();
}

function showSubcategoriesView(categoryName) {
    // Hide categories section
    const categoriesSection = document.getElementById('categoriesSection');
    if (categoriesSection) {
        categoriesSection.style.display = 'none';
    }
    
    // Show subcategories view
    const subcategoriesView = document.getElementById('subcategoriesView');
    if (subcategoriesView) {
        subcategoriesView.style.display = 'block';
        
        // Update title
        const subcategoriesTitle = document.getElementById('subcategoriesTitle');
        if (subcategoriesTitle) {
            subcategoriesTitle.textContent = categoryName;
        }
    }
    
    // Hide menu arrow when in subcategories view
    const menuArrow = document.getElementById('menuArrow');
    if (menuArrow) {
        menuArrow.style.display = 'none';
    }
}

function showMainView() {
    // Hide all other views
    const views = ['subcategoriesView', 'locationsView', 'locationDetailsView', 'directionsView'];
    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'none';
        }
    });
    
    // Show categories section
    const categoriesSection = document.getElementById('categoriesSection');
    if (categoriesSection) {
        categoriesSection.style.display = 'block';
    }
    
    // Show menu arrow
    const menuArrow = document.getElementById('menuArrow');
    if (menuArrow) {
        menuArrow.style.display = 'flex';
    }
    
    // Reset menu expansion state
    resetMenuExpansion();
}

function setupBackButtons() {
    const backButtons = [
        'subcategoriesBackBtn',
        'locationsBackBtn', 
        'locationDetailsBackBtn',
        'directionsBackBtn'
    ];
    
    backButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            // Remove existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add new listener
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showMainView();
            });
        }
    });
}

function setupMenuArrow() {
    const menuArrow = document.getElementById('menuArrow');
    const categoriesSection = document.getElementById('categoriesSection');
    
    if (!menuArrow || !categoriesSection) return;

    // Remove existing listeners
    const newMenuArrow = menuArrow.cloneNode(true);
    menuArrow.parentNode.replaceChild(newMenuArrow, menuArrow);
    
    let isExpanded = false;

    // Get all additional categories
    const additionalCategories = [];
    for (let row = 2; row <= 7; row++) {
        for (let i = 1; i <= 4; i++) {
            const element = document.getElementById(`row${row}-${i}`);
            if (element) additionalCategories.push(element);
        }
    }

    newMenuArrow.addEventListener('click', function() {
        isExpanded = !isExpanded;
        this.classList.toggle('expanded');

        if (isExpanded) {
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

function resetMenuExpansion() {
    const menuArrow = document.getElementById('menuArrow');
    const categoriesSection = document.getElementById('categoriesSection');
    
    if (!menuArrow || !categoriesSection) return;

    // Reset expansion state
    menuArrow.classList.remove('expanded');

    // Hide additional categories
    for (let row = 2; row <= 7; row++) {
        for (let i = 1; i <= 4; i++) {
            const element = document.getElementById(`row${row}-${i}`);
            if (element) {
                element.classList.add('hidden');
                element.classList.remove('additional-categories');
            }
        }
    }

    // Reset categories section
    categoriesSection.style.maxHeight = '104px';
    categoriesSection.style.overflowY = 'hidden';
    categoriesSection.scrollTop = 0;
}

