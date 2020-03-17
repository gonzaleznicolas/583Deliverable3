
let margin = {top: 50, left: 50, right: 50, bottom: 50};

let height = 400 - margin.top - margin.bottom;
let width = 800 - margin.left - margin.right;

var svg = d3.select( "body" )
  .append( "svg" )
  .attr( "height", width + margin.top + margin.bottom)
  .attr( "width", height + margin.left + margin.right)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.queue()
  .defer(d3.json, "world.topojson")
  .await(ready);

function ready(error, data){
  
}

