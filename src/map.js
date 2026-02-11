import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  LON_COL,
  LAT_COL,
  ENTITY_COL,
  LOCATION_COL,
  ROLE_COL,
  ADDRESS_COL,
  CONTACT_COL,
  EMAIL_COL,
  PHONE_COL,
  WEBSITE_COL,
  COLLABORATION_COL,
  COLOR_COL,
} from './data_constants.js'

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE_ID = import.meta.env.VITE_MAPBOX_STYLE_ID;

if (!MAPBOX_ACCESS_TOKEN) {
  throw new Error('VITE_MAPBOX_ACCESS_TOKEN is required. Please set it in your .env.local file.');
}

if (!MAPBOX_STYLE_ID) {
  throw new Error('VITE_MAPBOX_STYLE_ID is required. Please set it in your .env.local file.');
}

const MAPBOX_LINK = `https://api.mapbox.com/styles/v1/bpemaps/${MAPBOX_STYLE_ID}/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

const INITIAL_COORDS = [37.76496739271615, -122.39985495803376]
const INITIAL_ZOOM = 5
const isMobile = window.innerHeight >= window.innerWidth

export {
  init,
  initMap,
  addMarkers,
  setSelectedCategories,
  mapLegend,
  zoomToRegion,
  filterMarkersByCategories,
}

let geoJSON
let map
let pointsLayers
let categoryToMarkers = new Map() // Map of category name -> array of markers
let activeCategories = new Set()
let markerVisibleCounts = new WeakMap()
let isFilteringEnabled = false
let isMapInitialized = false
let hasInitialBounds = false

function init(data, colorsData) {
  geoJSON = buildGeoJSON(data)
  console.log(data)
  console.log(geoJSON)
  console.log(data.length, 'rows received')
  console.log(geoJSON.features.length, 'rows parsed')
  loadMap(geoJSON, colorsData)
  setTimeout(function(){
    document.getElementById('spinner').style.display = 'none'
  }, 350)
}

// Initialize empty map (call this first for progressive loading)
function initMap() {
  if (isMapInitialized) return;
  
  map = L.map('map', {
    center: INITIAL_COORDS,
    zoom: INITIAL_ZOOM,
    scrollWheelZoom: true,
    zoomControl: false,
    preferCanvas: true,
  })

  L.control.zoom({
    position: 'bottomleft'
  }).addTo(map);

  L.tileLayer(MAPBOX_LINK, {
    maxZoom: 18,
    attribution: 'Map data &copy <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
  }).addTo(map)

  // Initialize the points layer group
  pointsLayers = L.layerGroup().addTo(map)
  
  isMapInitialized = true
  console.log('Map initialized')
}

// Set the selected categories reference for filtering new markers
function setSelectedCategories(categories) {
  if (categories instanceof Set) {
    activeCategories = new Set(categories)
    isFilteringEnabled = true
    return
  }
  if (!categories) {
    isFilteringEnabled = false
    activeCategories = new Set()
    return
  }
  activeCategories = new Set(categories)
  isFilteringEnabled = true
}

// Add markers progressively (call this for each batch of data)
function addMarkers(data, onComplete) {
  if (!isMapInitialized) {
    console.error('Map not initialized. Call initMap() first.')
    return
  }

  const newGeoJSON = buildGeoJSON(data)
  console.log(`Adding ${newGeoJSON.features.length} markers`)

  // Store features in main geoJSON for reference
  if (!geoJSON) {
    geoJSON = { type: "FeatureCollection", features: [] }
  }
  geoJSON.features = [...geoJSON.features, ...newGeoJSON.features]

  // Fit bounds on first batch of data
  if (!hasInitialBounds && newGeoJSON.features.length > 0) {
    const bounds = L.geoJSON(newGeoJSON).getBounds()
    map.fitBounds(bounds)
    hasInitialBounds = true
  }

  const features = newGeoJSON.features
  const batchSize = 18
  const frameBudgetMs = 4
  let index = 0

  function addBatch() {
    const startTime = window.performance && window.performance.now
      ? window.performance.now()
      : Date.now()
    const end = Math.min(index + batchSize, features.length)
    for (; index < end; index += 1) {
      const feature = features[index]
      const latlng = L.latLng(
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0]
      )
      
      const marker = L.circleMarker(latlng, {
        radius: 5,
        fillColor: getFeatureColor(feature.properties[COLOR_COL]),
        color: "#fff",
        weight: 1.2,
        opacity: 1,
        fillOpacity: 0.9,
      })

      // Bind popup/tooltip only when needed
      bindPopupAndTooltipOnDemand(feature, marker)
      
      const roles = normalizeRoles(feature.properties[ROLE_COL])
      marker.__roles = roles
      registerMarkerForCategories(marker, roles)
      setInitialMarkerVisibility(marker, roles)

      const now = window.performance && window.performance.now
        ? window.performance.now()
        : Date.now()
      if (now - startTime >= frameBudgetMs) {
        break
      }
    }

    if (index < features.length) {
      window.requestAnimationFrame(addBatch)
      return
    }

    // Hide spinner after first batch
    const spinner = document.getElementById('spinner')
    if (spinner) {
      spinner.style.display = 'none'
    }

    if (onComplete) onComplete()
  }

  window.requestAnimationFrame(addBatch)

}

// Helper function for popup and tooltip (extracted from loadMap)
function bindPopupAndTooltipOnDemand(feature, layer) {
  let prop = feature.properties

  const display = (text) => { return text ? text : '' }

  const popupHtml = () => `
    <div class="popup">
      <h2>${prop[ENTITY_COL]}</h2>
      ${prop[LOCATION_COL] ? `<h4>${prop[LOCATION_COL]}</h4>` : ''}
      <hr/>
      <table class="popup-table">
        <tbody>
          <tr><td><strong>Role(s)</strong></td><td>${display(prop[ROLE_COL])}</td></tr>
          <tr><td><strong>Address</strong></td><td>${display(prop[ADDRESS_COL])}</td></tr>
          <tr><td><strong>Contact</strong></td><td>${display(prop[CONTACT_COL])}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${display(prop[EMAIL_COL])}">${display(prop[EMAIL_COL])}</a></td></tr>
          <tr><td><strong>Phone</strong></td><td><a href="tel:${display(prop[PHONE_COL])}">${display(prop[PHONE_COL])}</a></td></tr>
          <tr><td><strong>Website</strong></td><td><a href="${display(prop[WEBSITE_COL])}" target="_blank">${display(prop[WEBSITE_COL])}</a></td></tr>
        </tbody>
      </table>
      ${prop[COLLABORATION_COL] ? `<p class="popup-p"><strong>Collaboration Opportunities: </strong>${display(prop[COLLABORATION_COL])}</p>` : ''}
    </div>
    `

  const tooltipHtml = () => `
    <div class="tooltip">
      <strong style="font-size: 1.25em;">${prop[ENTITY_COL]}</strong>
      ${prop[LOCATION_COL] ? `<br /><span>${prop[LOCATION_COL]}</span>` : ''}
    </div>
    `

  layer.on('click', () => {
    if (!layer.getPopup()) {
      layer.bindPopup(popupHtml(), {
        maxWidth : isMobile ? window.innerWidth * 0.75 : 600
      })
    }
    layer.openPopup()
  })

  layer.on('mouseover', () => {
    if (!layer.getTooltip()) {
      layer.bindTooltip(tooltipHtml(), {
        maxWidth : isMobile ? window.innerWidth * 0.75 : 250
      })
    }
    layer.openTooltip()
  })
}

function getFeatureColor(colorCol) {
  const fallbackColor = '#333'
  if (!colorCol || !colorCol.length) { return fallbackColor }
  return colorCol[0]
}

function buildFeature(feature) {
  let featureObject = {
    "type": "Feature",
    "properties": feature,
    "geometry": {
      "type": "Point",
      "coordinates": []
    }
  }
  // for (let variable in feature) {
  //   if (feature.hasOwnProperty(variable)) {
  //     featureObject.properties[variable.trim()] = feature[variable].trim()
  //   }
  // }
  featureObject.geometry.coordinates.push(parseFloat(feature[LON_COL]))
  featureObject.geometry.coordinates.push(parseFloat(feature[LAT_COL]))
  return featureObject
}

function buildGeoJSON(data) {
  let featureCollection = {
    "type": "FeatureCollection",
    "features": []
  }
  for (var i = 0; i < data.length; i++) {
    let feature = data[i]
    if (!feature[LON_COL] || !feature[LAT_COL]) { continue }
    feature[LON_COL] = feature[LON_COL].replace(',', '.')
    feature[LAT_COL] = feature[LAT_COL].replace(',', '.')
    let lon = feature[LON_COL]
    let lat = feature[LAT_COL]
    if (lon.match(/[a-z]/i) && lat.match(/[a-z]/i)) {
      feature[LON_COL] = parseDMS(feature[LON_COL])
      feature[LAT_COL] = parseDMS(feature[LAT_COL])
    }
    try {
      if (isNaN(parseFloat(lon)) == false && isNaN(parseFloat(lat)) == false) {
        let built = buildFeature(feature)
        featureCollection['features'].push(built)
      }
    } catch (e) {
        console.log('error parsing row', i, feature, e)
    }
  }
  return featureCollection
}

function loadMap(geoJSON) {
  map = L.map('map', {
    center: INITIAL_COORDS,
    zoom: INITIAL_ZOOM,
    scrollWheelZoom: true,
    zoomControl: false,
    preferCanvas: true,
  })

  L.control.zoom({
    position: 'bottomleft'
  }).addTo(map);

  L.tileLayer(MAPBOX_LINK, {
    maxZoom: 18,
    attribution: 'Map data &copy <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
  }).addTo(map)

  // Reset category mapping
  categoryToMarkers.clear()
  
  pointsLayers = L.geoJSON(geoJSON, {
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 5,
        fillColor: getFeatureColor(feature.properties[COLOR_COL]),
        color: "#fff",
        weight: 1.2,
        opacity: 1,
        fillOpacity: 0.9,
      })
    },
    onEachFeature: function(feature, layer) {
      bindPopupAndTooltipOnDemand(feature, layer)
    }
  }).addTo(map)

  const layers = []
  pointsLayers.eachLayer(layer => layers.push(layer))
  layers.forEach(layer => {
    const feature = layer.feature
    if (!feature || !feature.properties) return
    const roles = normalizeRoles(feature.properties[ROLE_COL])
    layer.__roles = roles
    registerMarkerForCategories(layer, roles)
    setInitialMarkerVisibility(layer, roles)
  })

  map.fitBounds(pointsLayers.getBounds())
}

function zoomToRegion(regionName) {
  if (regionName.toLowerCase() === 'all') {
    map.fitBounds(L.geoJSON(geoJSON).getBounds())
    return
  }
  // const filteredData = geoJSON.features.filter(row => row.properties['REGION'] === regionName)
  // if (filteredData) {
  //   map.fitBounds(L.geoJSON(filteredData).getBounds())
  // }
}

// https://stackoverflow.com/questions/1140189/converting-latitude-and-longitude-to-decimal-values
function parseDMS(input) {
    let parts = input.split(/[^\d\w\.]+/)
    return convertDMSToDD(parts[0], parts[1], parts[2], parts[3])
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = parseInt(degrees) + parseInt(minutes)/60 + parseInt(seconds)/(60*60)

    if (direction == "S" || direction == "W") {
        dd = dd * -1
    }
    return dd
}

function mapLegend(colors) {
  const colorsHTML = [`
    <div id="map-legend-show" class="map-legend-row map-legend-icon flex ${isMobile ? 'visible' : 'invisible'}">
      <span>See Legend</span>
    </div>
    <div class="map-legend-buttons-row flex">
      <div id="map-legend-hide" class="map-legend-icon flex ${isMobile ? 'invisible' : 'visible'}">
        <span>Hide Legend</span>
      </div>
      <div id="map-legend-show-none" class="map-legend-icon flex invisible">
        <span>Show None</span>
      </div>
      <div id="map-legend-show-all" class="map-legend-icon flex invisible">
        <span>Show All</span>
      </div>
    </div>
  `]
  for (const color of colors) {
    const categoryName = color[0]
    colorsHTML.push(`
      <div class="map-legend-row map-legend-content flex ${isMobile ? 'invisible' : 'visible'}" 
           data-category="${categoryName.replace(/"/g, '&quot;')}" 
           role="button" 
           tabindex="0">
        <input
          type="checkbox"
          class="map-legend-checkbox"
          style="--legend-item-color: ${color[1]};"
          checked
          aria-label="Filter ${categoryName}">
        <span>${categoryName}</span>
      </div>
    `)
  }
  return `<div class="map-legend flex flex-column">${colorsHTML.join('\n')}</div>`
}

function filterMarkersByCategories(selectedCategories) {
  const selectedSet = new Set(selectedCategories)

  if (!isFilteringEnabled) {
    isFilteringEnabled = true
    activeCategories = new Set()
    rebuildVisibilityCounts(selectedSet)
    activeCategories = selectedSet
    return
  }

  const addedCategories = []
  const removedCategories = []

  activeCategories.forEach(category => {
    if (!selectedSet.has(category)) {
      removedCategories.push(category)
    }
  })

  selectedSet.forEach(category => {
    if (!activeCategories.has(category)) {
      addedCategories.push(category)
    }
  })

  if (addedCategories.length === 0 && removedCategories.length === 0) {
    return
  }

  removedCategories.forEach(category => {
    const markers = categoryToMarkers.get(category)
    if (!markers) return
    markers.forEach(marker => {
      decrementMarkerVisibility(marker)
    })
  })

  addedCategories.forEach(category => {
    const markers = categoryToMarkers.get(category)
    if (!markers) return
    markers.forEach(marker => {
      incrementMarkerVisibility(marker)
    })
  })

  activeCategories = selectedSet
}

function normalizeRoles(roles) {
  if (Array.isArray(roles)) return roles.filter(Boolean)
  if (roles) return [roles]
  return []
}

function registerMarkerForCategories(marker, roles) {
  roles.forEach(role => {
    if (!categoryToMarkers.has(role)) {
      categoryToMarkers.set(role, [])
    }
    categoryToMarkers.get(role).push(marker)
  })
}

function setInitialMarkerVisibility(marker, roles) {
  if (!isFilteringEnabled) {
    markerVisibleCounts.set(marker, 1)
    pointsLayers.addLayer(marker)
    return
  }
  let count = 0
  roles.forEach(role => {
    if (activeCategories.has(role)) {
      count += 1
    }
  })
  markerVisibleCounts.set(marker, count)
  if (count > 0) {
    pointsLayers.addLayer(marker)
  } else {
    pointsLayers.removeLayer(marker)
  }
}

function incrementMarkerVisibility(marker) {
  const currentCount = markerVisibleCounts.get(marker) || 0
  const nextCount = currentCount + 1
  markerVisibleCounts.set(marker, nextCount)
  if (nextCount === 1) {
    pointsLayers.addLayer(marker)
  }
}

function decrementMarkerVisibility(marker) {
  const currentCount = markerVisibleCounts.get(marker) || 0
  if (currentCount === 0) return
  const nextCount = currentCount - 1
  markerVisibleCounts.set(marker, nextCount)
  if (nextCount === 0) {
    pointsLayers.removeLayer(marker)
  }
}

function rebuildVisibilityCounts(selectedSet) {
  pointsLayers.clearLayers()
  const allMarkers = new Set()
  categoryToMarkers.forEach(markers => {
    markers.forEach(marker => {
      allMarkers.add(marker)
    })
  })
  allMarkers.forEach(marker => {
    markerVisibleCounts.set(marker, 0)
  })
  selectedSet.forEach(category => {
    const markers = categoryToMarkers.get(category)
    if (!markers) return
    markers.forEach(marker => {
      incrementMarkerVisibility(marker)
    })
  })
}
