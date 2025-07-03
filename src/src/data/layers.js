/**
 * @module layers
 * @description Fetches layer data for all floors via Web Workers and updates app state.
 */
import { API_CONFIG, state } from '../config.js';

/**
 * Loads layer data for every floor of every building.
 * @returns {Promise<{ data: Array<Object>, isFetched: boolean }>}
 */
export async function loadLayerData() {
  state.layersObjects = [];

  const promises = state.buildingsObject.buildings.flatMap((building, i) =>
    state.floorsObjects[i].building_floors.map(floor =>
      fetchLayerData(state.bearerToken, floor.id)
    )
  );
  const results = await Promise.all(promises);
  const ok = results.every(r => r === true);

  return { data: state.layersObjects, isFetched: ok };
}

/**
 * Fetches layer data for a single floor via a dedicated Web Worker.
 * On success, appends parsed layer data into state.layersObjects.
 * @param {string} token - OAuth bearer token.
 * @param {string|number} floorId - ID of the floor.
 * @returns {Promise<boolean>} Resolves true if fetch succeeds.
 */
export async function fetchLayerData(token, floorId) {
  const workerCode = `
    self.onmessage = function(e) {
      const { token, floorId, baseUrl } = e.data;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', baseUrl + 'floors/' + floorId, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Encoding', 'gzip,deflate,br');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const layerData = JSON.parse(xhr.responseText);
            self.postMessage({ success: true, layerData });
          } catch (err) {
            self.postMessage({ success: false, error: err.message });
          }
        } else {
          self.postMessage({ success: false, error: 'Status ' + xhr.status });
        }
      };
      xhr.onerror = function() {
        self.postMessage({ success: false, error: 'Network error' });
      };
      xhr.send();
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  return new Promise(resolve => {
    worker.postMessage({ token, floorId, baseUrl: API_CONFIG.BASE_URL });
    worker.onmessage = e => {
      const { success, layerData, error } = e.data;
      if (success) {
        state.layersObjects.push(layerData);
        resolve(true);
      } else {
        console.error('Layer fetch failed:', error);
        resolve(false);
      }
      worker.terminate();
    };
    worker.onerror = err => {
      console.error('Worker error:', err.message);
      resolve(false);
      worker.terminate();
    };
  });
}