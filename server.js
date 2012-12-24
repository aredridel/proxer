#!/usr/bin/env node
var configFile = process.argv[2];
var port = parseInt(process.argv[3], 10);

if (!configFile || !port) {
    console.error('Usage: server [routes.json] [port]');
    process.exit(1);
}

var fs = require('fs');
var config = JSON.parse(fs.readFileSync(configFile));

var bouncy = require('bouncy');
var url = require('url');
var server = bouncy(function (req, res, bounce) {
    var host = (req.headers.host || '').replace(/:\d+$/, '');
    var route = config[host] || config[''];
    
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
    
    if (typeof route === 'string') {
        var u = url.parse(route);
        if (u.protocol == 'http:' || u.protocol == 'https:') {
            var b = bounce(u.hostname, u.port ? u.port : u.protocol == 'https' ? 443 : 80);
            b.on('error', onerror);
        } else if (u.protocol == 'fastcgi:') {
        }
    } else {
        res.statusCode = 404;
        res.setHeader('content-type', 'text/plain');
        res.write('host not found\r\n');
        res.end();
    }
});
server.listen(port);
