var express = require("express");
var request = require("request");
var _ = require("underscore");
 
var app = express();

var allowedHosts = ['http://localhost:3000', 'http://tapastreet-facebook.herokuapp.com'];

var allowCrossDomain = function(req, res, next) {
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
    app.use(express.logger());
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
});

app.post("/batch", function(req, res) {
    if(!req.param("data")) res.send("No data");
    var data = req.body.data;

    var pending = req.body.length;
    var images = Object.create(null);

    _.each(data, function(current, index) {
        request({uri: current.url, encoding: "binary"}, function(error, response, body) {
            var prefix, image;
            
            if(!error && response.statusCode == 200) {
                prefix = "data:" + response.headers["content-type"] + ";base64,";
                image = new Buffer(body.toString(), "binary").toString("base64");
                images[current.id] = {
                    id: current.id,
                    base64 : prefix + image
                };
            } else {
                images[current.id] = {
                    id: current.id,
                    base64 : null,
                    url : current.url
                };

            }

            if(!--pending) {
                res.send(images);
            }
        });
    });
});

app.listen(process.env.PORT || 8000);