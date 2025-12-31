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
  const mapLegendContent = document.querySelectorAll('.map-legend-content')

  mapLegendShow.onclick = function () {
    mapLegendShow.classList.add('invisible')
    mapLegendShow.classList.remove('visible')
    mapLegendHide.classList.add('visible')
    mapLegendHide.classList.remove('invisible')
    mapLegendContent.forEach(div => {
        div.classList.add('visible')
        div.classList.remove('invisible')
    })
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
  }
}

window.addEventListener('DOMContentLoaded', init)
