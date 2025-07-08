/**
 * @module navigationPlayback
 * @description Handles automated navigation playback along a route
 */

import { map } from '../mapInit.js';
import { state } from '../config.js';
import { switchFloorByNo } from '../mapController.js';

export class NavigationPlayback {
  constructor() {
    this.isPlaying = false;
    this.isPaused = false;
    this.animationId = null;
    this.startTime = null;
    this.currentPhase = 0;
    
    this.config = {
      animationDuration: 60000,
      speedMultiplier: 1.0
    };
    
    this.routeCoordinates = [];
    this.routeLevels = [];
    this.currentIndex = 0;
    this.navigationArrow = null;
    
    this.onProgress = null;
    this.onComplete = null;
    this.onFloorChange = null;
    
    // Step tracking
    this.stepBoundaries = [];
    this.currentStepIndex = -1;
  }
  
  initialize(callbacks = {}) {
    // Check if route exists
    if (!state.fullPathRoute?.features?.[0]?.geometry?.coordinates?.length) {
      console.error('No route available for playback');
      return false;
    }
    
    // Extract route data
    this.routeCoordinates = state.fullPathRoute.features[0].geometry.coordinates;
    this.routeLevels = this.extractLevels();
    
    // Set callbacks
    this.onProgress = callbacks.onProgress || (() => {});
    this.onComplete = callbacks.onComplete || (() => {});
    this.onFloorChange = callbacks.onFloorChange || (() => {});
    
    // Calculate duration based on route length
    const routeLength = this.calculateRouteLength();
    this.config.animationDuration = Math.max(30000, routeLength * 100);
    
    // Map steps after a short delay to ensure they are rendered
    setTimeout(() => {
      this.mapStepsToRoute();
    }, 100);
    
    return true;
  }
  
  extractLevels() {
    const levels = [];
    const routeArray = state.routeArray || [];
    
    routeArray.forEach((nodeId, index) => {
      if (state.routesArray[nodeId]) {
        const parts = state.routesArray[nodeId].split(',');
        levels[index] = parseInt(parts[2]) || 0;
      } else {
        levels[index] = state.levelRoutePoi || 0;
      }
    });
    
    return levels;
  }
  
  calculateRouteLength() {
    let length = 0;
    for (let i = 1; i < this.routeCoordinates.length; i++) {
      const [lng1, lat1] = this.routeCoordinates[i - 1];
      const [lng2, lat2] = this.routeCoordinates[i];
      length += turf.distance([lng1, lat1], [lng2, lat2], { units: 'meters' });
    }
    return length;
  }
  
  mapStepsToRoute() {
    // Target the correct elements based on the actual HTML structure
    const navigationStepsList = document.getElementById('navigationStepsList');
    if (!navigationStepsList) {
      console.warn('navigationStepsList not found, trying instructions container');
      // Fallback to instructions container if steps are not shown
      const instructionElements = document.querySelectorAll('#instructions li.instruction');
      if (instructionElements.length > 0) {
        this.mapInstructionsToRoute(instructionElements);
        return;
      }
    }
    
    // Get all clean step items (excluding headers)
    const stepElements = navigationStepsList.querySelectorAll('.clean-step-item');
    const steps = [];
    
    // Extract steps information
    stepElements.forEach((elem, index) => {
      // Skip if it's a location header
      if (elem.closest('.location-header')) return;
      
      steps.push({
        element: elem,
        index: index
      });
    });
    
    // Map each step to route progress
    if (steps.length > 0) {
      const segmentSize = this.routeCoordinates.length / steps.length;
      
      steps.forEach((step, index) => {
        this.stepBoundaries.push({
          startIndex: Math.floor(index * segmentSize),
          endIndex: Math.floor((index + 1) * segmentSize),
          element: step.element,
          stepIndex: index
        });
      });
    }
  }
  
  // Add fallback method for instructions
  mapInstructionsToRoute(instructionElements) {
    const steps = [];
    
    instructionElements.forEach((elem, index) => {
      steps.push({
        element: elem,
        index: index
      });
    });
    
    if (steps.length > 0) {
      const segmentSize = this.routeCoordinates.length / steps.length;
      
      steps.forEach((step, index) => {
        this.stepBoundaries.push({
          startIndex: Math.floor(index * segmentSize),
          endIndex: Math.floor((index + 1) * segmentSize),
          element: step.element,
          stepIndex: index
        });
      });
    }
  }
  
  createNavigationArrow() {
    if (this.navigationArrow) {
      this.navigationArrow.remove();
    }
    
    const el = document.createElement('div');
    el.style.cssText = `
      width: 0;
      height: 0;
      border-left: 15px solid transparent;
      border-right: 15px solid transparent;
      border-bottom: 40px solid #007AFF;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      transform: translate(-50%, -100%);
    `;
    
    this.navigationArrow = new mapboxgl.Marker({
      element: el,
      rotationAlignment: 'map',
      anchor: 'bottom'
    });
  }
  
  play() {
    if (!this.routeCoordinates.length) return;
    
    this.isPlaying = true;
    this.isPaused = false;
    
    if (!this.startTime) {
      this.startTime = performance.now();
      this.createNavigationArrow();
      
      // Re-map steps when playing in case they changed
      this.mapStepsToRoute();
    } else if (this.isPaused) {
      // Resume from pause
      this.startTime = performance.now() - (this.currentPhase * this.config.animationDuration);
    }
    
    this.animate();
  }
  
  pause() {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPhase = 0;
    this.startTime = null;
    this.currentIndex = 0;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.navigationArrow) {
      this.navigationArrow.remove();
      this.navigationArrow = null;
    }
    
