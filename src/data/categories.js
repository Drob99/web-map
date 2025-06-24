import * as cfg from "../config.js";
import { API_BASE } from "../config.js";

/**
 * Fetches the list of building POI categories,
 * stores them in cfg.state.category_object and cfg.state.category_array,
 * and returns a Promise<boolean> that resolves to true on success.
 */
export async function get_category(token = cfg.state.Bearer_token) {
  let isDataFetched = false; // Initialize the flag
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE}building_poi_categories`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("accept", "application/json");
    xhr.setRequestHeader("Content-Encoding", "gzip,deflate, br");
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState == 4) {
        if (this.status >= 200 && this.status < 300) {
          try {
            cfg.state.category_object = JSON.parse(this.responseText);
            cfg.state.category_object.building_poi_categories.push({
              id: "o",
              name: "Others",
            });

            const category_length =
              cfg.state.category_object.building_poi_categories.length;
            for (let a = 0; a < category_length; a++) {
              cfg.state.category_array[
                cfg.state.category_object.building_poi_categories[a].id
              ] = cfg.state.category_object.building_poi_categories[a].name;
            }
            isDataFetched = true; // Set the flag
            resolve(isDataFetched); // Resolve the promise
          } catch (error) {
            reject("Error parsing response: " + error.message);
          }
        } else {
          reject("Failed to fetch categories. Status: " + this.status);
        }
      }
    });

    xhr.onerror = () => reject("Network error");
    xhr.send();
  });
}
