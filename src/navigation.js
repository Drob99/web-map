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
/**
 * Generates step-by-step navigation instructions from a GeoJSON route.
 * Supports multilingual output (English, Arabic, Chinese).
 *
 * @param {Object} geojsonRoute - GeoJSON route with features array.
 * @param {string} lang - Language code: "EN", "AR", or "ZN". Defaults to "EN".
 * @returns {Array} List of instruction objects with text, icon, level, and coordinates.
 */

  export function generateNavigationInstructions(geojsonRoute, lang = "EN") {
  if (!geojsonRoute?.features || !Array.isArray(geojsonRoute.features)) {
    console.error("Invalid GeoJSON route object");
    return [];
  }

  // Translation dictionary
  const translations = {
    "Take stairs or elevator up to floor": {
      EN: "Take stairs or elevator up to floor",
      AR: "اصعد بالسلالم أو المصعد إلى الطابق",
      ZN: "乘楼梯或电梯上到楼层",
    },
    "Take stairs or elevator down to floor": {
      EN: "Take stairs or elevator down to floor",
      AR: "انزل بالسلالم أو المصعد إلى الطابق",
      ZN: "乘楼梯或电梯下到楼层",
    },
    Head: {
      EN: "Head",
      AR: "اتجه نحو",
      ZN: "朝着",
    },
    Turn: {
      EN: "Turn",
      AR: "انعطف",
      ZN: "转向",
    },
    onto: {
      EN: "onto",
      AR: "إلى",
      ZN: "",
    },
    Continue: {
      EN: "Continue",
      AR: "تابع",
      ZN: "继续",
    },
    "You have reached your destination": {
      EN: "You have reached your destination",
      AR: "لقد وصلت إلى وجهتك",
      ZN: "您已到达目的地",
    },
    meters: {
      EN: "m",
      AR: "م",
      ZN: "米",
    },
    kilometers: {
      EN: "km",
      AR: "كم",
      ZN: "公里",
    },
    directions: {
      N: { EN: "north", AR: "الشمال", ZN: "北" },
      NE: { EN: "northeast", AR: "الشمال الشرقي", ZN: "东北" },
      E: { EN: "east", AR: "الشرق", ZN: "东" },
      SE: { EN: "southeast", AR: "الجنوب الشرقي", ZN: "东南" },
      S: { EN: "south", AR: "الجنوب", ZN: "南" },
      SW: { EN: "southwest", AR: "الجنوب الغربي", ZN: "西南" },
      W: { EN: "west", AR: "الغرب", ZN: "西" },
      NW: { EN: "northwest", AR: "الشمال الغربي", ZN: "西北" },
    },
    turn_directions: {
      "slight right": { EN: "slight right", AR: "يمين قليلًا", ZN: "稍向右" },
      "slight left": { EN: "slight left", AR: "يسار قليلًا", ZN: "稍向左" },
      "right": { EN: "right", AR: "يمين", ZN: "右转" },
      "left": { EN: "left", AR: "يسار", ZN: "左转" },
      "sharp right": { EN: "sharp right", AR: "يمين حاد", ZN: "急右转" },
      "sharp left": { EN: "sharp left", AR: "يسار حاد", ZN: "急左转" },
      "u turn": { EN: "U-turn", AR: "انعطاف كامل", ZN: "掉头" },
    },
  };

  const translate = (key) => translations[key]?.[lang] || key;
  const getDirText = (dirCode) => translations.directions[dirCode]?.[lang] || dirCode;
  const translateTurn = (key) =>
  translations.turn_directions[key.replace("-", " ")]?.[lang] || key;



  const directionIcons = {
    N: '<i class="ph ph-arrow-up"></i>', NE: '<i class="ph ph-arrow-up-right"></i>', E: '<i class="ph ph-arrow-right"></i>', SE: '<i class="ph ph-arrow-down-right"></i>',
    S: '<i class="ph ph-arrow-down"></i>', SW: '<i class="ph ph-arrow-down-left"></i>', W: '<i class="ph ph-arrow-left"></i>', NW: '<i class="ph ph-arrow-up-left"></i>',
  };

  const turnIcons = {
    left: '<i class="ph ph-arrow-bend-up-left"></i>', right: '<i class="ph ph-arrow-bend-up-right"></i>',
    "slight-left": '<i class="ph ph-arrow-up-left"></i>', "slight-right": '<i class="ph ph-arrow-up-right"></i>',
    "sharp-left": '<i class="ph ph-arrow-elbow-up-left"></i>', "sharp-right": '<i class="ph ph-arrow-elbow-up-right"></i>',
    "u-turn": '<i class="ph ph-arrow-u-right-down"></i>',
  };

  const floorIcons = { up: '<i class="ph ph-escalator-up"></i>', down: '<i class="ph ph-escalator-down"></i>' };
  const startEndIcons = { start: '<i class="fa-solid fa-person-walking"></i>', destination: '<i class="fa-solid fa-flag-checkered"></i>' };

  const calculateBearing = (start, end) => {
    const y = Math.sin(((end[0] - start[0]) * Math.PI) / 180) * Math.cos((end[1] * Math.PI) / 180);
    const x = Math.cos((start[1] * Math.PI) / 180) * Math.sin((end[1] * Math.PI) / 180) -
              Math.sin((start[1] * Math.PI) / 180) * Math.cos((end[1] * Math.PI) / 180) *
              Math.cos(((end[0] - start[0]) * Math.PI) / 180);
    const brg = (Math.atan2(y, x) * 180) / Math.PI;
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
    if (absA < 45) return { direction: angle > 0 ? "slight-right" : "slight-left", angle: absA };
    if (absA < 135) return { direction: angle > 0 ? "right" : "left", angle: absA };
    if (absA < 180) return { direction: angle > 0 ? "sharp-right" : "sharp-left", angle: absA };
    return { direction: "u-turn", angle: absA };
  };

  const calculateDistance = (start, end) =>
    turf.distance(turf.point(start), turf.point(end), { units: "meters" });

  const formatDistance = (d) => {
    if (d >= 1000) {
      return `${(d / 1000).toFixed(1)} ${translate("kilometers")}`;
    } else {
      return `${Math.round(d)} ${translate("meters")}`;
    }
  };

  const instructions = [];
  let currentLevel = null;
  let previousCoordinate = null;
  let previousBearing = null;

  const validFeatures = geojsonRoute.features.filter(
    (f) => f.geometry?.coordinates?.length > 0
  );

  validFeatures.forEach((feature) => {
    const lvl = feature.properties.level;
    const coords = feature.geometry.coordinates;

    // Floor change
    if (currentLevel !== null && currentLevel !== lvl) {
      const dir = lvl > currentLevel ? "up" : "down";
      instructions.push({
        text: `${translate(`Take stairs or elevator ${dir} to floor`)} ${lvl}`,
        icon: floorIcons[dir],
        level: lvl,
        coordinates: [previousCoordinate, coords[0]],
      });
    }
    currentLevel = lvl;

    // Start instruction
    if (instructions.length === 0 && coords.length > 1) {
      const b = calculateBearing(coords[0], coords[1]);
      const dir = getCardinalDirection(b);
      instructions.push({
        text: `${translate("Head")} ${getDirText(dir)} ${translate("onto")}`,
        icon: startEndIcons.start,
        level: lvl,
        coordinates: [coords[0]],
      });
      previousBearing = b;
    }

    // Turn detection
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

      // Initial turn
      if (i === 1 && previousBearing !== null) {
        const turn = determineTurn(previousBearing, b);
        if (turn.direction !== "straight" && turn.angle > 30) {
          instructions.push({
            text: `${translate("Turn")} ${translateTurn(turn.direction)} ${translate("onto")}`,
            icon: turnIcons[turn.direction],
            level: lvl,
            coordinates: [prev],
          });
        }
        segStartIdx = 0;
      }

      // Mid-segment direction change
      if (lastDir && dir !== lastDir) {
        const turn = determineTurn(previousBearing, b);
        const segStart = coords[segStartIdx];
        const segEnd = coords[i - 1];

        if (turn.direction !== "straight" && turn.angle > 30) {
          instructions.push({
            text: `${translate("Continue")} ${formatDistance(calculateDistance(segStart, segEnd))}`,
            icon: '<i class="ph ph-arrow-up"></i>',
            level: lvl,
            coordinates: [segStart, segEnd],
          });
          instructions.push({
            text: `${translate("Turn")} ${translateTurn(turn.direction)} ${translate("onto")}`,
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

      // End of segment
      if (i === coords.length - 1 && segDist > 0) {
        instructions.push({
          text: `${translate("Continue")} ${formatDistance(segDist)}`,
          icon: '<i class="ph ph-arrow-up"></i>',
          level: lvl,
          coordinates: [coords[segStartIdx], coord],
          distance: segDist,
        });
      }
    });
  });

  // Final instruction
  if (validFeatures.length) {
    const last = validFeatures.at(-1);
    const lastCoords = last.geometry.coordinates;
    const lastPoint = lastCoords.at(-1);
    instructions.push({
      text: translate("You have reached your destination"),
      icon: startEndIcons.destination,
      level: last.properties.level,
      coordinates: [lastPoint],
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
    const instructions = generateNavigationInstructions(geojsonRoute , state.language);
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


export function formatDistanceImperial(meters, lang = "EN") {
  if (!meters) return { value: '', unit: '' };

  // Translation dictionary for units
  const unitTranslations = {
    meters: {
      EN: "meters",
      AR: "متر",
      ZN: "米",
    },
    km: {
      EN: "km",
      AR: "كم",
      ZN: "公里",
    },
  };

  // Convert to feet (though still using metric in logic here)
  const feet = meters;

  if (feet < 1000) {
    return {
      value: Math.round(feet),
      unit: unitTranslations.meters[lang] || 'm',
    };
  } else {
    const km = feet / 1000;
    return {
      value: km.toFixed(2),
      unit: unitTranslations.km[lang] || 'km',
    };
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