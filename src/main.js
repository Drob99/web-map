import { initMap } from "./map/initMap.js";

// pass in real token
const map = initMap('map', {
  accessToken:
    'pk.eyJ1Ijoibm1hY2NvdW50cyIsImEiOiJja2xhazRobjgzbDkxMm9xb2d3YmQ3d2s2In0.wGFavxo8mpa7OI_lEhYUow',
  style: 'mapbox://styles/mapbox/streets-v11', // or your custom style
  center: [-74.5, 40],
  zoom: 9,
  navPosition: 'bottom-right',
});