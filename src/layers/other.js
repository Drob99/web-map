import { map } from "../mapInit.js";

export function otherlayer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "line",
    source: layername,
    paint: {
      "line-color": "#969696",
      "line-width": 0.7,
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
