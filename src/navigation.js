/**
 * @module navigation
 * @description Handles map navigation functionality and instruction rendering.
 */
import { formatDistance } from "./utils.js";
import { clearRoute } from "./mapController.js";
import { map } from "./mapInit.js";
import { state } from "./config.js";

let previousBearing = null;

/**
 * Centers the map on the first building and zooms in.
 */
export function flyToBuilding() {
  const { longitude, latitude } = state.buildingsObject.buildings[0].coordinate;
  map.setCenter([longitude, latitude]);
  map.setZoom(18.4);
}

/**
 * Generates navigation instructions from a GeoJSON route object.
 * @param {Object} geojsonRoute - GeoJSON route with features containing level info and coordinates.
 * @returns {Array<Object>} Array of instruction objects.
 */
export function generateNavigationInstructions(geojsonRoute) {
  if (!geojsonRoute?.features || !Array.isArray(geojsonRoute.features)) {
    console.error("Invalid GeoJSON route object");
    return [];
  }

  const instructions = [];
  let currentLevel = null;
  let previousCoordinate = null;

  // Direction & turn icons
  const directionIcons = {
    N: "↑",
    NE: "↗",
    E: "→",
    SE: "↘",
    S: "↓",
    SW: "↙",
    W: "←",
    NW: "↖",
  };
  const turnIcons = {
    left: "↰",
    right: "↱",
    "slight-left": "↰",
    "slight-right": "↱",
    "sharp-left": "⬅",
    "sharp-right": "➡",
    "u-turn": "⟲",
  };
  const floorIcons = { up: "🔼", down: "🔽" };
  const startEndIcons = { start: "🏁", destination: "🎯" };

  // Helpers
  const calculateBearing = (start, end) => {
    const y =
      Math.sin(((end[0] - start[0]) * Math.PI) / 180) *
      Math.cos((end[1] * Math.PI) / 180);
    const x =
      Math.cos((start[1] * Math.PI) / 180) *
        Math.sin((end[1] * Math.PI) / 180) -
      Math.sin((start[1] * Math.PI) / 180) *
        Math.cos((end[1] * Math.PI) / 180) *
        Math.cos(((end[0] - start[0]) * Math.PI) / 180);
    let brg = (Math.atan2(y, x) * 180) / Math.PI;
    return brg < 0 ? brg + 360 : brg;
  };

  const getCardinalDirection = (bearing) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(bearing / 45) % 8];
  };

  const determineTurn = (prevB, currB) => {
    let angle = currB - prevB;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    const absA = Math.abs(angle);
    if (absA < 10) return { direction: "straight", angle: absA };
    if (absA < 45)
      return {
        direction: angle > 0 ? "slight-right" : "slight-left",
        angle: absA,
      };
    if (absA < 135)
      return { direction: angle > 0 ? "right" : "left", angle: absA };
    if (absA < 180)
      return {
        direction: angle > 0 ? "sharp-right" : "sharp-left",
        angle: absA,
      };
    return { direction: "u-turn", angle: absA };
  };

  const calculateDistance = (start, end) =>
    turf.distance(turf.point(start), turf.point(end), { units: "meters" });

  // Flatten features with coordinates
  const validFeatures = geojsonRoute.features.filter(
    (f) => f.geometry?.coordinates?.length > 0
  );

  validFeatures.forEach((feature) => {
    const lvl = feature.properties.level;
    const coords = feature.geometry.coordinates;

    // Floor change
    if (currentLevel !== null && currentLevel !== lvl) {
      const upOrDown = lvl > currentLevel ? "up" : "down";
      instructions.push({
        text: `Take stairs or elevator ${upOrDown} to floor ${lvl}`,
        icon: floorIcons[upOrDown],
        level: lvl,
        coordinates: [previousCoordinate, coords[0]],
      });
    }
    currentLevel = lvl;

    // First instruction: head direction
    if (instructions.length === 0 && coords.length > 1) {
      const b = calculateBearing(coords[0], coords[1]);
      const dir = getCardinalDirection(b);
      instructions.push({
        text: `Head ${dir.toLowerCase()} on`,
        icon: startEndIcons.start,
        level: lvl,
        coordinates: [coords[0]],
      });
      previousBearing = b;
    }

    // Walk segments
    let segStartIdx = 0;
    let segDist = 0;
    let lastDir = null;

    coords.forEach((coord, i) => {
      if (i === 0) return;
      const prev = coords[i - 1];
      const b = calculateBearing(prev, coord);
      const dir = getCardinalDirection(b);
      const d = calculateDistance(prev, coord);
      segDist += d;

      // Turn detection at segment start
      if (i === 1 && previousBearing !== null) {
        const turn = determineTurn(previousBearing, b);
        if (turn.direction !== "straight" && turn.angle > 30) {
          instructions.push({
            text: `Turn ${turn.direction.replace("-", " ")} onto`,
            icon: turnIcons[turn.direction],
            level: lvl,
            coordinates: [prev],
          });
          segStartIdx = 0;
        }
      }

      // Direction change mid-feature
      if (lastDir && dir !== lastDir) {
        const ptPrev = coords[segStartIdx];
        const turn = determineTurn(previousBearing, b);
        if (turn.direction !== "straight" && turn.angle > 30) {
          const distSegment = calculateDistance(ptPrev, prev);
          instructions.push({
            text: `Continue ${formatDistance(distSegment)}`,
            icon: directionIcons[lastDir],
            level: lvl,
            coordinates: [ptPrev, prev],
            distance: distSegment,
          });
          instructions.push({
            text: `Turn ${turn.direction.replace("-", " ")} onto`,
            icon: turnIcons[turn.direction],
            level: lvl,
            coordinates: [prev],
          });
          segStartIdx = i - 1;
          segDist = d;
        }
      }

      lastDir = dir;
      previousBearing = b;
      previousCoordinate = coord;

      // End of feature segment
      if (i === coords.length - 1 && segDist > 0) {
        instructions.push({
          text: `Continue ${formatDistance(segDist)}`,
          icon: directionIcons[dir],
          level: lvl,
          coordinates: [coords[segStartIdx], coord],
          distance: segDist,
        });
      }
    });
  });

  // Arrival instruction
  if (validFeatures.length) {
    const lastFeat = validFeatures[validFeatures.length - 1];
    const lastCoords = lastFeat.geometry.coordinates;
    const lastPt = lastCoords[lastCoords.length - 1];
    instructions.push({
      text: "You have reached your destination",
      icon: startEndIcons.destination,
      level: lastFeat.properties.level,
      coordinates: [lastPt],
    });
  }

  return instructions;
}

