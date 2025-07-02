/**
 * @module languageService
 * @description Language management service with event coordination
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
   * Enhanced with better event coordination and debugging
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
      
      // Track language change listeners for debugging
      this.changeListeners = new Set();
      this.setupEventListeners();
    }
  
    /**
     * Setup internal event listeners for better coordination
     */
    setupEventListeners() {
      // Listen for our own language change events to coordinate updates
      window.addEventListener("languageChanged", (event) => {
        console.log("Language change event received:", event.detail);
        this.onLanguageChangeComplete(event.detail.language);
      });
    }
  
    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
      return this.currentLanguage;
    }
  
    /**
     * Set language and update state with enhanced coordination
     * @param {string} lang - Language code (EN, AR, ZN)
     * @returns {boolean} Success status
     */
    setLanguage(lang) {
      if (!this.supportedLanguages.includes(lang)) {
        console.warn(`Language ${lang} not supported`);
        return false;
      }
  
      const previousLanguage = this.currentLanguage;
      this.currentLanguage = lang;
      state.language = lang;
  
      console.log(`Language changed from ${previousLanguage} to ${lang}`);
  
      // Dispatch custom event for language change with more context
      const changeEvent = new CustomEvent("languageChanged", {
        detail: { 
          language: lang,
          previousLanguage: previousLanguage,
          timestamp: Date.now()
        },
      });
      
      window.dispatchEvent(changeEvent);
  
      return true;
    }
  
    /**
     * Handle post-language change coordination
     * @param {string} lang - New language code
     */
    onLanguageChangeComplete(lang) {
      // This can be used for any post-change cleanup or coordination
      console.log(`Language change to ${lang} completed`);
      
      // Notify any registered listeners
      this.changeListeners.forEach(listener => {
        try {
          listener(lang);
        } catch (error) {
          console.warn("Error in language change listener:", error);
        }
      });
    }
  
    /**
     * Register a callback for language changes
     * @param {Function} callback - Function to call when language changes
     */
    onLanguageChange(callback) {
      this.changeListeners.add(callback);
      
      // Return unsubscribe function
      return () => {
        this.changeListeners.delete(callback);
      };
    }
  
    /**
     * Translate a key with fallback and better error handling
     * @param {string} category - Translation category
     * @param {string} key - Translation key
     * @param {string} fallback - Fallback value
     * @returns {string} Translated text
     */
    translate(category, key, fallback = key) {
      try {
        const categoryTranslations = this.translations[category];
        if (!categoryTranslations) {
          console.warn(`Translation category '${category}' not found`);
          return fallback;
        }
  
        const languageTranslations = categoryTranslations[this.currentLanguage];
        if (!languageTranslations) {
          console.warn(`Language '${this.currentLanguage}' not found in category '${category}'`);
          return fallback;
        }
  
        const translation = languageTranslations[key];
        return translation !== undefined ? translation : fallback;
      } catch (error) {
        console.warn(`Translation error for ${category}.${key}:`, error);
        return fallback;
      }
    }
  
    /**
     * Translate POI name with enhanced logging
     * @param {string} poiName - Original POI name
     * @returns {string} Translated POI name
     */
    translatePOIName(poiName) {
      const result = getTranslatedPOIName(poiName, this.currentLanguage);
      if (result !== poiName) {
        console.log(`POI translated: "${poiName}" -> "${result}" (${this.currentLanguage})`);
      }
      return result;
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
  
    /**
     * Debug method to log current state
     */
    debugState() {
      console.log("LanguageService Debug State:", {
        currentLanguage: this.currentLanguage,
        supportedLanguages: this.supportedLanguages,
        stateLanguage: state.language,
        listenersCount: this.changeListeners.size
      });
    }
  }
  
  // Export singleton instance
  export const languageService = new LanguageService();