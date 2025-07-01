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

    map.on("load", () => {
      // 2) Initialize UI and map interactions
      this.initUI();
      this.initMapHandlers();

      // 3) Start animations
      this.initArrowAnimation();

      // 4) Display the current floor
      this.displayFloor();

      // 5) Hide splash screen
      this.hideSplash();
    });
  }
}

/**
 * Instantiate and launch the application.
 */
const app = new App(
  {
    authenticate: authenticate,
    initUI,
    initMapHandlers: setupMapEventHandlers,
    initArrowAnimation: setupArrowAnimation,
    displayFloor: switchFloorByNo,
    hideSplash: screensaver,
  },
  API_CONFIG
);

app.start();
