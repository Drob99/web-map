import { map } from "../mapInit.js";

export function rooms_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#FFFBF5",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        // When zoom is 10, buildings will be 100% transparent.
        16.4,
        0,
        // When zoom is 18 or higher, buildings will be 100% opaque.
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}
