import { BASE_TOKEN, MAPBOX_STYLE } from "./config.js";
import { switch_to_current_floor } from "./mapController.js";

export function initMap(containerId, opts = {}) {
  // 1) set token
  mapboxgl.accessToken = opts.token || BASE_TOKEN;

  // 2) create map
  const style = opts.style || MAPBOX_STYLE;
  const center = opts.center || [-74.5, 40];
  const zoom = opts.zoom || 9;
  const navPosition = opts.navPosition || "bottom-right";
  const m = new mapboxgl.Map({
    container: containerId,
    center,
    zoom,
    style,
  });

  // 3) nav controls
  m.addControl(new mapboxgl.NavigationControl(), navPosition);

  // 4) style tweak (guard against missing layer)
  m.on("style.load", () => {
    // corrected layer ID (no hidden char)
    const layerId = "3d-buildings";
    if (m.getLayer(layerId)) {
      m.setLayerZoomRange(layerId, 0, 15.7);
    }
    document.querySelector(".mapboxgl-ctrl-logo").href =
      "https://nearmotion.com/";
  });

  // 5) once everything’s loaded, show the default floor
  m.on("load", () => {
    switch_to_current_floor();
  });

  return m;
}

export const map = initMap("map");