import {map} from "../mapInit.js";

export function arrows_layer(layername, path) {
  map.addSource(layername, {
    type: "geojson",
    data: path,
  });
  map.addLayer({
    id: layername,
    type: "fill",
    source: layername,
    layout: {},
    paint: {
      "fill-color": "#ffffff",
      "fill-outline-color": "#ffffff",
    },
  });
  map.setLayoutProperty(layername, "visibility", "none");
}
