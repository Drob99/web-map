import { map } from "../mapInit.js";

export function street_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#bababa",
      "fill-opacity": [
        "interpolate",
        // Set the exponential rate of change to 0.5
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0,
        20.31967926651499,
        1,
      ],
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}
