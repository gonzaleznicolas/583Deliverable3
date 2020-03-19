
// PAGE SETUP

let margin = {top: 50, left: 50, right: 50, bottom: 50};

let height = 400 - margin.top - margin.bottom;
let width = 800 - margin.left - margin.right;

var svg = d3.select( "svg" )
  .attr( "width", width + margin.top + margin.bottom)
  .attr( "height", height + margin.left + margin.right)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// MAP SETUP

// create projection using Mercator.
// Converts a lattitude and longitude into a screen coordinate
// according to the specified projection type
let projection = d3.geoMercator()
  .translate([width/2, height/2+50])
  .scale(110);

// create a path generator to translate from topoJSON geometry to SVG paths
let pathGenerator = d3.geoPath()
  .projection(projection);

// create color scale
let colorScale = d3.scaleLinear()
  .domain([0, 130])
  .range(['white', 'darkred']);

// MAIN CODE

$('#indexSelector').on('change', function(){
  let selectedIndex = $(this).children("option:selected").val();
  console.log(selectedIndex);
});

// read in necessary data
d3.queue()
  .defer(d3.json, "world.topojson")
  .defer(d3.csv, "cost_of_living.csv")
  .defer(d3.csv, "city_coordinates.csv")
  .await(onDataLoaded);

function onDataLoaded(error, data, cost_of_living, city_coordinates){
  augmentCostOfLivingWithCityCoordinates(cost_of_living, city_coordinates);

  console.log(data);
  console.log(cost_of_living);
  console.log(city_coordinates);

  let countries = topojson.feature(data, data.objects.countries).features 
  console.log(countries);

  // draw countries
  svg.selectAll(".country")
      .data(countries)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", pathGenerator);
  
  // draw city markers
  let cityMarkers = svg.selectAll(".city-markers")
      .data(cost_of_living)
      .enter()
      .append("g")
      .attr("class", "city-markers")
      .on("click", function(d){
        let thisCity = d3.select(this);
        if (thisCity.classed("selected")){
          thisCity.classed("selected", false);
          $("#p"+d.City).remove();
        }
        else{
          thisCity.classed("selected", true);
          $("#selectedCities").append(`<p id="p${d.City}">${d.City}, Cost of Living Index: ${d["Cost of Living Index"]}</p>`);
        }        
      })
      .on("mouseover", function(d){
        d3.select(this).classed("mouseover", true);
        $("#hoveredCity").text(`${d.City}, Cost of Living Index: ${d["Cost of Living Index"]}`);
      })
      .on("mouseout", function(d){
        d3.select(this).classed("mouseover", false);
      });

  cityMarkers.append("circle")
      .attr("class", "city-circle")
      .attr("fill", d => colorScale(d["Cost of Living Index"]))
      .attr("r", 1.5)
      .attr("cx", function(d){
        let coords = projection([d.lng, d.lat]);
        return coords[0];
      })
      .attr("cy", function(d){
        let coords = projection([d.lng, d.lat]);
        return coords[1];
      });
}

// HELPER FUNCTIONS

function augmentCostOfLivingWithCityCoordinates(cost_of_living, city_coordinates){
  cost_of_living.forEach(function(cityCostData){
    cityCords = city_coordinates.find(function(cityCoordinatesData){ return cityCostData.City == cityCoordinatesData.city_ascii && cityCostData.Country == cityCoordinatesData.country;});
    if (cityCords != undefined){  // if found lat and long
      cityCostData.lat = cityCords.lat; cityCostData.lng = cityCords.lng;
    }
    else {
      console.log(cityCostData.City, cityCostData.Country);
    }
  });
}

function getSelectedCities(){
  return d3.selectAll(".city-markers.selected").data();
}

