/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This transformer handles generating all the routes and resolves for routes
 */
var _                   = require('lodash');
var path                = require('path');
var pancakes            = require('pancakes');
var basicTransformer    = require('./ng.basic.transformer');

/**
 * Constructor sets the template by calling the parent constructor
 * @constructor
 */
function ConfigTransformer() {
    pancakes.BaseTransformer.call(this, pancakes, __dirname, 'ng.config');
}

_.extend(ConfigTransformer.prototype, pancakes.BaseTransformer.prototype, {

    /**
     * Get the UI part module for a given app and route
     * @param appName
     * @param route
     * @returns {injector.require|*|require}
     */
    getUIPart: function getUIPart(appName, route) {
        var rootDir = pancakes.getRootDir();
        var filePath = path.join(rootDir, 'app', appName, 'pages', route.name + '.page.js');
        return this.loadUIPart(appName, filePath);
    },

    /**
     * Get resolve handlers for all the given routes
     * @param appName
     * @param routes
     */
    getResolveHandlers: function getResolveHandlers(appName, routes) {
        var resolveHandlers = {};
        var me = this;

        _.each(routes, function (route) {
            var uipart = me.getUIPart(appName, route);

            // if there is no model return without doing anything
            if (!uipart.model) { return; }

            // else we want to generate the initial model module
            resolveHandlers[route.name] = basicTransformer.transform(uipart.model, {
                raw: true,
                defaults: uipart.defaults
            });
        });
    },

    /**
     * Transform a given module
     * @param flapjack
     * @param options
     * @returns {Q}
     */
    transform: function transform(flapjack, options) {
        var filePath = options.filePath;
        var appName = this.getAppName(filePath, options.ngPrefix);
        var appInfo = pancakes.cook(options.moduleName, { flapjack: flapjack });
        var routes = JSON.stringify(appInfo.routes) || '[]';
        var resolveHandlers = this.getResolveHandlers(appName, appInfo.routes);

        return this.template({
            appName: appName,
            routes: routes,
            resolveHandlers: resolveHandlers
        });
    }
});

// return a singleton instance of this transformer
module.exports =  new ConfigTransformer();