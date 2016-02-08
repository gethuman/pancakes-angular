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
    options = options || {};

    var filePath = options.filePath;
    var config = options.config || {};
    var appName = this.getAppName(filePath, options.appName);
    var appInfo = this.pancakes.cook(options.moduleName, { flapjack: flapjack });
    var routes = appInfo.routes || [];
    var resolveHandlers = this.getResolveHandlers(appName, routes, options);
    var me = this;

    routes = routes.filter(function (route) {
        if (!route.name) {
            return false;
        }

        var uiPart = me.getUIPart(appName, route);
        return !uiPart.serverOnly;
    });

    return this.template({
        appName:            appName,
        sideview:           '',
        moduleName:         this.getAppModuleName(options.prefix, appName),
        auth:               (config && config.security && config.security.auth) || {},
        routes:             JSON.stringify(routes),
        resolveHandlers:    resolveHandlers,
        isMobile:           appInfo.isMobile ? 'true' : 'false'
    });
}

/**
 * Get resolve handlers for all the given routes
 * @param appName
 * @param routes
 * @param options
 */
function getResolveHandlers(appName, routes, options) {
    var resolveHandlers = {};
    var me = this;

    _.each(routes, function (route) {

        // if no route name, don't do anything
        if (!route.name) { return; }

        // else generate the UI part based on the name
        var uipart = me.getUIPart(appName, route);

        // if there is no model return without doing anything
        if (!uipart.model) { return; }

        var transOpts = _.extend({
            raw: true,
            defaults: uipart.defaults,
            isClient: true
        }, options);

        // else we want to generate the initial model module
        resolveHandlers[route.name] = _.isFunction(uipart.model) ?
            me.transformers.basic.transform(uipart.model, transOpts) :
            JSON.stringify(uipart.model);
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
