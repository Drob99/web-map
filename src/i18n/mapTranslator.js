/**
 * @module mapTranslator
 * @description Handles map-related translations following Single Responsibility Principle
 * Enhanced to properly update all POI-related layers
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
    
    // List of layers that need translation updates
    this.poiLayerIds = [
      "municipality-name",
      "polygons", // Add other POI layers as needed
      "polygons_outline"
    ];
  }

  /**
   * Update POI text field based on current language
   * Enhanced to handle all POI layers properly
   */
  updatePOILabels() {
    if (!map) return;

    const lang = languageService.getCurrentLanguage();
    const textField = this.getTextFieldExpression(lang);

    // Update all POI-related layers
    this.poiLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          // Only update symbol layers (text layers)
          const layer = map.getLayer(layerId);
          if (layer && layer.type === 'symbol') {
            map.setLayoutProperty(layerId, "text-field", textField);
          }
        } catch (error) {
          console.warn(`Could not update layer ${layerId}:`, error);
        }
      }
    });

    // Force map repaint to ensure changes are visible
    if (typeof map.triggerRepaint === 'function') {
      map.triggerRepaint();
    }
  }

  /**
   * Get text field expression for current language
   * @param {string} lang - Language code
   * @returns {Array} Mapbox expression for text field
   */
  getTextFieldExpression(lang) {
    const titleField = this.textFieldMap[lang];
    
    // Create a more robust expression that handles missing translations
    return [
      "case",
      ["!=", ["get", titleField], null],
      ["get", titleField],
      ["!=", ["get", titleField], ""],
      ["get", titleField],
      ["get", "title"] // Fallback to original title
    ];
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

    // Generate translations for all languages
    props.title_en = titleToTranslate; // English uses original
    props.title_ar = getTranslatedPOIName(titleToTranslate, "AR");
    props.title_zn = getTranslatedPOIName(titleToTranslate, "ZN");

    // If no POI translation found, try category translations
    if (props.title_ar === titleToTranslate) {
      props.title_ar =
        languageService.translations.categories?.AR?.[titleToTranslate] ||
        titleToTranslate;
    }
    if (props.title_zn === titleToTranslate) {
      props.title_zn =
        languageService.translations.categories?.ZN?.[titleToTranslate] ||
        titleToTranslate;
    }

    return props;
  }

  /**
   * Force refresh all POI translations
   * This method should be called when language changes
   */
  refreshAllPOITranslations() {
    // Update the labels
    this.updatePOILabels();
    
    // Trigger a map style refresh if needed
    setTimeout(() => {
      if (map && typeof map.triggerRepaint === 'function') {
        map.triggerRepaint();
      }
    }, 100);
  }
}

// Export singleton instance
export const mapTranslator = new MapTranslator();