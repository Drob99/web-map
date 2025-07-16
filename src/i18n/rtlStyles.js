/**
 * @module rtlStyles
 * @description Manages RTL-specific styles with comprehensive support
 * Following Single Responsibility Principle - This module only handles RTL styling
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
   * Create comprehensive RTL-specific stylesheet
   * Using CSS logical properties and modern CSS features
   * @private
   */
  createRTLStyles() {
    const style = document.createElement('style');
    style.id = 'rtl-styles';
    style.textContent = `
      /* ===== Base RTL Setup ===== */
      [dir="rtl"] {
        /* Set base direction for all child elements */
        direction: rtl;
        text-align: right;
      }

      /* Preserve flex gaps globally */
      [dir="rtl"] .flex,
      [dir="rtl"] [class*="flex-"],
      [dir="rtl"] [style*="display: flex"],
      [dir="rtl"] [style*="display:flex"] {
        /* Ensure gaps are preserved in flex containers */
        gap: inherit;
      }

      /* ===== Fixed Position Elements ===== */
      
      /* Menu Container - Flip from left to right */
      [dir="rtl"] .menu-container {
        left: auto !important;
        right: 20px !important;
      }

      /* Dropdown - Preserve padding */
      [dir="rtl"] .dropdown-content {
        padding: 5px; /* Maintain original padding */
      }

      [dir="rtl"] .dropdown-title,
      [dir="rtl"] .dropdown-subtitle {
        padding: 0 10px; /* Add horizontal padding */
      }

      /* Language Panel - Flip position */
      [dir="rtl"] .language-panel {
        left: auto !important;
        right: 20px !important;
      }

      /* Legend Panel and Toggle */
      [dir="rtl"] #legendToggle {
        left: auto;
        right: 0;
        border-radius: 6px 0 0 6px;
      }

      [dir="rtl"] #legendPanel {
        left: auto;
        right: -575px;
      }

      [dir="rtl"] #legendPanel.show {
        left: auto;
        right: 50px;
      }

      /* ===== CRITICAL FIX: Dropdown Container RTL Layout ===== */
      
      /* Dropdown Container - Move to left and reverse flex direction */
      [dir="rtl"] .dropdown-container {
        left: 20px;
        right: auto;
        flex-direction: row-reverse; /* This reverses the order of dropdown and wheelchair icon */
      }
      
      /* Fix accessibility button (wheelchair icon) margin in RTL */
      [dir="rtl"] #accessibilityBtn {
        margin-left: 0 !important; /* Remove left margin */
        margin-right: 10px !important; /* Add right margin instead */
      }
      
      /* Ensure dropdown list appears in correct position in RTL */
      [dir="rtl"] .dropdown-list {
        left: 0;
        right: auto;
      }

      /* ===== End of Critical Fix ===== */

      /* Lists */
      [dir="rtl"] ul,
      [dir="rtl"] ol {
        padding-right: 25px;
        padding-left: 0;
      }

      /* Language List Items */
      [dir="rtl"] .language-item {
        flex-direction: row-reverse;
        text-align: right;
      }

      [dir="rtl"] .language-item:hover {
        transform: translateX(-4px);
      }

      /* ===== Icons and Directional Elements ===== */
      
      /* Mirror back buttons and directional icons */
      [dir="rtl"] .back-button svg,
      [dir="rtl"] .back-button i,
      [dir="rtl"] .ph-arrow-left,
      [dir="rtl"] .ph-arrow-right,
      [dir="rtl"] .bi-chevron-left,
      [dir="rtl"] .bi-chevron-right {
        transform: scaleX(-1);
      }

      /* Menu Arrow - Adjust rotation for RTL */
      [dir="rtl"] .menu-arrow {
        transform: rotate(0deg);
      }

      [dir="rtl"] .menu-arrow.expanded {
        transform: rotate(180deg);
      }

      /* Dropdown Arrow */
      [dir="rtl"] .dropdown-arrow i {
        transform: scaleX(-1);
      }

      /* ===== Form Elements ===== */
      
      /* Input fields */
      [dir="rtl"] input,
      [dir="rtl"] select,
      [dir="rtl"] textarea {
        text-align: right;
        direction: rtl;
      }

      /* Search Input with Icon */
      [dir="rtl"] .search-input {
        padding-right: 40px;
        padding-left: 16px;
      }

      /* ===== Navigation and Routing ===== */
      
      /* Navigation Instructions */
      [dir="rtl"] .instructions {
        direction: rtl;
      }

      [dir="rtl"] .instructions::before {
        left: auto;
        right: 17px;
      }

      [dir="rtl"] .instruction {
        flex-direction: row-reverse;
        text-align: right;
      }

      [dir="rtl"] .instruction .letter,
      [dir="rtl"] .instruction .icon {
        margin-right: 0;
        margin-left: 15px;
      }

      /* Location Labels in Navigation */
      [dir="rtl"] .from,
      [dir="rtl"] .to {
        padding-left: 0;
        padding-right: 13px;
        text-align: right;
      }

      /* Navigation Steps Timeline - Move dotted line to right */
      [dir="rtl"] #navigationStepsList::before {
        left: auto;
        right: 17px;
      }

      /* Dropdown - Maintain flex structure */
      [dir="rtl"] .dropdown {
        display: flex;
        flex-direction: row-reverse; /* Reverse the order */
        align-items: center;
        gap: 0; /* Reset gap as items are adjacent */
      }

      /* Dropdown content - Maintain padding */
      [dir="rtl"] .dropdown-content {
        flex-grow: 1;
        padding: 5px;
        text-align: center;
      }

      /* Dropdown arrow - Maintain size and position */
      [dir="rtl"] .dropdown-arrow {
        order: -1; /* Move to start in RTL */
        height: 55px;
        padding: 0 12px;
      }

      /* Accessibility button if present */
      [dir="rtl"] .dropdown .accessibility-btn,
      [dir="rtl"] .dropdown [class*="accessibility"] {
        order: 0; /* Maintain middle position */
        margin: 0;
      }

      /* Floor Selector - Move to left */
      [dir="rtl"] .mapboxgl-ctrl-bottom-right {
        left: 10px;
        right: auto;
      }

      /* Nearby Container */
      [dir="rtl"] #nearbyContainer {
        left: auto !important;
        right: 20px !important;
      }

      /* Directions Panel */
      [dir="rtl"] .directions-panel {
        left: auto;
        right: 20px;
      }

      /* ===== Flexbox and Grid Layouts ===== */
      
      /* Search Section - Reverse flex direction but preserve gaps */
      [dir="rtl"] .search-section {
        direction: rtl;
        display: flex;
        flex-direction: row-reverse;
        gap: 8px; /* Preserve gap between elements */
      }

      /* Preserve button margins in search section */
      [dir="rtl"] .search-section > * {
        margin: 0; /* Reset individual margins since we use gap */
      }

      /* Categories Grid - RTL flow */
      [dir="rtl"] .categories-grid {
        direction: rtl;
      }

      /* Menu Items - Ensure proper alignment */
      [dir="rtl"] .menu-item {
        text-align: center;
      }

      /* ===== Text and Content Alignment ===== */
      
      /* Headers and Titles */
      [dir="rtl"] .header,
      [dir="rtl"] .section-title,
      [dir="rtl"] .view-title {
        text-align: right;
        direction: rtl;
      }

      /* Popular Location Items - Better RTL support */
      [dir="rtl"] .popular-location-item,
      [dir="rtl"] .location-item {
        flex-direction: row-reverse;
        text-align: right;
      }

      /* Fix icon margins in location items */
      [dir="rtl"] .popular-location-icon,
      [dir="rtl"] .location-icon {
        margin-left: 12px;
        margin-right: 0;
      }

      /* Location details alignment */
      [dir="rtl"] .popular-location-name,
      [dir="rtl"] .location-name,
      [dir="rtl"] .popular-location-distance,
      [dir="rtl"] .location-distance {
        text-align: right;
      }

      /* Filter buttons */
      [dir="rtl"] .filters {
        direction: rtl;
      }

      /* Zoom Controls - Maintain position */
      [dir="rtl"] .mapboxgl-ctrl-zoom-in,
      [dir="rtl"] .mapboxgl-ctrl-zoom-out {
        /* Keep these as is - zoom controls should stay in place */
      }

      /* Map Attribution */
      [dir="rtl"] .mapboxgl-ctrl-attrib {
        direction: rtl;
        text-align: right;
      }

      /* Location Search Results */
      [dir="rtl"] .search-results {
        text-align: right;
      }

      [dir="rtl"] .result-item {
        padding-right: 12px;
        padding-left: 8px;
      }

      /* Popup content */
      [dir="rtl"] .mapboxgl-popup {
        /* Popups may need special handling based on anchor position */
      }

      [dir="rtl"] .mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
        border-right-color: transparent;
        border-left-color: white;
      }

      [dir="rtl"] .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
        border-left-color: transparent;
        border-right-color: white;
      }

      [dir="rtl"] .mapboxgl-popup-content {
        direction: rtl;
        text-align: right;
      }

      /* ===== Special Components ===== */
      
      /* Playback Controls */
      [dir="rtl"] .playback-controls {
        direction: rtl;
      }

      [dir="rtl"] .playback-content {
        flex-direction: row-reverse;
      }

      /* Legend Items */
      [dir="rtl"] .legend-item {
        flex-direction: row-reverse;
      }

      /* Status Labels */
      // [dir="rtl"] .location-hours {
      //   flex-direction: row-reverse;
      // }

      /* ===== Accessibility Tools ===== */
      
      /* Tool Cards - Add spacing between icon and text */
      [dir="rtl"] .tool-card {
        direction: rtl;
      }

      [dir="rtl"] .tool-card i {
        margin-left: 8px;
        margin-right: 0;
      }

      [dir="rtl"] .tool-card span {
        margin-right: 5px;
      }

      /* Radio buttons and checkboxes - Add spacing */
      [dir="rtl"] input[type="radio"] + label,
      [dir="rtl"] input[type="checkbox"] + label {
        margin-right: 8px;
        margin-left: 0;
      }

      /* Toggle switches in RTL */
      [dir="rtl"] .toggle-switch {
        margin-left: 0;
        margin-right: 10px;
      }

      [dir="rtl"] .accessible-label {
        margin-left: 8px;
        margin-right: 0;
      }

      /* ===== Accessibility Enhancements ===== */
      
      /* Ensure screen readers read RTL content correctly */
      [dir="rtl"] [aria-label] {
        direction: rtl;
      }

      /* ===== Utility Classes ===== */
      
      /* Flex utilities for RTL */
      [dir="rtl"] .flex-row {
        flex-direction: row-reverse;
      }

      [dir="rtl"] .ml-auto {
        margin-left: 0;
        margin-right: auto;
      }

      [dir="rtl"] .mr-auto {
        margin-right: 0;
        margin-left: auto;
      }

      /* Text alignment utilities */
      [dir="rtl"] .text-left {
        text-align: right;
      }

      [dir="rtl"] .text-right {
        text-align: left;
      }

      /* ===== Mobile Responsive RTL ===== */
      
      @media (max-width: 768px) {
        [dir="rtl"] #navigationStepsList::before {
          right: 10px;
        }

        [dir="rtl"] .clean-step-item::before {
          right: 7px;
        }

        [dir="rtl"] .clean-step-icon {
          margin-left: 14px;
          margin-right: 0;
        }
      }

      /* ===== Bug Fixes and Edge Cases ===== */
      
      /* Fix search button positioning */
      [dir="rtl"] #languageToggleButton,
      [dir="rtl"] #nearbyToggleButton {
        margin-left: 0;
        margin-right: 8px;
      }

      /* Fix instruction list padding */
      [dir="rtl"] .instruction .text {
        text-align: right;
      }

      /* Ensure proper scrollbar position */
      [dir="rtl"] .hide-scrollbar {
        direction: rtl;
      }

      /* Fix dropdown list position */
      [dir="rtl"] .dropdown-list {
        left: 0;
        right: auto;
      }

      /* Navigation step numbers */
      [dir="rtl"] .step-number {
        margin-right: 0;
        margin-left: 10px;
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
      
      // Add RTL class to body for JavaScript checks
      document.body.classList.add('rtl-active');
      
      // Dispatch custom event for components that need JS updates
      window.dispatchEvent(new CustomEvent('rtlEnabled'));
    }
  }

  /**
   * Disable RTL styles
   */
  disableRTL() {
    if (this.rtlStyleSheet) {
      this.rtlStyleSheet.disabled = true;
      
      // Remove RTL class from body
      document.body.classList.remove('rtl-active');
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('rtlDisabled'));
    }
  }

  /**
   * Check if RTL is currently active
   * @returns {boolean}
   */
  isRTLActive() {
    return document.documentElement.dir === 'rtl';
  }

  /**
   * Get RTL-aware value (useful for dynamic calculations)
   * @param {number} ltrValue - Value for LTR
   * @param {number} rtlValue - Value for RTL
   * @returns {number}
   */
  getDirectionalValue(ltrValue, rtlValue) {
    return this.isRTLActive() ? rtlValue : ltrValue;
  }
}

// Export singleton instance
export const rtlStyleManager = new RTLStyleManager();