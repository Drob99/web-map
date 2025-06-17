import { map } from "../mapInit.js";
import {
  BASE_ARROWS_PER_KM as baseArrowsPerKm,
  MIN_ARROWS as minArrows,
  MAX_ARROWS as maxArrows,
  STEPS as steps,
} from "../config.js";
let worker, animationState = [], animationFrameId = null, isAnimating = false, animationSpeed = 0.5;
import { state } from "../config.js";

const arrowDataURL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAA7NJREFUeJzVm71uFUcYht9JgUVQHFpsKRI0MU64AcB3gJDTB/MjoEgRoSgYWjpL9EhICCMkikiJgsgVWIgbiHL4aSgQtpIujkiAhPihOD5g7D1n55v5ZtZ+yuPdmXdm3m+97+6s1BHAOeAP4HfgTFc6OgGYBt7wnv+Aqa51VQNYZCs3utZVBWASeN0wAa+Aidp6PqrdoaQLknY1/D4m6dvKWuoCjAN/Nqz+gFVgb01NtR3wjaRPR/x9XNL5SlrqAowBKyNWf8Ay0FQiRajpgDlJ+yKOm5D0dWEtdQEC8DBi9Qc8Brq4QJcB+Mow+AHHu9btBvAgYQLud63bBWAmYfADjnStPxvgl4wJuNu1/iyAKeD/jAlYA6ZLaix9pb2U2UeQ9J2TlqEdFAGYlPRUzff9Fl5LOhBCWMlXtZWSDhgWeqwUDUlFHACMS3qm0ff9Fv6S9FkIYdWpvXeUckBb6LFSLCS5OwAYU7/2vR9urEjaH0L417PREg44If/BS4VCkqsDgCCpJ+mgZ7sbeCJpOoSw5tWgtwNmVW7wkvS5pGMF28+DtNBjZXuGJPJCj5XDXro9S+CiY1ttzHs15HIRpP9Wp6d6j9iQ9GUI4WFuQ16Cc0OPFbeQlO0A/EKPFZeQ5LFqXqHHiktIynIA/qHHSnZIynWAd+ixkh2Skh1AudBjZVn9a0FSSMpxQKnQY2VSGSEpyQH0Q89vkoo+sDSQHJJSHTCr7TN4KSMkpU7A94nnlSTpVtw8AcCMJLcw4sjRlJCU4oCaoceKOSSZLoIdhB4r5pBkHch8wjk1MYekaAd0GHqsmEKSZTW7Cj1WTCEpygGFQs9L9Sf1laRrkvY4tu37Jgm47PxM7xFwaEP7U8Cvzn34/Leiv71t2VHYbWDLagO7geuO/TzHY7sdcNZJ0D9Aa3QF5oAXTn3mbcOnv72t5yDkA8tH9OtVEnnb7YBZBxGNlo/o26sk0rfbkfemJ8ryERpySyLtTRJ5b3pMlo/QklsS9vAG3EvsLMnyEXpySuJna2cp29tcLB+hLaUkbNvtgJvGDlwtH6EvpSTivkli+Dc9wyhi+Qid1pKI+yYJuBrZYBXLR+i1lMRCW2Nt3/QMqGr5NogviVVgeKAjLvR0Yvk2iC+J5pBEe+jZFpZvg/aSaA5JwOkRJ/UovGvbE+ALRmeYk00n/TDk4EXg4w7GkQWwB7g1ZEx3mk5Y2HTQi8aZ2mEAp4C/N43tStOBnwA/rQ98aSdZvo31klhaH9uPGx39Fpn2a5HgsYvXAAAAAElFTkSuQmCC";

/**
 * Kick off the worker to compute arrow positions
 */
