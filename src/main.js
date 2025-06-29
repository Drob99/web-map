/**
 * @module main
 * @description Entry point: waits for DOM readiness and bootstraps the application.
 */
// Importing the app module triggers its instantiation and startup logic.
import './app.js';

// Ensure any DOM-dependent initialization happens after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Application startup is handled in app.js’s module scope on import
  // No additional logic required here
   
});