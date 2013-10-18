var express = require("express"),
    request = require("request"),
    _ = require("underscore"),
    app = express(),
    allowedHosts = ['http://tapastreet-facebook.herokuapp.com', 'https://tapastreet-facebook.herokuapp.com'],
    allowCrossDomain = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        // intercept OPTIONS method
        if ('OPTIONS' == req.method) {
            res.send(200);
        } else {
            next();
        }
}

app.configure(function() {
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
});

app.post("/batch", function(req, res) {
    if(!req.param("data")) res.send("No data");
    var data = req.body.data,
        pending = req.body.length,
        images = Object.create(null);

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