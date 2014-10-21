/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Simple functions used by multiple other middleware modules (i.e. pages and directives)
 */
var _           = require('lodash');
var fs          = require('fs');
var jangular    = require('jeff-jangular');
var pancakes    = require('pancakes');

// add jangular functions to an object that can be injected as dependencies
var jangularDeps = {};
jangular.addShortcutsToScope(jangularDeps);

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
    _.each(itemsToAttach, function (item) {
        model[item] = pancakes.cook(item, null);
    });
}

/**
 * Get all file names in a given app's directory
 * @param appName
 * @param dir
 * @returns {*}
 */
function getAppFileNames(appName, dir) {
    var partialsDir = pancakes.getRootDir() + '/' + appName + '/' + dir;
    return fs.existsSync(partialsDir) ? fs.readdirSync(partialsDir) : [];
}

// expose functions
module.exports = {
    setDefaults: setDefaults,
    attachToScope: attachToScope,
    getAppFileNames: getAppFileNames,
    deps: jangularDeps
};