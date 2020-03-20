// GLOBAL DECLARATIONS
let svg;
let mapGroup;
let margin;
let height;
let width;
let costOfLivingData;
let projection;
let path;
let selectedIndex;
let radiusScale;

// read in data
Promise.all([
  d3.json("//unpkg.com/world-atlas@1/world/110m.json") ,
  d3.csv("cost_of_living.csv"),
  d3.csv('city_coordinates.csv')
]).then(initialize);

function initialize(data){
  
  prepareData(data[1], data[2]);
  setupPageAndMap(data[0]);

  selectedIndex = $('#indexSelector').val();

  $('#indexSelector').on('change', function(){
    selectedIndex = $(this).children("option:selected").val();
    refreshPlottedCities();
  });
  
  refreshPlottedCities();
}

function prepareData(cost_of_living, city_coordinates){
  costOfLivingData = cost_of_living;

  // add coordinates to cost of living data
  costOfLivingData.forEach(function(cityCostData){
    cityCords = city_coordinates.find(function(cityCoordinatesData){ return cityCostData.City == cityCoordinatesData.city_ascii && cityCostData.Country == cityCoordinatesData.country;});
    if (cityCords != undefined){  // if found lat and long
      cityCostData.lat = cityCords.lat; cityCostData.lng = cityCords.lng;
    }
    else {
      console.log(cityCostData.City, cityCostData.Country);
    }
  });
}

function setupPageAndMap(world_topoJSON_data){
  height = 400;
  width = 800;
  
  // create projection using Mercator.
  // Converts a lattitude and longitude into a screen coordinate
  // according to the specified projection type
  projection = d3.geoMercator()
    .translate([width/2, height/2])
    .scale((width - 1) / 2 / Math.PI);

  // create a path generator to translate from topoJSON geometry to SVG paths
  path = d3.geoPath()
  .projection(projection);

  const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on('zoom', zoomed);

  svg = d3.select( "svg" )
    .attr( "width", width)
    .attr( "height", height);
  
  mapGroup = svg.append("g");

  svg.call(zoom);

  mapGroup.append('path')
    .datum({ type: 'Sphere' })
    .attr('class', 'sphere')
    .attr('d', path);

  mapGroup.append('path')
    .datum(topojson.merge(world_topoJSON_data, world_topoJSON_data.objects.countries.geometries))
    .attr('class', 'land')
    .attr('d', path);

  mapGroup.append('path')
    .datum(topojson.mesh(world_topoJSON_data, world_topoJSON_data.objects.countries, (a, b) => a !== b))
    .attr('class', 'boundary')
    .attr('d', path);
}

function zoomed() {
  mapGroup.selectAll('path')
    .attr('transform', d3.event.transform);
  
  svg.selectAll(".city-circle")
    .attr('transform', d3.event.transform);
}

function refreshPlottedCities(){

  computeRadiusScale();

  let cityUpdateSelection = svg.selectAll(".city-circle").data(costOfLivingData);

  let cityEnterSelection = cityUpdateSelection.enter();

  cityEnterSelection
    .append("circle")
    .attr("class", "city-circle")
    .on("click", onClickCity)
    .on("mouseover", onMouseOverCity)
    .on("mouseout", onMouseOutOfCity)
    .attr("fill", "red")
    .merge(cityUpdateSelection)
    .attr("r", function(d){
      return radiusScale(d[selectedIndex]);
    })
    .attr("cx", function(d){
      let coords = projection([d.lng, d.lat]);
      return coords[0];
    })
    .attr("cy", function(d){
      let coords = projection([d.lng, d.lat]);
      return coords[1];
    });

    cityUpdateSelection.exit()
      .remove();
}

// HELPER FUNCTIONS

function computeRadiusScale(){
  // make white the average index value for the currently selected index, rather than simply 50
  let sum = 0;
  let total = 0;
  let max = 0;
  let min = 130;
  costOfLivingData.forEach(function(d){
    total++;
    sum += parseFloat(d[selectedIndex]);
    if (parseFloat(d[selectedIndex]) > max){
      max = parseFloat(d[selectedIndex]);
    }
    if (parseFloat(d[selectedIndex]) < min){
      min = parseFloat(d[selectedIndex]);
    }
  });
  let avg = sum/total;

  console.log("sum: ", sum);
  console.log("total: ", total);
  console.log("min: ", min);
  console.log("average: ", avg);
  console.log("max: ", max);

  radiusScale = d3.scaleLinear()
    .domain([min, max])
    .range([0.5, 4]);
}

function onMouseOverCity(d){
  d3.select(this).classed("mouseover", true);
  addCityToElement(d, "#hoveredCity");
}

function onMouseOutOfCity(d){
  d3.select(this).classed("mouseover", false);
  $("#hoveredCity").empty();
}

function onClickCity(d){
  let thisCity = d3.select(this);
  if (thisCity.classed("selected")){
    thisCity.classed("selected", false);
    $(`#selectedCities > .p${d.City.replace(/\W/g,'')}`).remove();
  }
  else{
    thisCity.classed("selected", true);
    addCityToElement(d, "#selectedCities");
  }        
}

function addCityToElement(d, element){
  $(element).append(`<p class="p${d.City.replace(/\W/g,'')}"><b>${d.City}</b> </br>
                              Cost of Living Index: ${d["Cost of Living Index"]},</br>
                              Rent Index: ${d["Rent Index"]},</br>
                              Cost of Living Plus Rent Index: ${d["Cost of Living Plus Rent Index"]},</br>
                              Groceries Index: ${d["Groceries Index"]},</br>
                              Restaurant Price Index: ${d["Restaurant Price Index"]},</br>
                              Local Purchasing Power Index: ${d["Local Purchasing Power Index"]}</p>`);
}

function getSelectedCities(){
  return d3.selectAll(".city-markers.selected").data();
}