    // Clear step highlights
    if (this.stepBoundaries) {
      this.stepBoundaries.forEach(boundary => {
        boundary.element.classList.remove('current-step', 'completed-step');
        boundary.element.style.background = '';
        boundary.element.style.borderLeft = '';
        // Reset step icon colors
        const stepIcon = boundary.element.querySelector('.clean-step-icon');
        if (stepIcon) {
          stepIcon.style.backgroundColor = '#e3e3e3';
        }
      });
    }
    
    // Restore camera to overview of route
    if (this.routeCoordinates.length > 0) {
      const bounds = this.routeCoordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(this.routeCoordinates[0], this.routeCoordinates[0]));
      
      map.fitBounds(bounds, {
        padding: 100,
        duration: 1000
      });
    }
    
    this.onComplete();
  }
  
  animate() {
    if (!this.isPlaying || this.isPaused) return;
    
    const elapsed = performance.now() - this.startTime;
    this.currentPhase = Math.min(elapsed / (this.config.animationDuration / this.config.speedMultiplier), 1);
    
    if (this.currentPhase >= 1) {
      this.stop();
      return;
    }
    
    // Calculate current position
    const totalSegments = this.routeCoordinates.length - 1;
    const currentSegment = this.currentPhase * totalSegments;
    const segmentIndex = Math.floor(currentSegment);
    const segmentProgress = currentSegment - segmentIndex;
    
    // Check which step we're in
    const currentStep = this.stepBoundaries.find(boundary => 
      segmentIndex >= boundary.startIndex && segmentIndex < boundary.endIndex
    );
    
    if (currentStep && currentStep.stepIndex !== this.currentStepIndex) {
      this.currentStepIndex = currentStep.stepIndex;
      this.highlightStep(currentStep);
    }
    
    const from = this.routeCoordinates[segmentIndex];
    const to = this.routeCoordinates[Math.min(segmentIndex + 1, totalSegments)];
    
    // Interpolate position
    const currentLng = from[0] + (to[0] - from[0]) * segmentProgress;
    const currentLat = from[1] + (to[1] - from[1]) * segmentProgress;
    const currentPosition = [currentLng, currentLat];
    
    // Update arrow
    if (this.navigationArrow) {
      const bearing = turf.bearing(from, to);
      this.navigationArrow
        .setLngLat(currentPosition)
        .setRotation(bearing)
        .addTo(map);
    }
    
    // Check floor change
    const currentLevel = this.routeLevels[segmentIndex] || 0;
    if (currentLevel !== state.levelRoutePoi) {
      this.switchToFloor(currentLevel);
    }
    
    // Update camera
    map.easeTo({
      center: currentPosition,
      zoom: 20,
      bearing: turf.bearing(from, to),
      pitch: 60,
      duration: 100
    });
    
    // Update progress
    this.onProgress(this.currentPhase, segmentIndex);
    
    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  highlightStep(stepInfo) {
    // Remove all highlights
    this.stepBoundaries.forEach(boundary => {
      boundary.element.classList.remove('current-step', 'completed-step');
      boundary.element.style.background = '';
      boundary.element.style.borderLeft = '';
      
      // Reset step icon background
      const stepIcon = boundary.element.querySelector('.clean-step-icon');
      if (stepIcon) {
        stepIcon.style.backgroundColor = '#e3e3e3';
      }
    });
    
    // Highlight completed steps
    this.stepBoundaries.forEach(boundary => {
      if (boundary.stepIndex < stepInfo.stepIndex) {
        boundary.element.classList.add('completed-step');
        // Change icon background to green for completed
        const stepIcon = boundary.element.querySelector('.clean-step-icon');
        if (stepIcon) {
          stepIcon.style.backgroundColor = '#28a745';
        }
      }
    });
    
    // Highlight current step
    stepInfo.element.classList.add('current-step');
    stepInfo.element.style.background = 'rgba(0, 122, 255, 0.1)';
    stepInfo.element.style.borderLeft = '4px solid #007AFF';
    
    // Highlight current step icon
    const currentStepIcon = stepInfo.element.querySelector('.clean-step-icon');
    if (currentStepIcon) {
      currentStepIcon.style.backgroundColor = '#007AFF';
    }
    
    // Scroll into view if steps are visible
    const navigationView = document.querySelector('.navigation-view');
    if (navigationView && navigationView.style.display !== 'none') {
      stepInfo.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
  
  switchToFloor(level) {
    state.levelRoutePoi = level;
    switchFloorByNo(level);
    
    // Update route visibility
    const levelStr = level.toString();
    
    // Show current floor route in blue
    if (map.getLayer('route')) {
      map.setFilter('route', ['==', 'level', levelStr]);
    }
    if (map.getLayer('route_outline')) {
      map.setFilter('route_outline', ['==', 'level', levelStr]);
    }
    
    // Show other floors in gray
    if (map.getLayer('route_another')) {
      map.setFilter('route_another', ['!=', 'level', levelStr]);
    }
    if (map.getLayer('route_another_outline')) {
      map.setFilter('route_another_outline', ['!=', 'level', levelStr]);
    }
    
    this.onFloorChange(level);
  }
  
  setSpeed(speed) {
    const wasPlaying = this.isPlaying && !this.isPaused;
    this.config.speedMultiplier = Math.max(0.5, Math.min(2, speed));
    
    if (wasPlaying) {
      // Adjust start time to maintain position
      const elapsed = performance.now() - this.startTime;
      this.startTime = performance.now() - (elapsed / this.config.speedMultiplier);
    }
  }
  
  seekTo(progress) {
    this.currentPhase = Math.max(0, Math.min(1, progress));
    this.startTime = performance.now() - (this.currentPhase * this.config.animationDuration);
    
    if (!this.isPlaying) {
      // Show position without playing
      this.animate();
      cancelAnimationFrame(this.animationId);
    }
  }
}

export const navigationPlayback = new NavigationPlayback();