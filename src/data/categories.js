/**
 * @module categories
 * @description Fetches building POI categories via XHR and updates app state.
 */
import { API_CONFIG, state } from '../config.js';

/**
 * Retrieves building POI categories, adds an "Others" category,
 * and updates state.categoryObject and state.categoryArray.
 * @param {string} [token=state.bearerToken] - OAuth bearer token for authorization.
 * @returns {Promise<boolean>} Resolves true if categories fetched successfully.
 */
export async function getCategories(token = state.bearerToken) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${API_CONFIG.BASE_URL}building_poi_categories`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Encoding', 'gzip,deflate,br');

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          // Add fallback "Others" category
          result.building_poi_categories.push({ id: 'o', name: 'Others' });

          // Update state
          state.categoryObject = result;
          state.categoryArray = result.building_poi_categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
          }, {});

          resolve(true);
        } catch (err) {
          reject(`Error parsing categories response: ${err.message}`);
        }
      } else {
        reject(`Failed to fetch categories. Status: ${xhr.status}`);
      }
    };

    xhr.onerror = () => reject('Network error while fetching categories');
    xhr.send();
  });
}