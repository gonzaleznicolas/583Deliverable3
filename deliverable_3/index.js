var express = require('express');
var app = express();

// allow files in public directory to be served as static files
app.use(express.static('public'));

app.get('/one', function (req, res) {
	res.sendFile(__dirname + '/one.html');
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});