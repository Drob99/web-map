import { map } from "../mapInit.js";

export function outlayer_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "line",
    source: layername,
    minzoom: 14,
    paint: {
      "line-color": "#141414",
      "line-width": [
        "interpolate",
        ["exponential", 0.1],
        ["zoom"],
        16.4,
        0.5,
        22,
        3,
      ],
      "line-opacity": [
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
