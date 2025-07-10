/**
 * @module app
 * @description Bootstraps and starts the application, wiring together authentication,
 * UI, map handlers, animations, and floor display.
 */
import { initUI, screensaver } from "./ui.js";
import { authenticate } from "./auth.js";
import { setupArrowAnimation } from "./animation/arrowAnimation.js";
import { setupMapEventHandlers } from "./markers.js";
import { switchFloorByNo } from "./mapController.js";
import { API_CONFIG } from "./config.js";
import { map } from "./mapInit.js";
import { setupMapLanguageListener } from "./mapController.js";
import { playbackControls } from "./navigation/navigationPlaybackControls.js";



/**
 * Main application class following Dependency Injection (DI) and Single Responsibility.
 */
export default class App {
  /**
   * @param {Object} services - The external services this app depends on.
   * @param {Function} services.authenticate - Function to authenticate (credentials injection).
   * @param {Function} services.initUI - Function to initialize UI.
   * @param {Function} services.initMapHandlers - Function to set up map event handlers.
   * @param {Function} services.initArrowAnimation - Function to start arrow animations.
   * @param {Function} services.displayFloor - Function to display the current floor.
   * @param {Function} services.hideSplash - Function to hide the splash screen.
   * @param {Object} config - Configuration constants.
   */
  constructor(
    {
      authenticate,
      initUI,
      initMapHandlers,
      initArrowAnimation,
      displayFloor,
      hideSplash,
    },
    config
  ) {
    this.authenticate = authenticate;
    this.initUI = initUI;
    this.initMapHandlers = initMapHandlers;
    this.initArrowAnimation = initArrowAnimation;
    this.displayFloor = displayFloor;
    this.hideSplash = hideSplash;
    this.config = config;
  }

  /**
   * Bootstraps the app in defined steps, handling errors gracefully.
   */
  async start() {
    try {
      // 1) Authenticate with provided credentials
      const { CLIENT_ID, CLIENT_SECRET } = this.config;
      await this.authenticate(CLIENT_ID, CLIENT_SECRET);
    }
    catch (authError) {
      console.error("Authentication error failed:", authError);
    }
    await Promise.all([
      new Promise((resolve) => map.on("load", resolve)),
    ]);


    // 2) Initialize UI and map interactions
    this.initUI();
    playbackControls.init();
    this.initMapHandlers();

    // 3) Display the current floor
    this.displayFloor();

    // 4) Set up language change listener for the map
    setupMapLanguageListener();

    // 5) Hide splash screen *now* that both map + data are ready
    this.hideSplash();
  }
}

/**
 * Instantiate and launch the application.
 */
const app = new App(
  {
    authenticate: authenticate,
    initUI,
    displayFloor: switchFloorByNo,
    initMapHandlers: setupMapEventHandlers,
    hideSplash: screensaver,
  },
  API_CONFIG
);

app.start();

