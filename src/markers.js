import { map } from "./mapInit.js";
import { draw_path_to_poi, routeEnabled } from "./data/routes.js";
import { ClearRoute } from "./mapController.js";

let fromMarker = null,
  toMarker = null;
let fromPolygonId = null,
  toPolygonId = null;
let from_lg, from_lt, from_lvl, from_poi_name;
let to_lg, to_lt, to_lvl, to_poi_name;

/**
 * Wire up click‐on‐polygon to place A/B markers and draw route.
 */
export function setupMapEventHandlers() {
  map.on("click", "polygons", function (e) {
    const clicked = e.features[0];
    const coords = turf.centroid(clicked).geometry.coordinates;
    const id = clicked.id;
    const level = clicked.properties.Level || 0;
    const title = clicked.properties.title || "";

    if (!fromMarker) {
      // place A
      fromPolygonId = id;
      from_lg = coords[0];
      from_lt = coords[1];
      from_lvl = level;
      from_poi_name = title;
      fromMarker = new mapboxgl
        .Marker(createMarkerEl("A", "#00BFFF"))
        .setLngLat(coords)
        .addTo(map);
      if (routeEnabled) ClearRoute();
      fly_to_A_point(from_lg, from_lt);

    } else if (!toMarker) {
      // ensure B ≠ A
      if (id === fromPolygonId) return;
      toPolygonId = id;
      to_lg = coords[0];
      to_lt = coords[1];
      to_lvl = level;
      to_poi_name = title;
      toMarker = new mapboxgl
        .Marker(createMarkerEl("B", "#6A5ACD"))
        .setLngLat(coords)
        .addTo(map);
      if (routeEnabled) ClearRoute();
      draw_path_to_poi(
        from_poi_name,
        from_lg,
        from_lt,
        from_lvl,
        to_poi_name,
        to_lg,
        to_lt,
        to_lvl
      );
    } else {
      // both exist → reset
      resetMarkers();
    }
  });
}

/** Remove both A & B markers and reset state. */
export function resetMarkers() {
  if (fromMarker) fromMarker.remove();
  if (toMarker) toMarker.remove();
  fromMarker = toMarker = null;
  fromPolygonId = toPolygonId = null;
  from_poi_name = to_poi_name = "";
  from_lg = from_lt = from_lvl = null;
  to_lg = to_lt = to_lvl = null;
}

/** Fly‐to helper for point A. */
function fly_to_A_point(lng, lat) {
  map.flyTo({
    center: [lng, lat],
    bearing: map.getBearing(),
    pitch: 0,
    zoom: 19.343589520103954,
    duration: 4000,
    essential: true,
  });
}

/** Build a little DIV for a marker labelled “A” or “B”. */
function createMarkerEl(letter, bgColor) {
  const el = document.createElement("div");
  el.innerHTML = `<div style="
      background:${bgColor};
      color:#fff;
      border-radius:50%;
      width:30px;
      height:30px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:bold;
      box-shadow:0 0 6px rgba(0,0,0,0.3);
    ">${letter}</div>`;
  return el;
}