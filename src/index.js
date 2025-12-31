import * as Data from './data.js'
import * as Map from './map.js'
import './style/main.scss'

const app = document.querySelector('#app')

app.innerHTML = `
<div id="spinner">
  <div class="spinner-grow text-secondary" role="status">
    <span class="sr-only">Loading...</span>
  </div>
</div>
<div id="map"></div>
<div id="mapLegend"></div>
<div id="regionSelectDiv"></div>
`

const init = async () => {
  // Data.getSpreadsheetData()
  let data = await Data.getAirtableData()
  let airtableData = data[0]
  const colorsData = data[1]

  console.log(airtableData, colorsData);

  Map.init(airtableData, colorsData);

  const mapLegend = document.querySelector('#mapLegend')
  mapLegend.innerHTML = Map.mapLegend(colorsData)

  const mapLegendShow = document.querySelector('#map-legend-show')
  const mapLegendHide = document.querySelector('#map-legend-hide')
  const mapLegendShowNone = document.querySelector('#map-legend-show-none')
  const mapLegendShowAll = document.querySelector('#map-legend-show-all')
  const mapLegendContent = document.querySelectorAll('.map-legend-content')

  // Check if buttons exist
  if (!mapLegendShowNone || !mapLegendShowAll) {
    console.error('Legend buttons not found')
  }

  // Track selected categories - default to all selected
  const selectedCategories = new Set(colorsData.map(color => color[0]))
  const allCategories = new Set(colorsData.map(color => color[0]))

  // Function to update filtering
  function updateFiltering() {
    Map.filterMarkersByCategories(Array.from(selectedCategories))
    updateButtonVisibility()
  }

  // Function to update button visibility based on selection state
  function updateButtonVisibility() {
    if (!mapLegendShowNone || !mapLegendShowAll) return
    
    const hasSelected = selectedCategories.size > 0
    const hasUnselected = selectedCategories.size < allCategories.size
    const isLegendVisible = !mapLegendHide.classList.contains('invisible')

    // Show "Show None" if one or more are selected and legend is visible
    if (hasSelected && isLegendVisible) {
      mapLegendShowNone.classList.remove('invisible')
      mapLegendShowNone.classList.add('visible')
    } else {
      mapLegendShowNone.classList.add('invisible')
      mapLegendShowNone.classList.remove('visible')
    }

    // Show "Show All" if one or more are unselected and legend is visible
    if (hasUnselected && isLegendVisible) {
      mapLegendShowAll.classList.remove('invisible')
      mapLegendShowAll.classList.add('visible')
    } else {
      mapLegendShowAll.classList.add('invisible')
      mapLegendShowAll.classList.remove('visible')
    }
  }

  // Add click handlers to legend items
  mapLegendContent.forEach(legendItem => {
    const category = legendItem.getAttribute('data-category')
    const checkbox = legendItem.querySelector('.map-legend-checkbox')
    
    // Update selection based on checkbox state
    const updateSelection = () => {
      if (checkbox.checked) {
        selectedCategories.add(category)
        legendItem.classList.add('map-legend-selected')
      } else {
        selectedCategories.delete(category)
        legendItem.classList.remove('map-legend-selected')
      }
      updateFiltering()
    }
    
    // Initialize as selected (all categories selected by default)
    legendItem.classList.add('map-legend-selected')
    
    // Click handler for the entire row (but not the checkbox itself)
    legendItem.addEventListener('click', (e) => {
      // If clicking directly on checkbox, let it handle its own click
      if (e.target === checkbox || e.target.closest('.map-legend-checkbox')) {
        return
      }
      e.preventDefault()
      checkbox.checked = !checkbox.checked
      updateSelection()
    })
    
    // Change handler for checkbox
    checkbox.addEventListener('change', updateSelection)
    
    // Add keyboard support
    legendItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        checkbox.checked = !checkbox.checked
        updateSelection()
      }
    })
  })

  // Initial filtering (all categories selected)
  updateFiltering()

  // "Show None" button handler
  if (mapLegendShowNone) {
    mapLegendShowNone.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      // Uncheck all checkboxes and clear selection
      mapLegendContent.forEach(legendItem => {
        const checkbox = legendItem.querySelector('.map-legend-checkbox')
        if (checkbox) {
          checkbox.checked = false
        }
        legendItem.classList.remove('map-legend-selected')
      })
      selectedCategories.clear()
      updateFiltering()
    })
  } else {
    console.warn('Show None button not found')
  }

  // "Show All" button handler
  if (mapLegendShowAll) {
    mapLegendShowAll.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      // Check all checkboxes and select all categories
      mapLegendContent.forEach(legendItem => {
        const checkbox = legendItem.querySelector('.map-legend-checkbox')
        const category = legendItem.getAttribute('data-category')
        if (checkbox) {
          checkbox.checked = true
        }
        if (category) {
          selectedCategories.add(category)
        }
        legendItem.classList.add('map-legend-selected')
      })
      updateFiltering()
    })
  } else {
    console.warn('Show All button not found')
  }

  mapLegendShow.onclick = function () {
    mapLegendShow.classList.add('invisible')
    mapLegendShow.classList.remove('visible')
    mapLegendHide.classList.add('visible')
    mapLegendHide.classList.remove('invisible')
    mapLegendContent.forEach(div => {
        div.classList.add('visible')
        div.classList.remove('invisible')
    })
    // Update button visibility when legend is shown
    updateButtonVisibility()
  }
  mapLegendHide.onclick = function () {
    mapLegendShow.classList.remove('invisible')
    mapLegendShow.classList.add('visible')
    mapLegendHide.classList.remove('visible')
    mapLegendHide.classList.add('invisible')
    mapLegendContent.forEach(div => {
        div.classList.remove('visible')
        div.classList.add('invisible')
    })
    // Hide filter buttons when legend is hidden
    updateButtonVisibility()
  }
}

window.addEventListener('DOMContentLoaded', init)
