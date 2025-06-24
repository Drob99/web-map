import { formatDistance } from "./utils.js";
import { ClearRoute } from "./mapController.js";
import { map } from "./mapInit.js";
import { state } from "./config.js";

 /**
  * Center the map on the first building and zoom in.
  */
 export function fly_to_building() {
    map.setCenter([
      state.buildings_object.buildings[0].coordinate.longitude,
      state.buildings_object.buildings[0].coordinate.latitude,
    ]);
    map.setZoom(18.4);
  }

let previousBearing = null;

/**
 * Generate navigation instructions from a GeoJSON route object
 * @param {Object} geojsonRoute - GeoJSON route object with features containing level information and coordinates
 * @returns {Array} Array of instruction objects with text, icon, level, and coordinates
 */
export function generateNavigationInstructions(geojsonRoute) {
  if (
    !geojsonRoute ||
    !geojsonRoute.features ||
    !Array.isArray(geojsonRoute.features)
  ) {
    console.error("Invalid GeoJSON route object");
    return [];
  }

  const instructions = [];
  let currentLevel = null;
  let previousCoordinate = null;

  // Direction & turn icons
  const directionIcons = { N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖" };
  const turnIcons = {
    left: "↰", right: "↱",
    "slight-left": "↰", "slight-right": "↱",
    "sharp-left": "⬅", "sharp-right": "➡",
    "u-turn": "⟲"
  };
  const floorIcons = { up: "🔼", down: "🔽" };
  const startEndIcons = { start: "🏁", destination: "🎯" };

  // Helpers
  const calculateBearing = (start, end) => {
    const y = Math.sin((end[0]-start[0]) * Math.PI/180) * Math.cos(end[1] * Math.PI/180);
    const x =
      Math.cos(start[1] * Math.PI/180) * Math.sin(end[1] * Math.PI/180) -
      Math.sin(start[1] * Math.PI/180) * Math.cos(end[1] * Math.PI/180) *
      Math.cos((end[0]-start[0]) * Math.PI/180);
    let brg = (Math.atan2(y, x)*180)/Math.PI;
    return brg<0 ? brg+360 : brg;
  };
  const getCardinalDirection = (bearing) => {
    const dirs = ["N","NE","E","SE","S","SW","W","NW"];
    return dirs[Math.round(bearing/45)%8];
  };
  const determineTurn = (prevB, currB) => {
    let angle = currB - prevB;
    if (angle>180) angle -= 360;
    if (angle<-180) angle += 360;
    const absA = Math.abs(angle);
    if      (absA<10)   return { direction:"straight", angle:absA };
    else if (absA<45)   return { direction: angle>0?"slight-right":"slight-left", angle:absA };
    else if (absA<135)  return { direction: angle>0?"right":"left", angle:absA };
    else if (absA<180)  return { direction: angle>0?"sharp-right":"sharp-left", angle:absA };
    else                return { direction:"u-turn", angle:absA };
  };
  const calculateDistance = (start,end) => turf.distance(turf.point(start), turf.point(end), {units:"meters"});

  // Flatten features
  const validFeatures = geojsonRoute.features.filter(f => f.geometry?.coordinates?.length>0);

  validFeatures.forEach((feat, idx) => {
    const lvl = feat.properties.level;
    const coords = feat.geometry.coordinates;
    // floor change?
    if (currentLevel !== null && currentLevel !== lvl) {
      const upOrDown = lvl>currentLevel?"up":"down";
      instructions.push({
        text: `Take stairs or elevator ${upOrDown} to floor ${lvl}`,
        icon: floorIcons[upOrDown],
        level: lvl,
        coordinates: [previousCoordinate, coords[0]],
      });
    }
    currentLevel = lvl;

    // first instruction: head bearing
    if (instructions.length===0) {
      const b = calculateBearing(coords[0], coords[1]||coords[0]);
      const dir = getCardinalDirection(b);
      instructions.push({
        text: `Head ${dir.toLowerCase()} on`,
        icon: startEndIcons.start,
        level: lvl,
        coordinates: [coords[0]],
      });
      previousBearing = b;
    }

    // walk segments
    let segStartIdx = 0, segDist = 0, lastDir=null;
    for (let i=1; i<coords.length; i++) {
      const [s,e] = [coords[i-1], coords[i]];
      const b = calculateBearing(s,e);
      const dir = getCardinalDirection(b);
      const d  = calculateDistance(s,e);
      segDist += d;

      // turn detection
      if (previousBearing!==null && i===1) {
        const turn = determineTurn(previousBearing,b);
        if (turn.direction!=="straight" && turn.angle>30) {
          instructions.push({
            text: `Turn ${turn.direction.replace("-"," ")} onto`,
            icon: turnIcons[turn.direction],
            level: lvl,
            coordinates: [s],
          });
          segStartIdx = i-1;
          segDist = d;
        }
      }

      // direction change mid-feature
      if (lastDir && dir!==lastDir && i>1) {
        const ptPrev = coords[i-2], ptCurr = coords[i-1];
        const turn = determineTurn(calculateBearing(ptPrev,ptCurr), b);
        if (turn.direction!=="straight" && turn.angle>30) {
          // finish previous segment
          if (i-1>segStartIdx) {
            const startCoord = coords[segStartIdx],
                  endCoord   = coords[i-1],
                  dist       = calculateDistance(startCoord,endCoord);
            instructions.push({
              text: `Continue ${formatDistance(dist)}`,
              icon: directionIcons[lastDir],
              level: lvl,
              distance: dist,
              coordinates: [startCoord,endCoord],
            });
          }
          // then the turn
          instructions.push({
            text: `Turn ${turn.direction.replace("-"," ")} onto`,
            icon: turnIcons[turn.direction],
            level: lvl,
            coordinates: [coords[i-1]],
          });
          segStartIdx = i-1;
          segDist = d;
        }
      }

      lastDir = dir;
      previousBearing = b;
      previousCoordinate = e;

      // final bit of this feature
      if (i===coords.length-1 && segDist>0) {
        const startCoord = coords[segStartIdx], endCoord = coords[i];
        instructions.push({
          text: `Continue ${formatDistance(segDist)}`,
          icon: directionIcons[dir],
          level: lvl,
          distance: segDist,
          coordinates: [startCoord, endCoord],
        });
      }
    }
  });

  // arrival
  if (instructions.length>0) {
    const lastFeat = validFeatures[validFeatures.length-1];
    const lastCoords = lastFeat.geometry.coordinates;
    const lastPt = lastCoords[lastCoords.length-1];
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
 * Render navigation instructions to the directions panel
 * @param {Object} geojsonRoute - GeoJSON route object
 * @param {String} containerId - ID of the container element
 */
export function renderDirectionsPanel(
  geojsonRoute,
  containerId = "directions-panel"
) {
  try {
    const instructions = generateNavigationInstructions(geojsonRoute);
    // total distance/time
    const totalDistance = instructions.reduce(
      (sum, ins) => sum + (ins.distance||0),
      0
    );
    const minutes = Math.round(totalDistance/80.4672);
    // format distance for UI
    const distLabel = totalDistance<1000
      ? `${Math.round(totalDistance)} meters`
      : `${(totalDistance/1000).toFixed(1)} km`;

    const container = document.getElementById(containerId);
    if (!container) return console.error("Container not found");

    let html = `
      <div class="summary">
        <div class="distance">${distLabel}</div>
        <div class="time">${minutes} min</div>
        <div><button class="cloes" onclick="ClearRoute()">✖</button></div>
      </div>
      <div class="expandcollapse" onclick="toggle_instruction_card()">
        <i class="fa fa-plus-square"></i> Show Instructions
      </div>
      <ul class="instructions">
    `;

    instructions.forEach((ins,i) => {
      const isFirst = i===0;
      const letterOrIcon = isFirst
        ? `<div class="letter">A</div>`
        : `<div class="icon">${ins.icon}</div>`;
      const distHtml = ins.distance
        ? `<div class="distance">${formatDistance(ins.distance)}</div>`
        : "";
      html += `
        <li class="instruction">
          ${letterOrIcon}
          <div class="text">
            <div class="main">${ins.text}</div>
            ${distHtml}
          </div>
        </li>
      `;
    });

    html += "</ul>";
    html += `<button id="endroute" onclick="ClearRoute()">End Route</button>`;

    container.innerHTML = html;
    container.style.display = "block";

  } catch (err) {
    console.error("Error rendering directions panel:", err);
  }
}

/**
 * Toggle show/hide of the instructions panel.
 */
export function toggle_instruction_card() {
  const card = document.getElementById("directions-panel");
  const fromEl = card.querySelector(".instructions");
  const isHidden = fromEl.style.display === "" || fromEl.style.display === "none";
  fromEl.style.display = isHidden ? "block" : "none";
  document.querySelector(".expandcollapse").innerHTML = isHidden
    ? '<i class="fa fa-minus-square"></i> Hide Instructions'
    : '<i class="fa fa-plus-square"></i> Show Instructions';
}

window.toggle_instruction_card = toggle_instruction_card;

