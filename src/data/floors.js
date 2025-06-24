import { API_BASE, state } from "../config.js";

/**
 * Fetches floor data for all buildings.
 * Returns a Promise<boolean> that resolves to true if *all* floors are fetched.
 */
export async function get_floor_json() {
  if (
    !state.buildings_object ||
    !Array.isArray(state.buildings_object.buildings) ||
    state.buildings_object.buildings.length === 0
  ) {
    console.error("No buildings to fetch floors for");
    return false;
  }

  // Kick off one fetch per building
  const promises = state.buildings_object.buildings.map((b) =>
    get_floor(state.Bearer_token, b.id)
  );

  // Await them all
  const results = await Promise.all(promises);

  // Only succeed if every fetch returned true
  return results.every((ok) => ok === true);
}

/**
 * Fetches floor data for a single building via a Web Worker.
 * On success, pushes parsed JSON into the shared `state.floors_objects` array.
 * @param {string} token – OAuth Bearer token
 * @param {string|number} building_id – ID of the building
 * @returns {Promise<boolean>}
 */
export async function get_floor(token = state.Bearer_token, building_id) {
  const workerCode = `
    self.onmessage = function (event) {
      const { token, building_id, API_BASE } = event.data;
      const xhr = new XMLHttpRequest();
      xhr.open("GET", \`\${API_BASE}buildings/\${building_id}/floors\`, true);
      xhr.setRequestHeader("Authorization", \`Bearer \${token}\`);
      xhr.setRequestHeader("accept", "application/json");
      xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const floorData = JSON.parse(xhr.responseText);
            self.postMessage({ success: true, floorData });
          } catch (err) {
            self.postMessage({ success: false, error: err.message });
          }
        } else {
          self.postMessage({
            success: false,
            error: \`Failed to fetch floor. Status: \${xhr.status}\`
          });
        }
      };
      xhr.onerror = function () {
        self.postMessage({
          success: false,
          error: "Network error while fetching floors"
        });
      };
      xhr.send();
    };
  `;
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));

  return new Promise((resolve) => {
    worker.postMessage({ token, building_id, API_BASE });
    worker.onmessage = (e) => {
      if (e.data.success) {
        state.floors_objects.push(e.data.floorData);
        resolve(true);
      } else {
        console.error("get_floor worker error:", e.data.error);
        resolve(false);
      }
    };
    worker.onerror = (err) => {
      console.error("Worker error:", err.message);
      resolve(false);
    };
  });
}
