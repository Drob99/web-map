/**
 * @module layerController
 * @description Processes and toggles map layers per floor, integrating individual layer modules.
 */
import { map } from '../mapInit.js';
import { state } from '../config.js';
import { wallsLayer } from './walls.js';
import { streetLayer } from './street.js';
import { roomsLayer } from './rooms.js';
import { sidewalkLayer } from './sidewalk.js';
import { parkingLayer } from './parking.js';
import { outlayerLayer } from './outlayer.js';
import { otherLayer } from './other.js';
import { arrowsLayer } from './arrows.js';
import { doorsLayer } from './doors.js';
import { corridorsLayer } from './corridors.js';
import { beLayer } from './be.js';
import { gardenLayer } from './garden.js';
import { showPoisByLevel, routeEnabled, routeLevel, elevatorGuide, addFromToMarkers } from '../mapController.js';
import { setupArrowAnimation, initializeArrowsSourceAndLayer, stopAnimation, initializeAnimation, startAnimation } from '../animation/arrowAnimation.js';
import { removeRouteLayer } from '../mapController.js';

/**
 * Adds layers for each floor in sorted order and builds UI toggles.
 * @param {Array<Object>} sortedLayers - Array of layer groups sorted by floor.
 * @returns {boolean} True if all layers processed successfully.
 */
export async function layersLevel(sortedLayers) {
  let isLayersProcessed = true;

  try {
    // Iterate floors
    for (const group of sortedLayers) {
      const floorStr = group.building_floor.name;
      const floorNum = floorStr === 'G' ? 0 : parseInt(floorStr, 10);
      const buildingId = group.building_floor.building_id;
      const floorId = group.building_floor.id;

      // Track level lookup
      state.levelArray[floorId] = floorNum;

      // Add each layer on this floor
      for (const layer of group.building_floor.layers) {
        const { kind, file: { url, filename } } = layer;
        const layerKey = `${buildingId}/${floorNum}/${kind === 'other' ? filename : kind}`;

        // Track unique layer names
        const name = kind === 'other' ? filename : kind;
        if (!state.layerNames.includes(name)) {
          state.layerNames.push(name);
        }

        try {
          switch (kind) {
            case 'walls': wallsLayer(layerKey, url); break;
            case 'street': streetLayer(layerKey, url); break;
            case 'rooms': roomsLayer(layerKey, url); break;
            case 'sidewalk': sidewalkLayer(layerKey, url); break;
            case 'parking': parkingLayer(layerKey, url); break;
            case 'outlayer': outlayerLayer(layerKey, url); break;
            case 'doors': doorsLayer(layerKey, url); break;
            case 'corridors': corridorsLayer(layerKey, url); break;
            case 'arrows': arrowsLayer(layerKey, url); break;
            case 'garden': gardenLayer(layerKey, url); break;
            case 'be': beLayer(layerKey, url); break;
            case 'other': otherLayer(layerKey, url); break;
            default:
              console.warn(`Unhandled layer kind: ${kind}`);
          }
        } catch (err) {
          console.error(`Error processing layer ${kind}:`, err);
          isLayersProcessed = false;
        }
      }

      const floorLabelMap = {
        0: ['G', 'A'],
        1: ['I', '1'],
        2: ['D', '2'],
        3: ['M', '3'],
        '-1': ['S', '-1'],
      };

      const toggleId = `${buildingId}/${floorNum}`;

      if (!state.toggleableLayerIds.includes(floorNum)) {
        state.toggleableLayerIds.push(toggleId);

        if (!state.floorNameTitle.includes(floorNum)) {
          const labels = floorLabelMap.hasOwnProperty(floorNum)
            ? floorLabelMap[floorNum]
            : [String(floorNum)];

          labels.forEach(label => {
            toggleLayer([toggleId], label);
          });

          state.floorNameTitle.push(floorNum);
        }
      }



    }
  } catch (err) {
    console.error('layersLevel error:', err);
    isLayersProcessed = false;
  }

  return isLayersProcessed;
}

/**
 * Adds a toggle link to #menu that shows/hides layers for a given floor.
 * @param {string[]} ids - Array containing single floor ID string.
 * @param {string|number} name - Display name for the floor toggle.
 */
