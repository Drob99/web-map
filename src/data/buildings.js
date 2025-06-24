import { API_BASE, state } from "../config.js";

/**
 * Fetches the list of buildings via a Web Worker.
 * @param {string} token – OAuth Bearer token (defaults to our shared state)
 * @returns {Promise<{data: string, isDataFetched: true}>}
 */
export async function get_buildings(token = state.Bearer_token) {
  // note: use single‐quoted / concatenated strings inside the workerCode
  const workerCode = `
    self.onmessage = function (event) {
      const token = event.data.token;
      const API_BASE = event.data.API_BASE;
      const xhr = new XMLHttpRequest();
      // avoid nested backticks here!
      xhr.open("GET", API_BASE + "buildings", true);
      xhr.setRequestHeader("Authorization", "Bearer " + token);
      xhr.setRequestHeader("accept", "application/json");
      xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          self.postMessage({ success: true, data: xhr.responseText });
        } else {
          self.postMessage({
            success: false,
            error: "Failed to fetch buildings. Status: " + xhr.status
          });
        }
      };
      xhr.onerror = function () {
        self.postMessage({
          success: false,
          error: "An error occurred during the XMLHttpRequest"
        });
      };
      xhr.send();
    };
  `;

  // spawn the worker
  const blob   = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));

  return new Promise((resolve, reject) => {
    worker.postMessage({ token, API_BASE });
    worker.onmessage = function (event) {
      const { success, data, error } = event.data;
      if (success) {
        sessionStorage.setItem("state.buildings_object", data);
        resolve({ data, isDataFetched: true });
      } else {
        console.error("Worker error:", error);
        reject(error);
      }
    };
    worker.onerror = function (e) {
      console.error("Worker encountered an error:", e.message);
      reject(e.message);
    };
  });
}