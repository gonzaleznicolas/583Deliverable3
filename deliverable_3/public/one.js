
let margin = {top: 50, left: 50, right: 50, bottom: 50};

let height = 400 - margin.top - margin.bottom;
let width = 800 - margin.left - margin.right;

var svg = d3.select( "body" )
  .append( "svg" )
  .attr( "width", width + margin.top + margin.bottom)
  .attr( "height", height + margin.left + margin.right)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// read in necessary data
d3.queue()
  .defer(d3.json, "world.topojson")
  .defer(d3.csv, "cost_of_living.csv")
  .defer(d3.csv, "city_coordinates.csv")
  .await(onDataLoaded);

// create projection using Mercator 
let projection = d3.geoMercator()
  .translate([width/2, height/2+50])
  .scale(110);

// create a path generator to translate from topoJSON geometry to SVG paths
let pathGenerator = d3.geoPath()
  .projection(projection);

function onDataLoaded(error, data, cost_of_living, city_coordinates){
  console.log(data);
  console.log(cost_of_living);
  console.log(city_coordinates);

  augmentCostOfLivingWithCityCoordinates(cost_of_living, city_coordinates);

  let countries = topojson.feature(data, data.objects.countries).features 
  console.log(countries);

  svg.selectAll(".country")
      .data(countries)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", pathGenerator);
}

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

