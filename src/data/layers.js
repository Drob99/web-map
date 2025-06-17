// src/data/layers.js
import {
    API_BASE,
    state
  } from "../config.js";
  
  /**
   * Fetches all layer data for every floor of every building.
   * Returns a Promise<boolean> that resolves to true only if every floor’s layers were fetched successfully.
   */
  export async function Load_Layer_data() {
    state.Layers_objects.length = 0;
    const promises = [];
  
    state.buildings_object.buildings.forEach((building, i) => {
      state.floors_objects[i].building_floors.forEach((floor) => {
        promises.push(get_layer_data(floor.id));
      });
    });
  
    const results = await Promise.all(promises);
    return results.every((ok) => ok === true);
  }
  
  /**
   * Fetches the layer JSON for a single floor via a Web Worker.
   * On success, pushes the parsed JSON into the shared `state.Layers_objects` array.
   * @param {string|number} floor_id
   * @returns {Promise<boolean>}
   */
  export async function get_layer_data(floor_id) {
    const workerCode = `
      self.onmessage = function (e) {
        const { floor_id, API_BASE, Bearer_token } = e.data;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", \`\${API_BASE}floors/\${floor_id}\`, true);
        xhr.setRequestHeader("Authorization", \`Bearer \${Bearer_token}\`);
        xhr.setRequestHeader("accept", "application/json");
        xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const layerData = JSON.parse(xhr.responseText);
              self.postMessage({ success: true, layerData });
            } catch (err) {
              self.postMessage({ success: false, error: err.message });
            }
          } else {
            self.postMessage({ success: false, error: \`Status \${xhr.status}\` });
          }
        };
        xhr.onerror = function () {
          self.postMessage({ success: false, error: "Network error" });
        };
        xhr.send();
      };
    `;
    const blob   = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    return new Promise((resolve) => {
      worker.postMessage({ floor_id, API_BASE, Bearer_token: state.Bearer_token });
      worker.onmessage = (e) => {
        if (e.data.success) {
          state.Layers_objects.push(e.data.layerData);
          resolve(true);
        } else {
          console.error("Layer fetch failed:", e.data.error);
          resolve(false);
        }
      };
      worker.onerror = (err) => {
        console.error("Worker error:", err.message);
        resolve(false);
      };
    });
  }