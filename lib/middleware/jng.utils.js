/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Simple functions used by multiple other middleware modules (i.e. pages and directives)
 */
var _           = require('lodash');
var fs          = require('fs');
var path        = require('path');
var jangular    = require('jangular');
var delim       = path.normalize('/');

/**
 * Only set default value if value not in the scope definition
 * or it doesn't exist in the model yet
 *
 * @param model
 * @param defaults
 * @param scopeDefinition
 */
function setDefaults(model, defaults, scopeDefinition) {
    scopeDefinition = scopeDefinition || {};
    if (!defaults) { return; }

    _.each(defaults, function (value, key) {
        if (scopeDefinition[key] === undefined || model[key] === undefined) {
            model[key] = value;
        }
    });
}

/**
 * Set options if they exist. Only can override defaults, though, so
 * if no defaults value, then error thrown.
 * This matches tpl.helper.applyPresets()
 *
 * @param model
 * @param defaults
 * @param presets
 */
function applyPresets(model, defaults, presets) {
    if (!model || !presets) { return; }

    var opts = model.presets || presets[model.preset] ||
        (model.preset && presets[model.type + '.' + model.preset]) || presets[model.type];
    if (!opts) { return; }

    for (var name in opts) {
        if (opts.hasOwnProperty(name)) {
            if (!defaults || defaults[name] === undefined) {
                throw new Error('No defaults value for ' + name + ' but in presets.' + model.preset);
            }
            else {
                model[name] = opts[name];
            }
        }
    }
}

/**
 * Get a value within given data by traversing the data according to a
 * dot deliminated field. For example, if the data is { foo: { choo: 'some' } }
 * and then the field is foo.choo, the return value would be 'some'.
 *
 * @param data
 * @param field
 * @param defaultValue
 */
function getNestedValue(data, field, defaultValue) {
    if (!data || !field) { return defaultValue; }

    var pntr = data;
    var fieldParts = field.split('.');

    var i, fieldPart;
    for (i = 0; i < fieldParts.length; i++) {
        fieldPart = fieldParts[i];
        pntr = pntr[fieldPart];
        if (!pntr) { return pntr; }
    }

    return pntr || defaultValue;
}

/**
 * Given an array of items, load them and add them to the model
 * @param model
 * @param itemsToAttach
 */
function attachToScope(model, itemsToAttach) {
    var me = this;

    _.each(itemsToAttach, function (item) {
        if (me.pancakes.exists(item, null)) {
            model[item] = me.pancakes.cook(item, null);
        }
    });
}

/**
 * Get all file names in a given app's directory
 * @param appName
 * @param dir
 * @returns {*}
 */
function getAppFileNames(appName, dir) {
    var partialsDir = this.pancakes.getRootDir() + delim + 'app' + delim + appName + delim + dir;
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
 * Convert a name with dot delim to camel case and remove any .js
 * @param name
 */
function dotToCamelCase(name) {
    if (!name) { return name; }

    if (name.substring(name.length - 3) === '.js') {
        name = name.substring(0, name.length - 3);
    }

    name = name.toLowerCase();
    var parts = name.split('.');

    name = parts[0];
    for (var i = 1; i < parts.length; i++) {
        name += parts[i].substring(0, 1).toUpperCase() + parts[i].substring(1);
    }

    return name;
}

/**
 * Register plugins from the jyt.plugins dir
 */
function registerJytPlugins() {
    var rootDir = this.pancakes.getRootDir();
    var pluginDir = rootDir + delim + 'jyt.plugins';
    var me = this;

    // if plugin dir doesn't exist, just return
    if (!fs.existsSync(pluginDir)) { return;  }

    // else get all plugin files from the jyt.plugins dir
    var pluginFiles = fs.readdirSync(pluginDir);
    var deps = { dependencies: me.getJangularDeps() };
    _.each(pluginFiles, function (pluginFile) {
        var name = me.dotToCamelCase(pluginFile);
        var pluginFlapjack = me.pancakes.requireModule(pluginDir + delim + pluginFile);
        var plugin = me.pancakes.cook(pluginFlapjack, deps);
        jangular.registerPlugin(name, plugin);
        me.jangularDeps[name] = plugin;
    });
}

// expose functions
module.exports = {
    setDefaults: setDefaults,
    applyPresets: applyPresets,
    attachToScope: attachToScope,
    getAppFileNames: getAppFileNames,
    getJangularDeps: getJangularDeps,
    dotToCamelCase: dotToCamelCase,
    registerJytPlugins: registerJytPlugins,
    getNestedValue: getNestedValue
};