// Updated toggleLayer function to work with the modern floor menu
function toggleLayer(ids, name) {
  const link = document.createElement("a");
  link.href = "#";
  link.textContent = name;
  link.className = "floor-item";
  link.dataset.floor = name;

  // Create tooltip
  const tooltip = document.createElement("span");
  // tooltip.className = "floor-tooltip";
  // tooltip.textContent = getFloorDisplayName(name);
  // link.appendChild(tooltip);

  // Determine current visibility
  const firstId = `${ids[0]}/${name}`;

  const visible = map.getLayer(firstId) &&
    map.getLayoutProperty(firstId, "visibility") === "visible";
  // console.log(ids);   
  // console.log(firstId);
  // console.log(ids[0]);
  // console.log(name);
  // console.log(visible);
  //  console.log(visible);
  if (visible) {
    link.classList.add("floor-active");
    map.on("mouseenter", ids, function (e) {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", ids, function (e) {
      map.getCanvas().style.cursor = "";
    });
    // Update active link class
    const menu = document.getElementById("menu");
    Array.from(menu.children).forEach(el => {
      el.classList.remove("floor-active");
    });
    this.classList.add("floor-active");
  }



  link.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();

    const nameToFloorMap = {
      "A": 0,
      "G": 0,
      "I": 1,
      "D": 2,
      "M": 3,
      "S": -1
    };

    const floorPairMap = {
      "G": "A",
      "A": "G",
      "1": "I",
      "I": "1",
      "2": "D",
      "D": "2",
      "3": "M",
      "M": "3",
      "-1": "S",
      "S": "-1"
    };

    const floorNum = nameToFloorMap.hasOwnProperty(name) ? nameToFloorMap[name] : parseInt(name, 10);
    state.levelRoutePoi = floorNum;

    let pairedFloorNum = null;
    if (floorPairMap.hasOwnProperty(name)) {
      const pairedFloorName = floorPairMap[name];
      pairedFloorNum = nameToFloorMap.hasOwnProperty(pairedFloorName) ? nameToFloorMap[pairedFloorName] : parseInt(pairedFloorName, 10);
    }

    // Toggle this floor on, others off
    for (const toggleId of state.toggleableLayerIds) {
      const [, lvlStr] = toggleId.split("/");
      const lvl = parseInt(lvlStr, 10);

      for (const layerName of state.layerNames) {
        const layerId = `${toggleId}/${layerName}`;
        if (!map.getLayer(layerId)) continue;

        const visibility = (lvl === floorNum || lvl === pairedFloorNum) ? "visible" : "none";
        map.setLayoutProperty(layerId, "visibility", visibility);

        // Reordering specific layers if visible
        if (visibility === "visible") {
          if (layerName === "arrows" || layerName === "Stairs_Line.geojson" ||
            layerName === "rooms" || layerName === "walls" || layerName === "be" ||
            layerName === "doors" || layerName === "municipality-name") {
            map.moveLayer(layerId);
          }
        }
      }
    }

    // Update active link class
    const menu = document.getElementById("menu");
    Array.from(menu.children).forEach(el => {
      el.classList.remove("floor-active");
    });
    this.classList.add("floor-active");

    // Additionally activate the paired floor's link if it exists
    if (pairedFloorNum !== null) {
      const pairedLink = document.querySelector(`[data-floor="${floorPairMap[name]}"]`);
      if (pairedLink) {
        pairedLink.classList.add("floor-active");
      }
    }

    // Refresh POIs
    showPoisByLevel();

    // If a route is active, redraw it and restart arrows
    if (state.routeEnabled) {
      // Stop current animation
      stopAnimation();

      // Remove and redraw route
      removeRouteLayer();
      routeLevel();
      state.popupsGlobal.forEach((p) => p.remove());
      state.popupsGlobal = [];
      elevatorGuide();

      // Update markers
      addFromToMarkers(
        state.fromMarkerLocation,
        state.toMarkerLocation,
        state.fromMarkerLevel,
        state.toMarkerLevel
      );

      // Restart arrow animation
      setTimeout(() => {
        initializeArrowsSourceAndLayer();

        // Ensure arrow layer is at the top
        if (map.getLayer("arrow-layer")) {
          // In a real implementation: map.moveLayer("arrow-layer");
        }

        // Setup worker if needed, then initialize and start animation
        setupArrowAnimation();
        initializeAnimation();
        startAnimation();
      }, 100);
    }
  };

  document.getElementById("menu").appendChild(link);
}



// Helper function to get display name for floors
function getFloorDisplayName(name) {
  const floorNames = {
    '3': '3rd Floor',
    '2': 'Departure',
    '1': 'Intermediate',
    'G': 'Arrival',
    '-1': 'Basment 1',
    '-2': 'Basment 2',

  };
  return floorNames[name] || `Floor ${name}`;
}

// Demo: Add floors dynamically
// document.addEventListener('DOMContentLoaded', function() {
//     // Simulate adding floors dynamically
//     setTimeout(() => {
//         toggleLayer([], 'B2');
//         toggleLayer([], 'B1');
//     }, 1000);
// });
