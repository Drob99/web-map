/**
 * @module main
 * @description Entry point: waits for DOM readiness and bootstraps the application.
 */
// Importing the app module triggers its instantiation and startup logic.
import './app.js';
import { initUI, languageMenu } from './ui.js';

// Ensure any DOM-dependent initialization happens after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Application startup is handled in app.js’s module scope on import
  // No additional logic required here
   
});

// Listen for language changes
window.addEventListener('languageChanged', (event) => {
  console.log('Language changed to:', event.detail.language);
  
  // Any additional global updates needed when language changes
  // This event can be listened to by any module that needs to react to language changes
});
