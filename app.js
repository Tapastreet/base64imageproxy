var express = require("express");
var request = require("request");
 
var app = express();

var allowedHosts = ['http://localhost:3000', 'http://tapastreet-facebook.herokuapp.com'];

var allowCrossDomain = function(req, res, next) {
    console.log(req.headers.origin);
    if(allowedHosts.indexOf(req.headers.origin) !== -1 || true) {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        // intercept OPTIONS method
        if ('OPTIONS' == req.method) {
            res.send(200);
        } else {
            next();
        }

    } else {
        res.send(401);
    }
}

app.configure(function() {
    app.use(allowCrossDomain);
});

app.get("/batch", function(req, res) {
    if(!req.param("data")) res.send("No data");
    var data = req.param("data");

    if(!Array.isArray(data)) {
        data = [data];
    }

    var pending = data.length;
    var images = Object.create(null);

    data.forEach(function(current, index) {
        request({ uri: current, encoding: 'binary'}, function(error, response, body) {
            var prefix, image;
            
            if(!error && response.statusCode == 200) {
                prefix = "data:" + response.headers["content-type"] + ";base64,";
                image = new Buffer(body.toString(), "binary").toString("base64");
                images[current] = prefix + image;
            } else {
                console.log(error);
                console.log("There was an error");
                images[current] = null;
            }

            if(!--pending) {
                res.send(images);
            }
        });
    });
});

app.listen(process.env.PORT || 8000);