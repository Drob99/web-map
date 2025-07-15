/**
 * @module rtlUtils
 * @description RTL utility functions following DRY principle
 * Provides reusable helpers for RTL transformations
 */

import { languageService } from "./languageService.js";

/**
 * RTL Utility Functions
 */
export const rtlUtils = {
  /**
   * Check if RTL is currently active
   * @returns {boolean}
   */
  isRTL() {
    return languageService.isRTL();
  },

  /**
   * Get directional value based on current text direction
   * @param {*} ltrValue - Value for LTR mode
   * @param {*} rtlValue - Value for RTL mode
   * @returns {*} The appropriate value based on direction
   */
  getDirectionalValue(ltrValue, rtlValue) {
    return this.isRTL() ? rtlValue : ltrValue;
  },

  /**
   * Get CSS property name based on direction
   * @param {string} property - Base property ('left' or 'right')
   * @returns {string} Appropriate property for current direction
   */
  getDirectionalProperty(property) {
    if (!this.isRTL()) return property;
    
    const propertyMap = {
      'left': 'right',
      'right': 'left',
      'marginLeft': 'marginRight',
      'marginRight': 'marginLeft',
      'paddingLeft': 'paddingRight',
      'paddingRight': 'paddingLeft',
      'borderLeft': 'borderRight',
      'borderRight': 'borderLeft'
    };
    
    return propertyMap[property] || property;
  },

  /**
   * Transform coordinates for RTL if needed
   * @param {number} x - X coordinate
   * @param {number} containerWidth - Container width
   * @returns {number} Transformed X coordinate
   */
  transformX(x, containerWidth) {
    return this.isRTL() ? containerWidth - x : x;
  },

  /**
   * Get text alignment based on direction
   * @param {string} alignment - Base alignment ('left', 'right', 'center')
   * @returns {string} Appropriate alignment for current direction
   */
  getTextAlignment(alignment) {
    if (alignment === 'center') return 'center';
    if (!this.isRTL()) return alignment;
    
    return alignment === 'left' ? 'right' : 'left';
  },

  /**
   * Mirror angle for RTL (useful for rotation transforms)
   * @param {number} angle - Angle in degrees
   * @returns {number} Mirrored angle if RTL
   */
  mirrorAngle(angle) {
    return this.isRTL() ? -angle : angle;
  },

  /**
   * Get flex direction based on RTL
   * @param {string} direction - Base direction ('row' or 'column')
   * @returns {string} Appropriate flex direction
   */
  getFlexDirection(direction) {
    if (direction === 'column' || direction === 'column-reverse') {
      return direction;
    }
    
    if (this.isRTL()) {
      return direction === 'row' ? 'row-reverse' : 'row';
    }
    
    return direction;
  },

  /**
   * Apply RTL transform to element
   * @param {HTMLElement} element - Element to transform
   * @param {Object} options - Transform options
   */
  applyRTLTransform(element, options = {}) {
    if (!element) return;
    
    const {
      flip = true,
      mirror = false,
      reverseText = false
    } = options;
    
    if (this.isRTL()) {
      if (flip) {
        element.style.transform = 'scaleX(-1)';
      }
      
      if (mirror) {
        element.style.direction = 'rtl';
      }
      
      if (reverseText) {
        element.style.unicodeBidi = 'bidi-override';
        element.style.direction = 'rtl';
      }
    } else {
      // Reset transforms
      element.style.transform = '';
      element.style.direction = '';
      element.style.unicodeBidi = '';
    }
  },

  /**
   * Get animation direction
   * @param {string} direction - Base direction ('left', 'right')
   * @returns {string} Appropriate direction for current language
   */
  getAnimationDirection(direction) {
    if (!this.isRTL()) return direction;
    
    const directionMap = {
      'left': 'right',
      'right': 'left',
      'slideInLeft': 'slideInRight',
      'slideInRight': 'slideInLeft',
      'slideOutLeft': 'slideOutRight',
      'slideOutRight': 'slideOutLeft'
    };
    
    return directionMap[direction] || direction;
  },

  /**
   * Update element position for RTL
   * @param {HTMLElement} element - Element to position
   * @param {Object} position - Position object with left/right properties
   */
  updateElementPosition(element, position) {
    if (!element) return;
    
    if (this.isRTL()) {
      if (position.left !== undefined) {
        element.style.right = position.left;
        element.style.left = 'auto';
      }
      if (position.right !== undefined) {
        element.style.left = position.right;
        element.style.right = 'auto';
      }
    } else {
      if (position.left !== undefined) {
        element.style.left = position.left;
        element.style.right = 'auto';
      }
      if (position.right !== undefined) {
        element.style.right = position.right;
        element.style.left = 'auto';
      }
    }
  },

  /**
   * Create RTL-aware class names
   * @param {string} baseClass - Base class name
   * @returns {string} Class names including RTL variant if needed
   */
  getRTLClassName(baseClass) {
    return this.isRTL() ? `${baseClass} ${baseClass}-rtl` : baseClass;
  },

  /**
   * Handle RTL for dynamic content
   * @param {HTMLElement} container - Container with dynamic content
   */
  handleDynamicContent(container) {
    if (!container || !this.isRTL()) return;
    
    // Update text inputs
    const inputs = container.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
      input.style.direction = 'rtl';
      input.style.textAlign = 'right';
    });
    
    // Update selects
    const selects = container.querySelectorAll('select');
    selects.forEach(select => {
      select.style.direction = 'rtl';
    });
    
    // Update directional icons
    const icons = container.querySelectorAll('[data-rtl-flip]');
    icons.forEach(icon => {
      this.applyRTLTransform(icon, { flip: true });
    });
  },

  /**
   * Calculate RTL-aware offset
   * @param {Object} offset - Original offset {x, y}
   * @param {number} containerWidth - Container width
   * @returns {Object} RTL-aware offset
   */
  calculateRTLOffset(offset, containerWidth) {
    if (!this.isRTL()) return offset;
    
    return {
      x: containerWidth - offset.x,
      y: offset.y
    };
  },

  /**
   * Get RTL-aware border radius
   * @param {string} borderRadius - Original border radius
   * @returns {string} RTL-aware border radius
   */
  getRTLBorderRadius(borderRadius) {
    if (!this.isRTL()) return borderRadius;
    
    // Split the border radius values
    const values = borderRadius.split(' ');
    
    if (values.length === 4) {
      // Swap top-left with top-right and bottom-left with bottom-right
      return `${values[1]} ${values[0]} ${values[3]} ${values[2]}`;
    }
    
    return borderRadius;
  },

  /**
   * Initialize RTL support for a component
   * @param {HTMLElement} component - Component element
   * @param {Object} options - Initialization options
   */
  initializeRTLSupport(component, options = {}) {
    if (!component) return;
    
    // Add RTL listener
    const handleRTLChange = () => {
      this.handleDynamicContent(component);
      
      // Call custom handler if provided
      if (options.onRTLChange) {
        options.onRTLChange(this.isRTL());
      }
    };
    
    // Listen for RTL changes
    window.addEventListener('rtlEnabled', handleRTLChange);
    window.addEventListener('rtlDisabled', handleRTLChange);
    
    // Initial setup
    handleRTLChange();
    
    // Return cleanup function
    return () => {
      window.removeEventListener('rtlEnabled', handleRTLChange);
      window.removeEventListener('rtlDisabled', handleRTLChange);
    };
  }
};