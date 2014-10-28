/**
 * Author: Jeff Whelpley
 * Date: 10/15/14
 *
 * This will be the main interface for the Angular plugin. The primary interface
 * to a client plugin is through the following values:
 *      1) transformers - array of transformer modules that is taken by pancakes to generate transformer objects
 *      2) renderPage - this plugin has this method in jngPages, but it renders a page
 */
var _               = require('lodash');
var jngDirectives   = require('./middleware/jng.directives');
var jngPages        = require('./middleware/jng.pages');
var jngFilters      = require('./middleware/jng.filters');
var jngUtils        = require('./middleware/jng.utils');
var apiTrans        = require('./transformers/ng.apiclient.transformer');
var appTrans        = require('./transformers/ng.app.transformer');
var basicTrans      = require('./transformers/ng.basic.transformer');
var routingTrans    = require('./transformers/ng.routing.transformer');
var uipartTrans     = require('./transformers/ng.uipart.transformer');

/**
 * Constructor for the pancakes angular plugin
 * @param opts
 * @constructor
 */
function PancakesAngularPlugin(opts) {
    this.templateDir    = __dirname + '/transformers';
    this.pancakes       = opts.pluginOptions.pancakes;

    // initialize Jyt plugins
    this.initPlugins(opts.jytPlugins);

    // initialize all directives and load them into memory
    this.initDirectives(opts);

    // set all the transformation functions (used by the pancakes module transformation.factory
    this.transformers = {
        apiclient:  apiTrans,
        app:        appTrans,
        basic:      basicTrans,
        routing:    routingTrans,
        uipart:     uipartTrans
    };
}

// add all the jng modules to this class (all used while executing renderPage())
_.extend(PancakesAngularPlugin.prototype, jngDirectives, jngPages, jngFilters, jngUtils);

// export the class
module.exports = PancakesAngularPlugin;

