import { map } from "../mapInit.js";

export function parking_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    paint: {
      "fill-color": "#B2B2B2",
      "fill-outline-color": "#FFEBAF",
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}
