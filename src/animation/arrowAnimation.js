/**
 * @module arrowAnimation
 * @description Computes and animates directional arrows along the current route.
 */
import { map } from '../mapInit.js';
import { ANIMATION_CONFIG, state } from '../config.js';

// Import turf for bearing calculations
const turf = window.turf || {};

let worker = null;
let arrowAnimationState = [];
let animationFrameId = null;
let isAnimating = false;
const animationSpeed = 0.5;

const arrowDataURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAA7NJREFUeJzVm71uFUcYht9JgUVQHFpsKRI0MU64AcB3gJDTB/MjoEgRoSgYWjpL9EhICCMkikiJgsgVWIgbiHL4aSgQtpIujkiAhPihOD5g7D1n55v5ZtZ+yuPdmXdm3m+97+6s1BHAOeAP4HfgTFc6OgGYBt7wnv+Aqa51VQNYZCs3utZVBWASeN0wAa+Aidp6PqrdoaQLknY1/D4m6dvKWuoCjAN/Nqz+gFVgb01NtR3wjaRPR/x9XNL5SlrqAowBKyNWf8Ay0FQiRajpgDlJ+yKOm5D0dWEtdQEC8DBi9Qc8Brq4QJcB+Mow+AHHu9btBvAgYQLud63bBWAmYfADjnStPxvgl4wJuNu1/iyAKeD/jAlYA6ZLaix9pb2U2UeQ9J2TlqEdFAGYlPRUzff9Fl5LOhBCWMlXtZWSDhgWeqwUDUlFHACMS3qm0ff9Fv6S9FkIYdWpvXeUckBb6LFSLCS5OwAYU7/2vR9urEjaH0L417PREg44If/BS4VCkqsDgCCpJ+mgZ7sbeCJpOoSw5tWgtwNmVW7wkvS5pGMF28+DtNBjZXuGJPJCj5XDXro9S+CiY1ttzHs15HIRpP9Wp6d6j9iQ9GUI4WFuQ16Cc0OPFbeQlO0A/EKPFZeQ5LFqXqHHiktIynIA/qHHSnZIynWAd+ixkh2Skh1AudBjZVn9a0FSSMpxQKnQY2VSGSEpyQH0Q89vkoo+sDSQHJJSHTCr7TN4KSMkpU7A94nnlSTpVtw8AcCMJLcw4sjRlJCU4oCaoceKOSSZLoIdhB4r5pBkHch8wjk1MYekaAd0GHqsmEKSZTW7Cj1WTCEpygGFQs9L9Sf1laRrkvY4tu37Jgm47PxM7xFwaEP7U8Cvzn34/Leiv71t2VHYbWDLagO7geuO/TzHY7sdcNZJ0D9Aa3QF5oAXTn3mbcOnv72t5yDkA8tH9OtVEnnb7YBZBxGNlo/o26sk0rfbkfemJ8ryERpySyLtTRJ5b3pMlo/QklsS9vAG3EvsLMnyEXpySuJna2cp29tcLB+hLaUkbNvtgJvGDlwtH6EvpSTivkli+Dc9wyhi+Qid1pKI+yYJuBrZYBXLR+i1lMRCW2Nt3/QMqGr5NogviVVgeKAjLvR0Yvk2iC+J5pBEe+jZFpZvg/aSaA5JwOkRJ/UovGvbE+ALRmeYk00n/TDk4EXg4w7GkQWwB7g1ZEx3mk5Y2HTQi8aZ2mEAp4C/N43tStOBnwA/rQ98aSdZvo31klhaH9uPGx39Fpn2a5HgsYvXAAAAAElFTkSuQmCC';

/**
 * Initializes the web worker and computes arrow positions for the current route.
 */
export function setupArrowAnimation() {
  // Only create a new worker if one doesn't exist
  if (!worker) {
    const workerCode = `
      self.importScripts('https://unpkg.com/@turf/turf@6/turf.min.js');
      self.onmessage = function(e) {
        const { features, level, baseArrowsPerKm, minArrows, maxArrows, steps, animationSpeed } = e.data;
        const animationState = [];
        const matched = features.filter(f => f.properties?.level === level && f.geometry?.type === 'LineString');
        matched.forEach(routeFeature => {
          const line = turf.lineString(routeFeature.geometry.coordinates);
          const lengthKm = turf.length(line, { units: 'kilometers' });
          let arrowCount = Math.round(lengthKm * baseArrowsPerKm);
          arrowCount = Math.min(Math.max(arrowCount, minArrows), maxArrows);
          const totalSteps = Math.round(steps * (lengthKm / 0.1));
          const arc = [];
          for (let i = 0; i <= totalSteps; i++) {
            arc.push(turf.along(line, (lengthKm * i) / totalSteps, { units: 'kilometers' }).geometry.coordinates);
          }
          const spacing = Math.max(1, Math.floor(arc.length / arrowCount));
          const counters = Array.from({ length: arrowCount }, (_, i) => (i * spacing) % arc.length);
          animationState.push({ arc, counters, arrowCount, animationSpeed });
        });
        self.postMessage({ animationState });
      };
    `;
    worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' })));
    worker.onmessage = e => {
      arrowAnimationState = e.data.animationState;
      initializeArrowsSourceAndLayer();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animateArrows();
    };
  }
  startAnimation();
}

