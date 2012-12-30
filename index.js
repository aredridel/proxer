var bouncy = require('bouncy');
var fcgi = require('fcgi');
var url = require('url');
var path = require('path');
var minimatch = require('minimatch');
var Static = require('node-static');

module.exports = function createProxerServer(routes, handlers) {

    var statics = {};

    return bouncy(function (req, res, bounce) {
        var host = (req.headers.host || '').replace(/:\d+$/, '');
        var route = routes[host] || routes['*'];
        var reqUrl = url.parse(req.url);
        
        if (Array.isArray(route)) {
            // jump to a random route on arrays
            route = route[Math.floor(Math.random() * route.length)];
        }
        
        req.on('error', onerror);
        function onerror (err) {
            if (err) {
                res.setHeader('content-type', 'text/plain');
                if (err.status) {
                    res.statusCode = err.status;
                } else {
                    res.statusCode = 500;
                }
                console.log(err);
                res.end(String(err.message ? err.message : err) + '\r\n');
            }
        }

        if (!route) {
            res.statusCode = 404;
            res.setHeader('content-type', 'text/plain');
            res.write('host not found\r\n');
            return res.end();
        }

        if (typeof route === 'string') {
            route = { handler: route };
        }

        if (route.pathRoutes) {
            for (var r in route.pathRoutes) {
                if (route.pathRoutes[r].glob && minimatch(reqUrl.pathname, route.pathRoutes[r].glob)) {
                    route = mergeRoute(route, route.pathRoutes[r]);
                    break;
                }
            }
        }

        if (!route.handler) {
            return onerror("No handler found");
        }

        var u = url.parse(route.handler);
        if (u.protocol == 'http:' || u.protocol == 'https:') {
            handleBounce();
        } else if (u.protocol == 'fastcgi:') {
            handleFastCGI();
        } else if (route.handler == 'static') {
            handleStatic();
        } else {
            onerror("No handler found");
        }

        function handleBounce() {
            var b = bounce(u.hostname, u.port ? u.port : u.protocol == 'https' ? 443 : 80);
            b.on('error', onerror);
        }

        function handleFastCGI() {
            fcgi.connect(u.path ? { path: u.path } : {host: u.hostname, port: u.port }, function(err, f) {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('content-type', 'text/plain');
                    return res.end('Connection failed\r\n');
                }

                f.handle(req, res, {
                    env: {
                        SCRIPT_FILENAME: path.resolve(route.root + reqUrl.pathname),
                        DOCUMENT_ROOT: route.root
                    }
                });
            });
        }

        function handleStatic() {
            if (!statics[route.root]) {
                statics[route.root] = new Static.Server(route.root);
            }

            statics[route.root].serve(req, res, onerror);
        }

        function mergeRoute(route, n) {
            route = Object.create(route);
            for (var i in n) {
                if (i == 'use') {
                    route.handler = handlers[n.use];
                } else {
                    route[i] = n[i];
                }
            }

            return route;
        }
    });
};
