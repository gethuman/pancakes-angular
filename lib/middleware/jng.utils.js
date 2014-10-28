/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Simple functions used by multiple other middleware modules (i.e. pages and directives)
 */
var _           = require('lodash');
var fs          = require('fs');
var jangular    = require('jangular');

/**
 * If a default value doesn't exist in the model, set it
 * @param model
 * @param defaults
 */
function setDefaults(model, defaults) {
    if (!defaults) { return; }

    _.each(defaults, function (value, key) {
        if (model[key] === undefined) {
            model[key] = value;
        }
    });
}

/**
 * Given an array of items, load them and add them to the model
 * @param model
 * @param itemsToAttach
 */
function attachToScope(model, itemsToAttach) {
    var me = this;

    _.each(itemsToAttach, function (item) {
        model[item] = me.pancakes.cook(item, null);
    });
}

/**
 * Get all file names in a given app's directory
 * @param appName
 * @param dir
 * @returns {*}
 */
function getAppFileNames(appName, dir) {
    var partialsDir = this.pancakes.getRootDir() + '/app/' + appName + '/' + dir;
    return fs.existsSync(partialsDir) ? fs.readdirSync(partialsDir) : [];
}

/**
 * Get all Jangular dependencies (i.e. all html functions)
 * @returns {{}|*}
 */
function getJangularDeps() {
    if (this.jangularDeps) { return this.jangularDeps; }

    // add jangular functions to an object that can be injected as dependencies
    this.jangularDeps = {};
    jangular.addShortcutsToScope(this.jangularDeps);
    return this.jangularDeps;
}

/**
 * Register Jyt plugins
 * @param plugins
 */
function initPlugins(plugins) {
    _.each(plugins, function (plugin, name) {
        jangular.registerPlugin(name, plugin);
    });
}

// expose functions
module.exports = {
    setDefaults: setDefaults,
    attachToScope: attachToScope,
    getAppFileNames: getAppFileNames,
    getJangularDeps: getJangularDeps,
    initPlugins: initPlugins
};