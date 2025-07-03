/**
 * @module mapTranslator
 * @description Handles map-related translations following Single Responsibility Principle
 */

import { languageService } from "./languageService.js";
import { state } from "../config.js";
import { map } from "../mapInit.js";

/**
 * MapTranslator class manages map layer translations
 * @class
 */
class MapTranslator {
  constructor() {
    this.textFieldMap = {
      'EN': 'title',
      'AR': 'title_ar',
      'ZN': 'title_zn'
    };
  }

  /**
   * Update POI text field based on current language
   */
  updatePOILabels() {
    if (!map || !map.getLayer('municipality-name')) return;

    const lang = languageService.getCurrentLanguage();
    const titleField = this.getLocalizedTitleField(lang);
    
    // Update the text field to use localized title with fallback
    map.setLayoutProperty('municipality-name', 'text-field', [
      'coalesce',
      ['get', titleField],
      ['get', 'title']  // Fallback to default title
    ]);
  }

  /**
   * Get localized title field for POIs based on language
   * @param {string} lang - Language code
   * @returns {string} Field name for the title
   */
  getLocalizedTitleField(lang) {
    // If POIs have multilingual fields, use them
    // Otherwise, we'll translate known categories
    return this.textFieldMap[lang] || 'title';
  }

  /**
   * Prepare POI properties with translations
   * @param {Object} feature - POI feature
   * @returns {Object} Updated properties
   */
  translatePOIProperties(feature) {
    const props = { ...feature.properties };
    const title = props.title;
    
    // Translate known categories
    props.title_en = languageService.translate('categories', title, title);
    props.title_ar = languageService.translations.categories.AR[title] || title;
    props.title_zn = languageService.translations.categories.ZN[title] || title;
    
    return props;
  }
}

// Export singleton instance
export const mapTranslator = new MapTranslator();