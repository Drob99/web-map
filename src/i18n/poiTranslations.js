/**
 * @module poiTranslations
 * @description POI-specific name translations
 */

// Import JSON files
import { poiChinese } from "./poiLanguageTranslations/zh.js";

/**
 * Get translated POI name with fallback
 * Enhanced to use POI properties for Arabic translations
 * @param {string} name - Original POI name
 * @param {string} language - Target language
 * @param {Object} poiFeature - The POI feature object (optional, for accessing subtitles)
 * @returns {string} Translated name or original if not found
 */
export function getTranslatedPOIName(name, language, poiFeature = null) {
  if (!name) return name;

  let translation;

  switch (language) {
    case "AR":
      // First try to get from POI subtitles if feature is provided
      if (
        poiFeature &&
        poiFeature.properties &&
        poiFeature.properties.subtitles
      ) {
        const subtitles = poiFeature.properties.subtitles;
        if (Array.isArray(subtitles) && subtitles.length > 0 && subtitles[0]) {
          // Return the Arabic translation from subtitles[0]
          return subtitles[0];
        }
      }
      // If no subtitles found, return original name
      return name;

    case "ZN":
      translation = poiChinese[name];
      break;

    case "EN":
    default:
      // English returns the original name
      return name;
  }

  // If no specific translation found, check for patterns
  if (!translation && language !== "EN") {
    translation = translateByPattern(name, language);
  }

  return translation || name;
}

/**
 * Translate by pattern matching for dynamic POI names
 * @param {string} name - Original POI name
 * @param {string} language - Target language
 * @returns {string|null} Translated name or null
 */
function translateByPattern(name, language) {
  const lowerName = name.toLowerCase();

  // Common patterns to translate
  const patterns = {
    gate: { AR: "بوابة", ZN: "登机口" },
    toilet: { AR: "دورة مياه", ZN: "洗手间" },
    elevator: { AR: "مصعد", ZN: "电梯" },
    escalator: { AR: "سلم كهربائي", ZN: "自动扶梯" },
    stairs: { AR: "درج", ZN: "楼梯" },
    atm: { AR: "صراف آلي", ZN: "自动取款机" },
    lounge: { AR: "صالة", ZN: "休息室" },
    parking: { AR: "موقف سيارات", ZN: "停车场" },
    terminal: { AR: "صالة", ZN: "航站楼" },
  };

  // Check if name contains any pattern
  for (const [key, translations] of Object.entries(patterns)) {
    if (lowerName.includes(key)) {
      const translation = translations[language];
      if (translation) {
        // Replace the pattern in the name
        const regex = new RegExp(key, "gi");
        return name.replace(regex, translation);
      }
    }
  }

  return null;
}

// Export POI translations for backward compatibility
export const poiNameTranslations = {
  EN: {}, // Empty as English uses original names
  AR: {},
  ZN: poiChinese,
};
