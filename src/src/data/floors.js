/**
 * @module floors
 * @description Fetches floor data for all buildings via Web Workers and updates app state.
 */
import { API_CONFIG, state } from '../config.js';

/**
 * Fetches floor data for every building in state.
 * @returns {Promise<{ data: Array<Object>, isFetched: boolean }>}
 */
export async function getFloors() {
  if (
    !state.buildingsObject ||
    !Array.isArray(state.buildingsObject.buildings) ||
    state.buildingsObject.buildings.length === 0
  ) {
    console.error('No buildings available for floor fetching');
    return { data: [], isFetched: false };
  }

  const promises = state.buildingsObject.buildings.map(b =>
    fetchBuildingFloors(state.bearerToken, b.id)
  );
  const results = await Promise.all(promises);
  const ok = results.every(r => r === true);

  return { data: state.floorsObjects, isFetched: ok };
}

/**
 * Fetches floor list for a single building via a dedicated Web Worker.
 * On success, appends parsed floor data into state.floorsObjects.
 * @param {string} token - OAuth bearer token.
 * @param {string|number} buildingId - ID of the building.
 * @returns {Promise<boolean>} Resolves true if fetch succeeds.
 */
export async function fetchBuildingFloors(token, buildingId) {
  const workerCode = `
    self.onmessage = function(e) {
      const { token, buildingId, baseUrl } = e.data;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', baseUrl + 'buildings/' + buildingId + '/floors', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Encoding', 'gzip,deflate,br');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const floors = JSON.parse(xhr.responseText);
            self.postMessage({ success: true, floors });
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
    worker.postMessage({ token, buildingId, baseUrl: API_CONFIG.BASE_URL });
    worker.onmessage = e => {
      const { success, floors, error } = e.data;
      if (success) {
        state.floorsObjects.push(floors);
        resolve(true);
      } else {
        console.error('fetchBuildingFloors error:', error);
        resolve(false);
      }
      worker.terminate();
    };
    worker.onerror = err => {
      console.error('Worker failure:', err.message);
      resolve(false);
      worker.terminate();
    };
  });
}