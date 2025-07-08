/**
 * @module navigationPlaybackControls
 * @description UI controls for navigation playback
 */

import { navigationPlayback } from './navigationPlayback.js';
import { state } from '../config.js';

export class NavigationPlaybackControls {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.currentStepIndex = 0;
  }
  
  init() {
    this.createHTML();
    this.attachEventListeners();
  }
  
  createHTML() {
    this.container = document.createElement('div');
    this.container.id = 'playback-controls';
    this.container.className = 'playback-controls hidden';
    this.container.innerHTML = `
      <div class="playback-header">
        <span class="playback-title">Navigation Preview</span>
        <button class="playback-close">&times;</button>
      </div>
      <div class="playback-body">
        <div class="playback-progress">
          <div class="playback-progress-bar">
            <div class="playback-progress-fill"></div>
          </div>
          <div class="playback-time">
            <span class="playback-elapsed">0:00</span>
            <span class="playback-duration">0:00</span>
          </div>
        </div>
        <div class="playback-controls-row">
          <button class="playback-btn play-btn">
            <i class="fas fa-play"></i>
          </button>
          <button class="playback-btn pause-btn hidden">
            <i class="fas fa-pause"></i>
          </button>
          <button class="playback-btn stop-btn">
            <i class="fas fa-stop"></i>
          </button>
          <div class="playback-speed">
            <label>Speed:</label>
            <select class="speed-select">
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
    
    document.body.appendChild(this.container);
  }
  
  attachEventListeners() {
    // Play/Pause
    this.container.querySelector('.play-btn').addEventListener('click', () => {
      navigationPlayback.play();
      this.updatePlayPauseButtons(true);
    });
    
    this.container.querySelector('.pause-btn').addEventListener('click', () => {
      navigationPlayback.pause();
      this.updatePlayPauseButtons(false);
    });
    
    // Stop
    this.container.querySelector('.stop-btn').addEventListener('click', () => {
      navigationPlayback.stop();
      this.hide();
    });
    
    // Close
    this.container.querySelector('.playback-close').addEventListener('click', () => {
      navigationPlayback.stop();
      this.hide();
    });
    
    // Speed
    this.container.querySelector('.speed-select').addEventListener('change', (e) => {
      navigationPlayback.setSpeed(parseFloat(e.target.value));
    });
    
    // Progress bar click
    this.container.querySelector('.playback-progress-bar').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const progress = (e.clientX - rect.left) / rect.width;
      navigationPlayback.seekTo(progress);
    });
  }
  
  show() {
    const initialized = navigationPlayback.initialize({
      onProgress: (progress, stepIndex) => this.updateProgress(progress, stepIndex),
      onComplete: () => this.hide(),
      onFloorChange: (floor) => this.updateFloor(floor)
    });
    
    if (!initialized) {
      alert('No route available for playback');
      return;
    }
    
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.updateFloor(state.levelRoutePoi);
    this.linkToNavigationSteps();
    this.connectToEndRoute();
  }
  
  hide() {
    this.isVisible = false;
    this.container.classList.add('hidden');
    this.updatePlayPauseButtons(false);
    this.unhighlightAllSteps();
  }
  
  updatePlayPauseButtons(isPlaying) {
    const playBtn = this.container.querySelector('.play-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    
    if (isPlaying) {
      playBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      playBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }
  }
  
  updateProgress(progress, stepIndex) {
    // Update progress bar
    const fillBar = this.container.querySelector('.playback-progress-fill');
    fillBar.style.width = `${progress * 100}%`;
    
    // Update time
    const duration = navigationPlayback.config.animationDuration / 1000;
    const elapsed = duration * progress;
    
    this.container.querySelector('.playback-elapsed').textContent = this.formatTime(elapsed);
    this.container.querySelector('.playback-duration').textContent = this.formatTime(duration);
    
    // Update step highlighting
    this.updateStepHighlight(stepIndex);
  }
  
  updateFloor(floor) {
    const floorLabel = floor === 0 ? 'G' : floor.toString();
    this.container.querySelector('.current-floor').textContent = floorLabel;
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  linkToNavigationSteps() {
    // Support clicking on steps whether they're in navigationStepsList or instructions
    
    // Handler for navigation steps (when visible)
    const navigationStepsList = document.getElementById('navigationStepsList');
    if (navigationStepsList) {
      navigationStepsList.addEventListener('click', (e) => {
        if (!this.isVisible) return;
        
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
      });
    }
    
    // Handler for instruction steps (fallback)
    const instructionsContainer = document.getElementById('instructions');
    if (instructionsContainer) {
      instructionsContainer.addEventListener('click', (e) => {
        if (!this.isVisible) return;
        
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
      });
    }
  }
  
  connectToEndRoute() {
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
  }
  
  updateStepHighlight(stepIndex) {
    const steps = document.querySelectorAll('#instructions > div');
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
  }
  
  unhighlightAllSteps() {
    const steps = document.querySelectorAll('#instructions > div');
    steps.forEach(step => {
      step.classList.remove('current-step', 'completed-step');
    });
  }
}

export const playbackControls = new NavigationPlaybackControls();