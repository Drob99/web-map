/**
 * @module mapTranslator
 * @description Handles map-related translations following Single Responsibility Principle
 */

import { languageService } from "./languageService.js";
import { state } from "../config.js";
import { map } from "../mapInit.js";
import { getTranslatedPOIName } from "./poiTranslations.js";

/**
 * MapTranslator class manages map layer translations
 * @class
 */
class MapTranslator {
  constructor() {
    this.textFieldMap = {
      EN: "title",
      AR: "title_ar",
      ZN: "title_zn",
    };
  }

  /**
   * Update POI text field based on current language
   */
  updatePOILabels() {
    if (!map || !map.getLayer("municipality-name")) return;

    const lang = languageService.getCurrentLanguage();

    // Force refresh the layer with new text field
    const textField = this.getTextFieldExpression(lang);
    map.setLayoutProperty("municipality-name", "text-field", textField);
  }

  /**
   * Get text field expression for current language
   * @param {string} lang - Language code
   * @returns {Array} Mapbox expression for text field
   */
  getTextFieldExpression(lang) {
    const titleField = this.textFieldMap[lang];

    return ["coalesce", ["get", titleField], ["get", "title"]];
  }

  /**
   * Prepare POI properties with translations
   * @param {Object} feature - POI feature
   * @returns {Object} Updated properties
   */
  translatePOIProperties(feature) {
    const props = { ...feature.properties };
    const originalTitle = props.title || "";

    // Skip if it's a room or empty
    if (!originalTitle || originalTitle === "room") {
      props.title_en = "";
      props.title_ar = "";
      props.title_zn = "";
      return props;
    }

    // Store original title if not already stored
    if (!props.title_original) {
      props.title_original = originalTitle;
    }

    // Use the original title for translations
    const titleToTranslate = props.title_original || originalTitle;

    // First try POI-specific translations
    props.title_en = titleToTranslate; // English uses original
    props.title_ar = getTranslatedPOIName(titleToTranslate, "AR");
    props.title_zn = getTranslatedPOIName(titleToTranslate, "ZN");

    // If no POI translation found, try category translations
    if (props.title_ar === titleToTranslate) {
      props.title_ar =
        languageService.translations.categories.AR[titleToTranslate] ||
        titleToTranslate;
    }
    if (props.title_zn === titleToTranslate) {
      props.title_zn =
        languageService.translations.categories.ZN[titleToTranslate] ||
        titleToTranslate;
    }

    return props;
  }
}

// Export singleton instance
export const mapTranslator = new MapTranslator();