import { map } from "../mapInit.js";

export function doors_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });

  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#F2DCBB",
      "fill-outline-color": "#000000",
      "fill-opacity": [
        "interpolate",
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
