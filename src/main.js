/**
 * @module main
 * @description Entry point: waits for DOM readiness and bootstraps the application.
 */
// Importing the app module triggers its instantiation and startup logic.
import './app.js';
import { initUI, languageMenu } from './ui.js';
import { initMenuNavigation } from './menu-navigation.js';
import { loadTerminalsOutlines } from "./markers.js";

// Ensure any DOM-dependent initialization happens after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Application startup is handled in app.js's module scope on import
  // Initialize menu navigation system
  initMenuNavigation();
  loadTerminalsOutlines();
    // Initial check to set the correct state
  //toggleSearchSection();
});
//  // Function to toggle the visibility of the search section
// function toggleSearchSection() {
//   const categoriesSection = document.getElementById('categoriesSection');
//   const searchSection = document.querySelector('.search-section');

//   // Ensure the element exists before proceeding
//   if (!categoriesSection || !searchSection) {
//     console.error('Either #categoriesSection or .search-section is missing in the DOM.');
//     return;
//   }

//   // Check the computed display value of #categoriesSection
//   const categoryDisplay = window.getComputedStyle(categoriesSection).display;

//   if (categoryDisplay === 'none') {
//     // Hide the search section
//     searchSection.style.setProperty('display', 'none', 'important');
//   } else {
//     // Show the search section
//     searchSection.style.setProperty('display', 'block', 'important');
//   }
//   console.log('Computed display of #categoriesSection:', categoryDisplay);
// console.log('Setting .search-section display to:', categoryDisplay === 'none' ? 'none' : 'block');
// }

// // Create a MutationObserver to watch for changes in #categoriesSection
// const observer = new MutationObserver(() => {
//   toggleSearchSection(); // Call the toggle function on changes
// });

// // Observe #categoriesSection for style attribute changes
// observer.observe(document.getElementById('categoriesSection'), {
//   attributes: true, // Look for attribute changes
//   attributeFilter: ['style'] // Only react to style changes
// });


// Listen for language changes
window.addEventListener('languageChanged', (event) => {
  console.log('Language changed to:', event.detail.language);
  
  // Any additional global updates needed when language changes
  // This event can be listened to by any module that needs to react to language changes
});
