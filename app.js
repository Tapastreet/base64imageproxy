var express = require("express"),
    request = require("request"),
    _ = require("underscore"),
    app = express();

    var allowedHosts = ['http://tapastreet-facebook.herokuapp.com', 'https://tapastreet-facebook.herokuapp.com'];
    var allowCrossDomain = function(req, res, next) {
    if(allowedHosts.indexOf(req.headers.origin) !== -1 || true) {
        res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        // intercept OPTIONS method
        if ('OPTIONS' == req.method) {
            res.send(200);
        } else {
            next();
        }

    } else {
        res.send("Nope.",401);
    }
}

app.configure('development', function() {
    app.set('port', process.env.PORT || 4000);
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
    app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.set('port', process.env.PORT || 4000);
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
});

app.get("/", function(req, res) {
    res.send("<h1 style='text-align:center;'><a href='https://github.com/Tapastreet/base64imageproxy'>Node.js imageURL to base64 proxy server.</a></h1>");   
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
                // Should not use binary encoding as
                //     - It will be removed from next versions of Node
                //     - request will return the body as a ready-to-use buffer if no encoding is specified.
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

app.listen(app.get('port'), function(){
  console.log("Base64ImageProxy server listening on port " + app.get('port'));
});