/**
 * Renders navigation instructions to the directions panel.
 * @param {Object} geojsonRoute - GeoJSON route object.
 * @param {string} containerId - ID of the container element.
 */
export function renderDirectionsPanel(
  geojsonRoute,
  containerId = "directions-panel"
) {
  try {
    const instructions = generateNavigationInstructions(geojsonRoute);
    const totalDistance = instructions.reduce(
      (sum, ins) => sum + (ins.distance || 0),
      0
    );
    const timeMinutes = Math.round(totalDistance / 80.4672);
    const distLabel =
      totalDistance < 1000
        ? `${Math.round(totalDistance)} meters`
        : `${(totalDistance / 1000).toFixed(1)} km`;

    const container = document.getElementById(containerId);
    if (!container) return console.error("Container not found");

    let html = `
      <div class="summary">
        <div class="distance">${distLabel}</div>
        <div class="time">${timeMinutes} min</div>
        <div><button class="close" onclick="clearRoute()">✖</button></div>
      </div>
      <div class="expandcollapse" onclick="toggleInstructionCard()">
        <i class="fa fa-plus-square"></i> Show Instructions
      </div>
      <ul class="instructions">
    `;

    instructions.forEach((ins, i) => {
      const isFirst = i === 0;
      const iconHtml = isFirst
        ? `<div class="letter">A</div>`
        : `<div class="icon">${ins.icon}</div>`;
      const distHtml = ins.distance
        ? `<div class="distance">${formatDistance(ins.distance)}</div>`
        : "";
      html += `
        <li class="instruction">
          ${iconHtml}
          <div class="text">
            <div class="main">${ins.text}</div>
            ${distHtml}
          </div>
        </li>
      `;
    });

    html += "</ul>";
    html += `<button id="endroute" onclick="clearRoute()">End Route</button>`;
    container.innerHTML = html;
    container.style.display = "block";
  } catch (error) {
    console.error("Error rendering directions panel:", error);
  }
}

/**
 * Toggles show/hide of the instructions panel.
 */
export function toggleInstructionCard() {
  const panel = document.getElementById("directions-panel");
  const list = panel?.querySelector(".instructions");
  const isHidden = !list || list.style.display === "none";
  if (list) list.style.display = isHidden ? "block" : "none";
  const btn = document.querySelector(".expandcollapse");
  btn.innerHTML = isHidden
    ? '<i class="fa fa-minus-square"></i> Hide Instructions'
    : '<i class="fa fa-plus-square"></i> Show Instructions';
}

window.toggleInstructionCard = toggleInstructionCard;