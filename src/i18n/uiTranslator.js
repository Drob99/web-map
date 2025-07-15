/**
 * @module uiTranslator
 * @description Handles UI element translations following Open/Closed principle
 */

import { languageService } from "./languageService.js";
import { rtlStyleManager } from "./rtlStyles.js";

/**
 * UITranslator class manages DOM translations and RTL updates
 * @class
 */
class UITranslator {
  constructor() {
    this.translationMap = new Map();
    this.rtlTransformElements = new Set();
    this.setupTranslationMap();
    this.setupRTLElements();
  }

  /**
   * Setup translation mappings for UI elements
   * @private
   */
  setupTranslationMap() {
    // Map element selectors to translation keys
    this.translationMap.set(".search-input", {
      attribute: "placeholder",
      category: "static",
      key: "Search",
    });

    this.translationMap.set("#from_location option[disabled]", {
      attribute: "textContent",
      category: "static",
      key: "Choose starting point",
    });

    this.translationMap.set("#to_location option[disabled]", {
      attribute: "textContent",
      category: "static",
      key: "Choose destination point",
    });

    // Add more mappings as needed
  }

  /**
   * Setup elements that need RTL transformation
   * @private
   */
  setupRTLElements() {
    // Define selectors for elements that need special RTL handling
    this.rtlTransformElements.add('.back-button svg');
    this.rtlTransformElements.add('.back-button i');
    this.rtlTransformElements.add('.navigation-arrow');
    this.rtlTransformElements.add('.direction-icon');
  }

  /**
   * Update all UI translations
   * Main entry point for translation updates
   */
  updateUITranslations() {
    // Update text translations
    this.updateTextTranslations();
    
    // Update category labels
    this.updateCategoryLabels();
    
    // Update text direction and RTL-specific changes
    this.updateTextDirection();
    
    // Update dynamic content
    this.updateDynamicContent();
  }

