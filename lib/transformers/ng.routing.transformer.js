/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This transformer handles generating all the routes and resolves for routes
 */
var _       = require('lodash');
var path    = require('path');

/**
 * Transform a given module
 * @param flapjack
 * @param options
 * @returns {Q}
 */
function transform(flapjack, options) {
    var filePath = options.filePath;
    var appName = options.appName || this.getAppName(filePath);
    var appInfo = this.pancakes.cook(options.moduleName, { flapjack: flapjack });
    var routes = JSON.stringify(appInfo.routes || []);
    var resolveHandlers = this.getResolveHandlers(appName, appInfo.routes);

    return this.template({
        appName: this.getAppModuleName(options.ngPrefix, appName),
        routes: routes,
        resolveHandlers: resolveHandlers
    });
}

/**
 * Get resolve handlers for all the given routes
 * @param appName
 * @param routes
 */
function getResolveHandlers(appName, routes) {
    var resolveHandlers = {};
    var me = this;

    _.each(routes, function (route) {
        var uipart = me.getUIPart(appName, route);

        // if there is no model return without doing anything
        if (!uipart.model) { return; }

        // else we want to generate the initial model module
        resolveHandlers[route.name] = me.transformers.basic.transform(uipart.model, {
            raw: true,
            defaults: uipart.defaults
        });
    });

    return resolveHandlers || {};
}

/**
 * Get the UI part module for a given app and route
 * @param appName
 * @param route
 * @returns {injector.require|*|require}
 */
function getUIPart(appName, route) {
    var rootDir = this.pancakes.getRootDir();
    var filePath = path.join(rootDir, 'app', appName, 'pages', route.name + '.page.js');
    return this.loadUIPart(appName, filePath);
}

// expose functions
module.exports = {
    transform: transform,
    getResolveHandlers: getResolveHandlers,
    getUIPart: getUIPart
};
