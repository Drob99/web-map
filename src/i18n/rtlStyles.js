/**
 * @module rtlStyles
 * @description Manages RTL-specific styles
 */

/**
 * RTLStyleManager handles RTL/LTR style switching
 * @class
 */
class RTLStyleManager {
    constructor() {
      this.rtlStyleSheet = null;
      this.createRTLStyles();
    }
  
    /**
     * Create RTL-specific stylesheet
     * @private
     */
    createRTLStyles() {
      const style = document.createElement('style');
      style.id = 'rtl-styles';
      style.textContent = `
        /* RTL-specific styles */
        [dir="rtl"] .search-section {
          direction: rtl;
        }
        
        [dir="rtl"] .search-section > * {
          margin-left: 0;
          margin-right: 8px;
        }
        
        [dir="rtl"] .search-section > *:last-child {
          margin-right: 0;
        }
        
        [dir="rtl"] .search-input {
          margin-right: 8px;
        }
        
        [dir="rtl"] #languageToggleButton,
        [dir="rtl"] #nearbyToggleButton {
          margin-left: 0px;
          margin-right: 0;
        }
        
        [dir="rtl"] .menu-arrow {
          transform: rotate(180deg);
        }
        
        [dir="rtl"] .menu-arrow.expanded {
          transform: rotate(0deg);
        }
        
        /* Fix button spacing in RTL */
        [dir="rtl"] .search-section {
          display: flex;
          gap: 8px;
        }
      `;
      
      document.head.appendChild(style);
      this.rtlStyleSheet = style;
    }
  
    /**
     * Enable RTL styles
     */
    enableRTL() {
      if (this.rtlStyleSheet) {
        this.rtlStyleSheet.disabled = false;
      }
    }
  
    /**
     * Disable RTL styles
     */
    disableRTL() {
      if (this.rtlStyleSheet) {
        this.rtlStyleSheet.disabled = true;
      }
    }
  }
  
  // Export singleton instance
  export const rtlStyleManager = new RTLStyleManager();