  /**
   * Update text translations from translation map
   * @private
   */
  updateTextTranslations() {
    this.translationMap.forEach((config, selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const translated = languageService.translate(
          config.category,
          config.key,
          element[config.attribute] || element.textContent
        );
        
        if (config.attribute === 'textContent') {
          element.textContent = translated;
        } else {
          element.setAttribute(config.attribute, translated);
        }
      });
    });
  }

  /**
   * Update category labels in the menu
   * @private
   */
  updateCategoryLabels() {
    const menuLabels = document.querySelectorAll(".category-label");
    menuLabels.forEach((label) => {
      const originalText =
        label.getAttribute("data-original") || label.textContent;
      if (!label.getAttribute("data-original")) {
        label.setAttribute("data-original", originalText);
      }

      const translated = languageService.translate(
        "categories",
        originalText,
        originalText
      );
      label.textContent = translated;
    });
  }

  /**
   * Update text direction for RTL languages
   * Enhanced with comprehensive RTL support
   * @private
   */
  updateTextDirection() {
    const isRTL = languageService.isRTL();
    const html = document.documentElement;
    const body = document.body;

    if (isRTL) {
      // Set document direction
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ar");
      body.style.direction = "rtl";

      // Enable RTL styles
      rtlStyleManager.enableRTL();

      // Update specific elements for RTL
      this.applyRTLTransforms();
      
      // Update map controls position
      this.updateMapControlsPosition(true);
      
      // Handle dynamic tooltips
      this.updateTooltipPositions(true);
      
    } else {
      // Set document direction
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", languageService.getCurrentLanguage().toLowerCase());
      body.style.direction = "ltr";

      // Disable RTL styles
      rtlStyleManager.disableRTL();

      // Reset transformations
      this.resetRTLTransforms();
      
      // Update map controls position
      this.updateMapControlsPosition(false);
      
      // Handle dynamic tooltips
      this.updateTooltipPositions(false);
    }
  }

  /**
   * Apply RTL-specific transforms to elements
   * @private
   */
  applyRTLTransforms() {
    // Transform directional icons
    this.rtlTransformElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.hasAttribute('data-rtl-transform')) {
          element.setAttribute('data-rtl-transform', 'true');
          // The transform is now handled by CSS
        }
      });
    });

    // Update navigation icons if present
    this.updateNavigationIcons(true);
    
    // Update any canvas-based elements
    this.updateCanvasElements(true);
  }

  /**
   * Reset RTL transforms
   * @private
   */
  resetRTLTransforms() {
    // Remove RTL transform attributes
    const transformedElements = document.querySelectorAll('[data-rtl-transform]');
    transformedElements.forEach(element => {
      element.removeAttribute('data-rtl-transform');
    });

    // Update navigation icons
    this.updateNavigationIcons(false);
    
    // Update canvas elements
    this.updateCanvasElements(false);
  }

  /**
   * Update navigation icons based on text direction
   * @param {boolean} isRTL - Whether RTL is active
   * @private
   */
  updateNavigationIcons(isRTL) {
    // Update turn direction icons
    const turnIcons = {
      left: isRTL ? 'ph-arrow-bend-up-right' : 'ph-arrow-bend-up-left',
      right: isRTL ? 'ph-arrow-bend-up-left' : 'ph-arrow-bend-up-right',
      'slight-left': isRTL ? 'ph-arrow-up-right' : 'ph-arrow-up-left',
      'slight-right': isRTL ? 'ph-arrow-up-left' : 'ph-arrow-up-right',
    };

    // Update existing navigation icons
    Object.entries(turnIcons).forEach(([direction, iconClass]) => {
      const elements = document.querySelectorAll(`[data-turn-direction="${direction}"]`);
      elements.forEach(element => {
        const icon = element.querySelector('i');
        if (icon) {
          // Remove all arrow classes
          icon.className = icon.className.replace(/ph-arrow-[\w-]+/g, '');
          // Add the correct class
          icon.classList.add('ph', iconClass);
        }
      });
    });
  }

  /**
   * Update map controls position for RTL
   * @param {boolean} isRTL - Whether RTL is active
   * @private
   */
  updateMapControlsPosition(isRTL) {
    // Update zoom controls
    const zoomControls = document.querySelector('.mapboxgl-ctrl-zoom-in');
    if (zoomControls && zoomControls.parentElement) {
      const parent = zoomControls.parentElement;
      if (isRTL) {
        parent.style.left = '10px';
        parent.style.right = 'auto';
      } else {
        parent.style.left = 'auto';
        parent.style.right = '10px';
      }
    }

    // Update compass control
    const compass = document.querySelector('.mapboxgl-ctrl-compass');
    if (compass && compass.parentElement) {
      const parent = compass.parentElement;
      if (isRTL) {
        parent.style.left = '10px';
        parent.style.right = 'auto';
      } else {
        parent.style.left = 'auto';
        parent.style.right = '10px';
      }
    }
  }

  /**
   * Update tooltip positions for RTL
   * @param {boolean} isRTL - Whether RTL is active
   * @private
   */
  updateTooltipPositions(isRTL) {
    // Update Mapbox popup anchors
    if (window.mapboxgl && window.map) {
      const popups = document.querySelectorAll('.mapboxgl-popup');
      popups.forEach(popup => {
        const anchor = popup.querySelector('.mapboxgl-popup-anchor-left');
        if (anchor && isRTL) {
          anchor.classList.remove('mapboxgl-popup-anchor-left');
          anchor.classList.add('mapboxgl-popup-anchor-right');
        } else if (anchor && !isRTL) {
          anchor.classList.remove('mapboxgl-popup-anchor-right');
          anchor.classList.add('mapboxgl-popup-anchor-left');
        }
      });
    }
  }

  /**
   * Update canvas-based elements (if any)
   * @param {boolean} isRTL - Whether RTL is active
   * @private
   */
  updateCanvasElements(isRTL) {
    // Handle any canvas-based visualizations that need RTL support
    const canvasElements = document.querySelectorAll('canvas[data-rtl-aware]');
    canvasElements.forEach(canvas => {
      const event = new CustomEvent('rtlChange', { detail: { isRTL } });
      canvas.dispatchEvent(event);
    });
  }

  /**
   * Update dynamic content that may have been added after initial load
   * @private
   */
  updateDynamicContent() {
    // Update any dynamically loaded content
    setTimeout(() => {
      // Re-apply translations to dynamic content
      this.updateTextTranslations();
      
      // Re-apply RTL transforms if needed
      if (languageService.isRTL()) {
        this.applyRTLTransforms();
      }
    }, 100);
  }

  /**
   * Force update all UI elements
   * Useful for manual refresh
   */
  forceUpdate() {
    this.updateUITranslations();
  }
}

// Export singleton instance
export const uiTranslator = new UITranslator();