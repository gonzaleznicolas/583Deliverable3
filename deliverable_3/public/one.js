// GLOBAL DECLARATIONS
let svg;
let margin;
let height;
let width;
let costOfLivingData;
let projection;
let pathGenerator;
let selectedIndex;
let colorScale;

// read in data
Promise.all([
  d3.json("//unpkg.com/world-atlas@1/world/110m.json") ,
  d3.csv("cost_of_living.csv"),
  d3.csv('city_coordinates.csv')
]).then(initialize);

function initialize(data){
  
  prepareData(data[1], data[2]);
  setupPage();
  drawMap(data[0]);

  selectedIndex = $('#indexSelector').val();

  $('#indexSelector').on('change', function(){
    selectedIndex = $(this).children("option:selected").val();
    refreshPlottedCities();
  });

  colorScale = d3.scaleLinear()
    .domain([0, 50, 130])
    .range(['red','white', 'green']);
  
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

function setupPage(){
  margin = {top: 50, left: 50, right: 50, bottom: 50};

  height = 400 - margin.top - margin.bottom;
  width = 800 - margin.left - margin.right;
  
  svg = d3.select( "svg" )
    .attr( "width", width + margin.top + margin.bottom)
    .attr( "height", height + margin.left + margin.right)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
}

function drawMap(world_topoJSON_data){

  let countries = topojson.feature(world_topoJSON_data, world_topoJSON_data.objects.countries).features 

  // create projection using Mercator.
  // Converts a lattitude and longitude into a screen coordinate
  // according to the specified projection type
  projection = d3.geoMercator()
    .translate([width/2, height/2])
    .scale((width - 1) / 2 / Math.PI);

  // create a path generator to translate from topoJSON geometry to SVG paths
  pathGenerator = d3.geoPath()
    .projection(projection);

  // draw countries
  svg.selectAll(".country")
      .data(countries)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", pathGenerator);
}

function refreshPlottedCities(){

  let cityUpdateSelection = svg.selectAll(".city-circle").data(costOfLivingData);

  let cityEnterSelection = cityUpdateSelection.enter();

  cityEnterSelection
    .append("circle")
    .attr("class", "city-circle")
    .on("click", onClickCity)
    .on("mouseover", onMouseOverCity)
    .on("mouseout", onMouseOutOfCity)
    .attr("r", 1.5)
    .merge(cityUpdateSelection)
    .attr("fill", d => colorScale(d[selectedIndex]))
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

