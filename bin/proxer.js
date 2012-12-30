#!/usr/bin/env node
var configFile = process.argv[2];

if (!configFile) {
    console.error('Usage: proxer [routes.json]');
    process.exit(1);
}

var fs = require('fs');
var config = JSON.parse(fs.readFileSync(configFile));

var proxer = require('../');

var server = proxer(config.routes, config.handlers).listen(config.port);