/**
 * Starts the arrow animation, loading the icon if necessary.
 */
export function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;
  if (!map.hasImage('arrow-icon')) {
    const img = new Image();
    img.onload = () => {
      map.addImage('arrow-icon', img);
      // Only initialize if route exists
      if (map.getSource('route_outline')) {
        initializeAnimation();
      }
    };
    img.src = arrowDataURL;
  } else {
    // Only initialize if route exists
    if (map.getSource('route_outline')) {
      initializeAnimation();
    }
  }
}

/**
 * Sends route data to the worker and begins arrow animation frames.
 */
export function initializeAnimation() {
  // Ensure worker exists
  if (!worker) {
    setupArrowAnimation();
    return; // setupArrowAnimation will call startAnimation which calls initializeAnimation
  }
  
  // Check if route source exists before accessing it
  const routeSource = map.getSource('route_outline');
  if (!routeSource) {
    //console.log('Route source not ready yet');
    return;
  }
  
  const src = routeSource._data;
  const features = src?.features;
  if (!Array.isArray(features) || !features.length) {
    //console.error('Invalid route data');
    return;
  }
 
  worker.postMessage({
    features,
    level: state.levelRoutePoi.toString(),
    baseArrowsPerKm: ANIMATION_CONFIG.BASE_ARROWS_PER_KM,
    minArrows: ANIMATION_CONFIG.MIN_ARROWS,
    maxArrows: ANIMATION_CONFIG.MAX_ARROWS,
    steps: ANIMATION_CONFIG.STEPS,
    animationSpeed,
  });
  worker.onmessage = e => {
    arrowAnimationState = e.data.animationState;
    initializeArrowsSourceAndLayer();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animateArrows();
  };
}

/**
 * Animates arrows along the route by updating their positions each frame.
 */
export function animateArrows() {
  if (!isAnimating || !arrowAnimationState.length) return;
  
  // Update counters for each arrow in the animation state
  arrowAnimationState.forEach(state => {
    state.counters = state.counters.map(counter => {
      // Increment counter by animation speed
      const newCounter = counter + (state.animationSpeed || animationSpeed);
      // Wrap around when reaching the end of the arc
      return newCounter % state.arc.length;
    });
  });
  
  // Create features from the updated positions
  const features = arrowAnimationState.flatMap(({ arc, counters }) =>
    counters.map((count) => {
      const coord = arc[Math.floor(count) % arc.length];
      const next = arc[(Math.floor(count) + 1) % arc.length];
      
      // Check if turf is available
      if (typeof turf !== 'undefined') {
        const bearing = turf.bearing(turf.point(coord), turf.point(next));
        return { 
          type: 'Feature', 
          geometry: { 
            type: 'Point', 
            coordinates: coord 
          }, 
          properties: { bearing } 
        };
      } else {
        // Fallback bearing calculation if turf is not available
        const bearing = Math.atan2(next[1] - coord[1], next[0] - coord[0]) * 180 / Math.PI;
        return { 
          type: 'Feature', 
          geometry: { 
            type: 'Point', 
            coordinates: coord 
          }, 
          properties: { bearing } 
        };
      }
    })
  );
  
  // Update the map source with new arrow positions
  if (map.getSource('arrow-point')) {
    map.getSource('arrow-point').setData({ type: 'FeatureCollection', features });
  }
  
  // Request next animation frame
  animationFrameId = requestAnimationFrame(animateArrows);
}

/**
 * Adds or resets the source and layer for arrow points on the map.
 */
export function initializeArrowsSourceAndLayer() {
  if (!map.getSource('arrow-point')) {
    map.addSource('arrow-point', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  } else {
    map.getSource('arrow-point').setData({ type: 'FeatureCollection', features: [] });
  }
  if (!map.getLayer('arrow-layer')) {
    map.addLayer({
      id: 'arrow-layer',
      type: 'symbol',
      source: 'arrow-point',
      layout: {
        'icon-image': 'arrow-icon',
        'icon-size': 0.20,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
      },
    });
  }
  setTimeout(() => {
    map.moveLayer("arrow-layer");
  }, 500);
}

/**
 * Stops arrow animation and cancels any pending frames.
 */
export function stopAnimation() {
  isAnimating = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}