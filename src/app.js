// src/app.js

import { initUI, screensaver } from "./ui.js";
import { get_Authentication } from "./auth.js";
import { setupArrowAnimation } from "./animation/arrowAnimation.js";
import { setupMapEventHandlers } from "./markers.js";
import { switch_to_current_floor } from "./mapController.js";
import { CLIENT_ID, CLIENT_SECRET } from "./config.js";

/**
 * Bootstraps the entire app:
 * 1. Authenticate
 * 2. Fetch all data (categories → buildings → floors → layers → POIs → routes)
 * 3. Initialize UI & map interactions
 * 4. Start arrow animation
 */
export async function initializeApp() {
  try {
    screensaver();

    // 1) Auth & Data
    await get_Authentication(CLIENT_ID, CLIENT_SECRET);
    
    // 2) UI & map handlers
    initUI();
    setupMapEventHandlers();

    // 3) Arrows
    setupArrowAnimation();

    switch_to_current_floor();
  } catch (err) {
    console.error("Error initializing app:", err);
  }
}