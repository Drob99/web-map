/**
 * @module uiTranslator
 * @description Handles UI element translations following Open/Closed principle
 */

import { languageService } from "./languageService.js";
import { rtlStyleManager } from "./rtlStyles.js";

/**
 * UITranslator class manages DOM translations
 * @class
 */
class UITranslator {
  constructor() {
    this.translationMap = new Map();
    this.setupTranslationMap();
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
   * Update category labels in the menu
   * @private
   */
  updateCategoryLabels() {
    const menuLabels = document.querySelectorAll(".menu-label");
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
   * @private
   */
  updateTextDirection() {
    const isRTL = languageService.isRTL();
    const html = document.documentElement;
    const body = document.body;

    if (isRTL) {
      html.setAttribute("dir", "rtl");
      body.style.direction = "rtl";

      // Enable RTL styles
      rtlStyleManager.enableRTL();

      // Update specific elements for RTL
      const backButtons = document.querySelectorAll(
        ".back-button svg, .back-button i"
      );
      backButtons.forEach((btn) => {
        btn.style.transform = "scaleX(-1)";
      });
    } else {
      html.setAttribute("dir", "ltr");
      body.style.direction = "ltr";

      // Disable RTL styles
      rtlStyleManager.disableRTL();

      // Reset transformations
      const backButtons = document.querySelectorAll(
        ".back-button svg, .back-button i"
      );
      backButtons.forEach((btn) => {
        btn.style.transform = "scaleX(1)";
      });
    }
  }

  /**
   * Update elements with data-translate attribute
   * @private
   */
  updateDataTranslateElements() {
    const elements = document.querySelectorAll("[data-translate]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-translate");
      const translated = languageService.translate("static", key, key);
      element.textContent = translated;
    });
  }

  /**
   * Update all UI translations
   */
  updateUITranslations() {
    // Update mapped elements
    this.translationMap.forEach((config, selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const translated = languageService.translate(
          config.category,
          config.key
        );
        if (config.attribute === "textContent") {
          element.textContent = translated;
        } else if (config.attribute === "placeholder") {
          element.placeholder = translated;
        }
      });
    });

    // Update data-translate elements
    this.updateDataTranslateElements();

    // Update category labels
    this.updateCategoryLabels();

    // Update RTL/LTR
    this.updateTextDirection();
  }
}
// Export singleton instance
export const uiTranslator = new UITranslator();