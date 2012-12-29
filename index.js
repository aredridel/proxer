var bouncy = require('bouncy');
var fcgi = require('fcgi');
var url = require('url');
var path = require('path');

module.exports = function createProxerServer(routes) {
    return bouncy(function (req, res, bounce) {
        var host = (req.headers.host || '').replace(/:\d+$/, '');
        var route = routes[host] || routes['*'];
        
        if (Array.isArray(route)) {
            // jump to a random route on arrays
            route = route[Math.floor(Math.random() * route.length)];
        }
        
        req.on('error', onerror);
        function onerror (err) {
            res.statusCode = 500;
            res.setHeader('content-type', 'text/plain');
            res.end(String(err) + '\r\n');
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

        var u = url.parse(route.handler);
        if (u.protocol == 'http:' || u.protocol == 'https:') {
            var b = bounce(u.hostname, u.port ? u.port : u.protocol == 'https' ? 443 : 80);
            b.on('error', onerror);
        } else if (u.protocol == 'fastcgi:') {
            fcgi.connect(u.path ? { path: u.path, root: __dirname + '/..' } : {host: u.hostname, port: u.port , root: __dirname + '/..'}, function(err, f) {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('content-type', 'text/plain');
                    return res.end('Connection failed\r\n');
                }

                var reqUrl = url.parse(req.url);

                f.handle(req, res, {
                    env: {
                        SCRIPT_FILENAME: path.resolve(route.root + reqUrl.pathname),
                        DOCUMENT_ROOT: route.root
                    }
                });
            });
        }
    });
};