export function setupArrowAnimation() {
  const workerBlobCode = `
    self.importScripts('https://unpkg.com/@turf/turf@6/turf.min.js');
    
    self.onmessage = function(e) {
        const { features, level, baseArrowsPerKm, minArrows, maxArrows, steps, animationSpeed } = e.data;
        const animationState = [];
    
        const matched = features.filter(f => 
            f.properties?.level === level &&
            f.geometry?.type === 'LineString'
        );
    
        matched.forEach(routeFeature => {
            const coords = routeFeature.geometry.coordinates;
            if (coords.length < 2) return;
    
            const line = turf.lineString(coords);
            const routeLengthKm = turf.length(line, { units: 'kilometers' });
    
            let arrowCount = Math.round(routeLengthKm * baseArrowsPerKm);
            arrowCount = Math.max(minArrows, Math.min(maxArrows, arrowCount));
    
            const arc = [];
            const totalSteps = Math.round(steps * (routeLengthKm / 0.1));
            for (let i = 0; i <= totalSteps; i++) {
                const pt = turf.along(line, routeLengthKm * i / totalSteps, { units: 'kilometers' });
                arc.push(pt.geometry.coordinates);
            }
    
            const spacing = Math.max(1, Math.floor(arc.length / arrowCount));
            const counters = [];
            for (let i = 0; i < arrowCount; i++) {
                counters.push(i * spacing % arc.length);
            }
    
            animationState.push({ arc, counters, arrowCount, animationSpeed });
        });
    
        self.postMessage({ animationState });
    };
    `;

  worker = new Worker(
    URL.createObjectURL(
      new Blob([workerBlobCode], { type: "application/javascript" })
    )
  );

  worker.onmessage = (e) => {
    window.animationState = e.data.animationState;
    initializeArrowsSourceAndLayer();
    if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
    animateArrows();
  };

  startAnimation();
}

export function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;

  if (!map.hasImage("arrow-icon")) {
    const img = new Image();
    img.onload = () => {
      map.addImage("arrow-icon", img);
      setupAnimation();
    };
    img.src = arrowDataURL;
  } else {
    setupAnimation();
  }
}

export function setupAnimation() {
  const features = state.Full_path_route?.features;
  if (!Array.isArray(features) || features.length === 0) {
    console.error("Invalid route data format");
    return;
  }

  if (state.Level_route_poi === null) {
    console.warn("Level_route_poi is not set; defaulting to floor 1");
    state.Level_route_poi = 1;
  }
  const levelStr = state.Level_route_poi.toString();

  worker.postMessage({
    features,
    level: levelStr,
    baseArrowsPerKm,
    minArrows,
    maxArrows,
    steps,
    animationSpeed,
  });

  worker.onmessage = (e) => {
    animationState = e.data.animationState;
    initializeArrowsSourceAndLayer();

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animateArrows();
  };
}

export function animateArrows() {
  if (!isAnimating) return;

  const features = [];

  animationState.forEach((state) => {
    const { arc, counters, arrowCount, animationSpeed } = state;

    for (let i = 0; i < arrowCount; i++) {
      const idx = Math.floor(counters[i]) % arc.length;
      const coord = arc[idx];
      const next = arc[(idx + 1) % arc.length];
      const bearing = turf.bearing(turf.point(coord), turf.point(next));

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coord },
        properties: { bearing },
      });

      counters[i] = (counters[i] + animationSpeed) % arc.length;
    }
  });

  map.getSource("arrow-point").setData({
    type: "FeatureCollection",
    features,
  });

  animationFrameId = requestAnimationFrame(animateArrows);
}

export function initializeArrowsSourceAndLayer() {
  if (!map.getSource("arrow-point")) {
    map.addSource("arrow-point", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  } else {
    map
      .getSource("arrow-point")
      .setData({ type: "FeatureCollection", features: [] });
  }

  if (!map.getLayer("arrow-layer")) {
    map.addLayer({
      id: "arrow-layer",
      type: "symbol",
      source: "arrow-point",
      layout: {
        "icon-image": "arrow-icon",
        "icon-size": 0.25,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
      },
    });
  }

  setTimeout(() => {
    map.moveLayer("arrow-layer");
  }, 500);
}

export function stopAnimation() {
  isAnimating = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
