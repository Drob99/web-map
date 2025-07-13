/**
 * @module navigationPlaybackControls
 * @description UI controls for navigation playback with defensive programming
 */

import { navigationPlayback } from './navigationPlayback.js';
import { state } from '../config.js';

/**
 * NavigationPlaybackControls Class
 * 
 * Follows SOLID Principles:
 * - Single Responsibility: Manages only the playback UI controls
 * - Open/Closed: Can be extended without modifying core functionality
 * - Liskov Substitution: Can be replaced with any compatible implementation
 * - Interface Segregation: Exposes only necessary public methods
 * - Dependency Inversion: Depends on abstractions (navigationPlayback interface)
 */
export class NavigationPlaybackControls {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.currentStepIndex = 0;
    this.isInitialized = false;
  }
  
  /**
   * Initialize the playback controls
   * This method is idempotent - safe to call multiple times
   * @returns {boolean} true if initialization was successful
   */
  init() {
    try {
      if (this.isInitialized && this.container) {
        console.log('NavigationPlaybackControls already initialized');
        return true;
      }
      
      this.createHTML();
      this.attachEventListeners();
      this.isInitialized = true;
      
      console.log('NavigationPlaybackControls initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NavigationPlaybackControls:', error);
      return false;
    }
  }
  
  /**
   * Ensure the component is initialized before use
   * Implements the Guard Clause pattern for defensive programming
   * @returns {boolean} true if ready to use
   */
  _ensureInitialized() {
    if (!this.isInitialized || !this.container) {
      console.log('Auto-initializing NavigationPlaybackControls...');
      return this.init();
    }
    return true;
  }
  
  /**
   * Create the HTML structure for playback controls
   * Follows the Builder pattern for complex object construction
   */
  createHTML() {
    // Clean up existing container if it exists
    if (this.container) {
      this.container.remove();
    }
    
    this.container = document.createElement('div');
    this.container.id = 'playback-controls';
    this.container.className = 'playback-controls hidden';
    
    // Using template literals for better readability and maintainability
    this.container.innerHTML = this._getControlsTemplate();
    
    // Safely append to document body
    if (document.body) {
      document.body.appendChild(this.container);
    } else {
      throw new Error('Document body not available for controls injection');
    }
  }
  
  /**
   * Get the HTML template for controls
   * Separated for better maintainability and testing
   * @returns {string} HTML template
   */
  _getControlsTemplate() {
    return `
      <div class="playback-header">
        <span class="playback-title">Navigation Preview</span>
        <button class="playback-close" aria-label="Close playback controls">&times;</button>
      </div>
      <div class="playback-body">
        <div class="playback-progress">
          <div class="playback-progress-bar" role="progressbar" aria-label="Playback progress">
            <div class="playback-progress-fill"></div>
          </div>
          <div class="playback-time">
            <span class="playback-elapsed">0:00</span>
            <span class="playback-duration">0:00</span>
          </div>
        </div>
        <div class="playback-controls-row">
          <button class="playback-btn play-btn" aria-label="Play navigation">
            <i class="fas fa-play"></i>
          </button>
          <button class="playback-btn pause-btn hidden" aria-label="Pause navigation">
            <i class="fas fa-pause"></i>
          </button>
          <button class="playback-btn stop-btn" aria-label="Stop navigation">
            <i class="fas fa-stop"></i>
          </button>
          <div class="playback-speed">
            <label for="speed-select">Speed:</label>
            <select class="speed-select" id="speed-select" aria-label="Playback speed">
              <option value="0.5">0.5x</option>
              <option value="1" selected>1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
        <div class="playback-floor-info">
          Floor: <span class="current-floor">-</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Attach event listeners to control elements
   * Uses delegation pattern for better performance and maintainability
   */
  attachEventListeners() {
    if (!this.container) {
      throw new Error('Cannot attach event listeners: container not initialized');
    }
    
    // Play/Pause buttons
    this._attachPlayPauseListeners();
    
    // Control buttons (stop, close)
    this._attachControlListeners();
    
    // Speed control
    this._attachSpeedListener();
    
    // Progress bar interaction
    this._attachProgressListener();
  }
  
  /**
   * Attach play/pause button listeners
   * Separated for better code organization
   */
  _attachPlayPauseListeners() {
    const playBtn = this.container.querySelector('.play-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        try {
          navigationPlayback.play();
          this.updatePlayPauseButtons(true);
        } catch (error) {
          console.error('Error playing navigation:', error);
          this._showError('Failed to start playback');
        }
      });
    }
    
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        try {
          navigationPlayback.pause();
          this.updatePlayPauseButtons(false);
        } catch (error) {
          console.error('Error pausing navigation:', error);
          this._showError('Failed to pause playback');
        }
      });
    }
  }
  
  /**
   * Attach control button listeners (stop, close)
   */
  _attachControlListeners() {
    const stopBtn = this.container.querySelector('.stop-btn');
    const closeBtn = this.container.querySelector('.playback-close');
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        try {
          navigationPlayback.stop();
          this.hide();
        } catch (error) {
          console.error('Error stopping navigation:', error);
          this._showError('Failed to stop playback');
        }
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        try {
          navigationPlayback.stop();
          this.hide();
        } catch (error) {
          console.error('Error closing playback:', error);
          // Even if stopping fails, still hide the controls
          this.hide();
        }
      });
    }
  }
  
  /**
   * Attach speed control listener
   */
  _attachSpeedListener() {
    const speedSelect = this.container.querySelector('.speed-select');
    
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        try {
          const speed = parseFloat(e.target.value);
          if (isNaN(speed) || speed <= 0) {
            throw new Error('Invalid speed value');
          }
          navigationPlayback.setSpeed(speed);
        } catch (error) {
          console.error('Error setting playback speed:', error);
          this._showError('Failed to change playback speed');
        }
      });
    }
  }
  
  /**
   * Attach progress bar click listener
   */
  _attachProgressListener() {
    const progressBar = this.container.querySelector('.playback-progress-bar');
    
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        try {
          const rect = e.currentTarget.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          navigationPlayback.seekTo(progress);
        } catch (error) {
          console.error('Error seeking in playback:', error);
          this._showError('Failed to seek in playback');
        }
      });
    }
  }
  
  /**
   * Show the playback controls
   * Implements the Command pattern with error handling
   * @returns {boolean} true if successfully shown
   */
  show() {
    try {
      // Defensive programming: ensure initialization
      if (!this._ensureInitialized()) {
        throw new Error('Failed to initialize playback controls');
      }
      
      // Validate that container exists after initialization
      if (!this.container) {
        throw new Error('Playback controls container is not available');
      }
      
      // Initialize the navigation playback system
      const initialized = navigationPlayback.initialize({
        onProgress: (progress, stepIndex) => this.updateProgress(progress, stepIndex),
        onComplete: () => this.hide(),
        onFloorChange: (floor) => this.updateFloor(floor)
      });
      
      if (!initialized) {
        alert('No route available for playback');
        return false;
      }
      
      // Show the controls
      this.isVisible = true;
      this.container.classList.remove('hidden');
      this.updateFloor(state.levelRoutePoi);
      this.linkToNavigationSteps();
      this.connectToEndRoute();
      
      return true;
    } catch (error) {
      console.error('Error showing playback controls:', error);
      this._showError('Failed to show playback controls: ' + error.message);
      return false;
    }
  }
  
  /**
   * Hide the playback controls
   * Implements cleanup to prevent memory leaks
   */
  hide() {
    try {
      if (!this.container) {
        console.warn('Cannot hide controls: container not initialized');
        return;
      }
      
      this.isVisible = false;
      this.container.classList.add('hidden');
      this.updatePlayPauseButtons(false);
      this.unhighlightAllSteps();
    } catch (error) {
      console.error('Error hiding playback controls:', error);
    }
  }
  
  /**
   * Update play/pause button visibility
   * @param {boolean} isPlaying - Whether playback is currently active
   */
  updatePlayPauseButtons(isPlaying) {
    if (!this.container) return;
    
    const playBtn = this.container.querySelector('.play-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    
    if (playBtn && pauseBtn) {
      if (isPlaying) {
        playBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
      } else {
        playBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
      }
    }
  }
  
  /**
   * Update the progress bar and time display
   * @param {number} progress - Progress value between 0 and 1
   * @param {number} stepIndex - Current step index
   */
  updateProgress(progress, stepIndex) {
    if (!this.container) return;
    
    try {
      // Update progress bar
      const fillBar = this.container.querySelector('.playback-progress-fill');
      if (fillBar) {
        fillBar.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
      }
      
      // Update time display
      const duration = navigationPlayback.config.animationDuration / 1000;
      const elapsed = duration * progress;
      
      const elapsedElement = this.container.querySelector('.playback-elapsed');
      const durationElement = this.container.querySelector('.playback-duration');
      
      if (elapsedElement) {
        elapsedElement.textContent = this.formatTime(elapsed);
      }
      if (durationElement) {
        durationElement.textContent = this.formatTime(duration);
      }
      
      // Update step highlighting
      this.updateStepHighlight(stepIndex);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }
  
  /**
   * Update the current floor display
   * @param {number} floor - Current floor number
   */
  updateFloor(floor) {
    if (!this.container) return;
    
    try {
      const floorLabel = floor === 0 ? 'G' : floor.toString();
      const floorElement = this.container.querySelector('.current-floor');
      if (floorElement) {
        floorElement.textContent = floorLabel;
      }
    } catch (error) {
      console.error('Error updating floor display:', error);
    }
  }
  
  /**
   * Format time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Link playback controls to navigation steps for interactive seeking
   */
  linkToNavigationSteps() {
    if (!this.isVisible) return;
    
    try {
      // Handler for navigation steps (when visible)
      this._linkToNavigationStepsList();
      
      // Handler for instruction steps (fallback)
      this._linkToInstructionSteps();
    } catch (error) {
      console.error('Error linking to navigation steps:', error);
    }
  }
  
  /**
   * Link to navigation steps list
   */
  _linkToNavigationStepsList() {
    const navigationStepsList = document.getElementById('navigationStepsList');
    if (!navigationStepsList) return;
    
    navigationStepsList.addEventListener('click', (e) => {
      if (!this.isVisible) return;
      
      try {
        // Find clicked step
        const stepElement = e.target.closest('.clean-step-item');
        if (!stepElement) return;
        
        // Find all steps
        const allSteps = Array.from(navigationStepsList.querySelectorAll('.clean-step-item'));
        const stepIndex = allSteps.indexOf(stepElement);
        
        if (stepIndex >= 0) {
          const progress = stepIndex / Math.max(1, allSteps.length - 1);
          navigationPlayback.seekTo(progress);
        }
      } catch (error) {
        console.error('Error handling navigation step click:', error);
      }
    });
  }
  
  /**
   * Link to instruction steps (fallback)
   */
  _linkToInstructionSteps() {
    const instructionsContainer = document.getElementById('instructions');
    if (!instructionsContainer) return;
    
    instructionsContainer.addEventListener('click', (e) => {
      if (!this.isVisible) return;
      
      try {
        // Find clicked instruction
        const instructionElement = e.target.closest('li.instruction');
        if (!instructionElement) return;
        
        // Find all instructions
        const allInstructions = Array.from(instructionsContainer.querySelectorAll('li.instruction'));
        const instructionIndex = allInstructions.indexOf(instructionElement);
        
        if (instructionIndex >= 0) {
          const progress = instructionIndex / Math.max(1, allInstructions.length - 1);
          navigationPlayback.seekTo(progress);
        }
      } catch (error) {
        console.error('Error handling instruction click:', error);
      }
    });
  }
  
  /**
   * Connect to end route functionality
   */
  connectToEndRoute() {
    try {
      // Listen for End Route button clicks
      const endRouteBtn = document.getElementById('endroute');
      if (endRouteBtn) {
        endRouteBtn.addEventListener('click', () => {
          if (this.isVisible) {
            navigationPlayback.stop();
            this.hide();
          }
        });
      }
      
      // Also listen for clear route events
      window.addEventListener('routeCleared', () => {
        if (this.isVisible) {
          navigationPlayback.stop();
          this.hide();
        }
      });
    } catch (error) {
      console.error('Error connecting to end route:', error);
    }
  }
  
  /**
   * Update step highlighting based on current progress
   * @param {number} stepIndex - Current step index
   */
  updateStepHighlight(stepIndex) {
    try {
      const steps = document.querySelectorAll('#instructions > div');
      if (!steps.length) return;
      
      const totalSteps = steps.length;
      const currentStep = Math.floor((stepIndex / navigationPlayback.routeCoordinates.length) * totalSteps);
      
      if (currentStep !== this.currentStepIndex) {
        this.currentStepIndex = currentStep;
        
        steps.forEach((step, index) => {
          step.classList.remove('current-step', 'completed-step');
          
          if (index < currentStep) {
            step.classList.add('completed-step');
          } else if (index === currentStep) {
            step.classList.add('current-step');
          }
        });
      }
    } catch (error) {
      console.error('Error updating step highlight:', error);
    }
  }
  
  /**
   * Remove highlighting from all steps
   */
  unhighlightAllSteps() {
    try {
      const steps = document.querySelectorAll('#instructions > div');
      steps.forEach(step => {
        step.classList.remove('current-step', 'completed-step');
      });
    } catch (error) {
      console.error('Error unhighlighting steps:', error);
    }
  }
  
  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  _showError(message) {
    console.error(`NavigationPlaybackControls Error: ${message}`);
    // You could implement a toast notification or alert here
    // For now, we'll just log it to console
  }
  
  /**
   * Cleanup method for destroying the component
   * Implements proper resource cleanup to prevent memory leaks
   */
  destroy() {
    try {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
      
      this.isVisible = false;
      this.isInitialized = false;
      this.currentStepIndex = 0;
      
      console.log('NavigationPlaybackControls destroyed successfully');
    } catch (error) {
      console.error('Error destroying NavigationPlaybackControls:', error);
    }
  }
}

// Export singleton instance
export const playbackControls = new NavigationPlaybackControls();