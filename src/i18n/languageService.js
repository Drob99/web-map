/**
 * @module languageService
 * @description Language management service following Single Responsibility and Dependency Inversion principles
 */

import {
    numberTranslations,
    terminalTranslations,
    categoryTranslations,
    staticTranslations,
    floorTranslations,
  } from "./translations.js";
import { state } from "../config.js";
  import { poiNameTranslations, getTranslatedPOIName } from "./poiTranslations.js";
  
  /**
   * LanguageService class manages all language-related operations
   * @class
   */
  class LanguageService {
    constructor() {
      this.supportedLanguages = ["EN", "AR", "ZN"];
      this.currentLanguage = state.language || "EN";
      this.translations = {
        numbers: numberTranslations,
        terminals: terminalTranslations,
        categories: categoryTranslations,
        static: staticTranslations,
        floors: floorTranslations,
        poi: poiNameTranslations,
      };
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
      return this.currentLanguage;
    }

    /**
     * Set language and update state
     * @param {string} lang - Language code (EN, AR, ZN)
     * @returns {boolean} Success status
     */
    setLanguage(lang) {
      if (!this.supportedLanguages.includes(lang)) {
        console.warn(`Language ${lang} not supported`);
        return false;
      }

      this.currentLanguage = lang;
      state.language = lang;

      // Dispatch custom event for language change
      window.dispatchEvent(
        new CustomEvent("languageChanged", {
          detail: { language: lang },
        })
      );

      return true;
    }

    /**
     * Translate a key with fallback
     * @param {string} category - Translation category
     * @param {string} key - Translation key
     * @param {string} fallback - Fallback value
     * @returns {string} Translated text
     */
    translate(category, key, fallback = key) {
      try {
        const translation =
          this.translations[category]?.[this.currentLanguage]?.[key];
        return translation !== undefined ? translation : fallback;
      } catch (error) {
        console.warn(`Translation error for ${category}.${key}:`, error);
        return fallback;
      }
    }

    /**
     * Translate POI name
     * @param {string} poiName - Original POI name
     * @returns {string} Translated POI name
     */
    translatePOIName(poiName) {
      return getTranslatedPOIName(poiName, this.currentLanguage);
    }

    /**
     * Translate number to localized format
     * @param {number|string} number - Number to translate
     * @returns {string} Localized number
     */
    translateNumber(number) {
      const numStr = number.toString();
      return numStr
        .split("")
        .map((digit) => this.translate("numbers", digit, digit))
        .join("");
    }

    /**
     * Check if current language is RTL
     * @returns {boolean} True if RTL
     */
    isRTL() {
      return this.currentLanguage === "AR";
    }

    /**
     * Get all translations for current language
     * @returns {Object} All translations
     */
    getAllTranslations() {
      const result = {};
      Object.keys(this.translations).forEach((category) => {
        result[category] =
          this.translations[category][this.currentLanguage] || {};
      });
      return result;
    }
  }
  
  // Export singleton instance
  export const languageService = new LanguageService();