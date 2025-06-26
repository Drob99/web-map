/**
 * @module buildings
 * @description Fetches building data via a Web Worker and caches it in sessionStorage.
 */
import { API_CONFIG, state } from '../config.js';

/**
 * Retrieves the list of buildings using a dedicated Web Worker.
 * @param {string} [token=state.bearerToken] - OAuth Bearer token for authorization.
 * @returns {Promise<{ data: Array<Object>, isFetched: true }>}
 */
export async function getBuildings(token = state.bearerToken) {
  // Inline worker code: do not use backticks inside this string
  const workerCode = `
    self.onmessage = function(event) {
      const token = event.data.token;
      const baseUrl = event.data.baseUrl;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', baseUrl + 'buildings', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Encoding', 'gzip,deflate, br');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          self.postMessage({ success: true, payload: xhr.responseText });
        } else {
          self.postMessage({
            success: false,
            error: 'Failed to fetch buildings. Status: ' + xhr.status
          });
        }
      };
      xhr.onerror = function() {
        self.postMessage({
          success: false,
          error: 'An error occurred during the XMLHttpRequest'
        });
      };
      xhr.send();
    };
  `;

  // Spawn the worker from a Blob
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  return new Promise((resolve, reject) => {
    worker.postMessage({ token, baseUrl: API_CONFIG.BASE_URL });
    worker.onmessage = function(event) {
      const { success, payload, error } = event.data;
      if (success) {
        try {
          const data = JSON.parse(payload);
          sessionStorage.setItem('state.buildings', JSON.stringify(data));
          resolve({ data, isFetched: true });
        } catch (e) {
          reject('Failed to parse buildings JSON: ' + e.message);
        }
      } else {
        console.error('Worker error:', error);
        reject(error);
      }
      worker.terminate();
    };
    worker.onerror = function(e) {
      console.error('Worker encountered an error:', e.message);
      reject(e.message);
      worker.terminate();
    };
  });
}