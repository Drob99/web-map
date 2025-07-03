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
import { showPoisByLevel, routeEnabled , routeLevel, elevatorGuide , addFromToMarkers} from '../mapController.js';
import { setupArrowAnimation ,initializeArrowsSourceAndLayer , stopAnimation  } from '../animation/arrowAnimation.js';
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

      // Add floor toggle if not present
      const toggleId = `${buildingId}/${floorNum}`;
      if (!state.toggleableLayerIds.includes(toggleId)) {
        state.toggleableLayerIds.push(toggleId);
        if (!state.floorNameTitle.includes(floorNum)) {
        
        const label = floorNum === 0 ? 'G' : floorNum;
        toggleLayer([toggleId], label);
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
export function toggleLayer(ids, name) {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = name;

  // Determine current visibility
  const firstId = `${ids[0]}/${name}`;
  const visible = map.getLayer(firstId)
    && map.getLayoutProperty(firstId, 'visibility') === 'visible';
  
  if (visible) {
    link.className = 'active';
    map.on('mouseenter', ids, function (e) {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', ids, function (e) {
      map.getCanvas().style.cursor = '';
    });
  }

  link.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    const floorNum = name === 'G' ? 0 : parseInt(name, 10);
    state.levelRoutePoi = floorNum;

    // Toggle this floor on, others off
    for (const toggleId of state.toggleableLayerIds) {
      const [, lvlStr] = toggleId.split('/');
      const lvl = parseInt(lvlStr, 10);

      for (const layerName of state.layerNames) {
        const layerId = `${toggleId}/${layerName}`;
        if (!map.getLayer(layerId)) continue;
        const visibility = (lvl === floorNum) ? 'visible' : 'none';
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }

    // Update active link class
    const menu = document.getElementById('menu');
    Array.from(menu.children).forEach(el => {
      el.className = (el === link) ? 'active' : '';
    });

    // Refresh POIs
    showPoisByLevel();

    // If a route is active, redraw it and arrows
    if (state.routeEnabled ) {
      removeRouteLayer();
      //setupArrowAnimation();
      routeLevel();
      elevatorGuide();
      addFromToMarkers(
        state.fromMarkerLocation,
        state.toMarkerLocation,
        state.fromMarkerLevel,
        state.toMarkerLevel
      );
      stopAnimation();
      initializeArrowsSourceAndLayer();
      map.moveLayer("arrow-layer")
    }
  };

  document.getElementById('menu').appendChild(link);
}