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
 * strigified property accessor. For example, if the obj is { foo: { choo: 'some' } }
 * and then the path is foo.choo, the return value would be 'some'.
 *
 * @param data
 * @param field
 * @param defaultValue
 *
 * BASIC CASES:
 * foo
 * foo.bar
 * foo['bar']
 * foo["bar"]
 * foo[bar]
 *
 * COMPLEX:
 * foo[bar][zam]
 * foo[bar[zam]]
 * foo.bar[zam]
 * foo[bar.zam]
 * foo[bar].zam
 * foo[bar.bam][zam]
 * foo[bar[zam].wah]
 * foo.bar[zam].wah
 * foo[bar.zam]
 * foo[bar].zam
 */
var jsPropNameRegexStr = '([a-zA-Z\$_][a-zA-Z\$_0-9]*)';
var jsPropName = new RegExp('^' + jsPropNameRegexStr + ''); // ^ at the start ensures we only chew next characters
var jsPropNameQuoted = new RegExp('^[\'"]' + jsPropNameRegexStr + '[\'"]$');

function getPropnameAndRemains(filePath) {
    var matches = filePath.match(jsPropName);
    if (!(matches && matches.length)) {
        throw new Error('Did not match propname: ' + filePath);
    }
    else {
        var propName = matches[0];
        return [propName, filePath.substring(propName.length)];
    }
}

function getClosingBracket(filePath) {  // sigh... scan for matching, closing bracket, assuming opening one has been removed
    for (var i = 0, depth = 0, len = filePath.length; i < len; i++) {
        var char = filePath.charAt(i);
        if (char === ']') {
            if (depth) {
                depth--;
            }
            else {
                return i;
            }
        }
        else if (char === '[') {
            depth++;
        }
    }
    throw new Error('Could not find closing bracket: ' + filePath);
}

function getNestedValue(originalObj, originalPath, defaultValue) {

    /*
    // this is sort of what i'm going for here
    lex:
        PROPNAME: /^([a-zA-Z\$_][a-zA-Z\$_0-9]*)/
        QUOTE: '
        QUOTES: "
        DOT: .
        BOPEN: [
        BCLOSE: ]
    bnf:
        PATH:
            (empty)
            PROPNAME
            PROPNAME SUBREFCHAIN

        SUBREFCHAIN:
            SUBREF
            SUBREF SUBREF

        SUBREF:
            DOT PROPNAME
            BOPEN INNERPATH BCLOSE

        INNERPATH:
            PATH
            QUOTE PROPNAME QUOTE
            QUOTES PROPNAME QUOTES
     */

    function chewInnerPath(filePath) {
        var matches = filePath.match(jsPropNameQuoted);
        if (matches) {            // QUOTE/QUOTES PROPNAME QUOTE/QUOTES
            return matches[1]; // the first includes the quotes
        }
        else {                    // PATH
            return chewPath(originalObj, filePath);
        }
    }

    function chewSubref(filePath) {
        var firstLetter = filePath.charAt(0);
        if (firstLetter === '.') {        // DOT PROPNAME
            return getPropnameAndRemains(filePath.substring(1));
        }
        else if (firstLetter === '[') { // BOPEN INNERPATH BCLOSE
            filePath = filePath.substring(1);
            var idxClose = getClosingBracket(filePath);
            return [chewInnerPath(filePath.substring(0, idxClose)), filePath.substring(idxClose + 1)];
        }
        else {
            throw new Error('Bad subref: ' + filePath);
        }
    }

    function chewSubrefs(filePath) { // should return a propname
        var snr = chewSubref(filePath);
        if (snr[1]) {         // SUBREF SUBREF
            return [snr[0]].concat(chewSubrefs(snr[1]));
        }
        else if (snr[0]) {                // SUBREF
            return [snr[0]];
        }
        else {
            throw new Error('Bad subrefchain: ' + filePath);
        }
    }

    function chewPath(obj, filePath) {
        if (!(filePath && filePath.length)) {  // EMPTY
            return obj;
        }
        var pnr = getPropnameAndRemains(filePath);
        var ret = obj[pnr[0]];
        if (pnr[1]) { // PROPNAME SUBREFCHAIN
            var subrefs = chewSubrefs(pnr[1]);
            return subrefs.reduce(function (o, sref) { // .reduce function could be replaced w homegrown version if needed
                return o[sref];
            }, ret);
        }
        else {
            return ret; // PROPNAME
        }
    }

    var value = chewPath(originalObj, originalPath);
    if (value === undefined || value === null) {
        return defaultValue;
    }
    else {
        return value;
    }
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
    var pluginDir = path.normalize(rootDir + '/app/common/jyt.plugins');
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

/**
 * Find out if there is a mobile app in the current project
 * @returns {boolean}
 */
function isMobileApp() {
    var isMobile = false;
    var appConfigs = this.pancakes.cook('appConfigs', null);

    _.each(appConfigs, function (appConfig) {
        if (appConfig.isMobile) {
            isMobile = true;
        }
    });

    return isMobile;
}

/**
 * Register element names for Ionic
 */
function registerMobileComponents() {
    jangular.registerComponents([
        'ion-action-sheet', 'ion-checkbox', 'ion-content',
        'ion-header-bar', 'ion-footer-bar', 'ion-infinite-scroll', 'ion-item', 'ion-delete-dutton',
        'ion-option-button', 'ion-reorder-button',
        'ion-list', 'ion-modal', 'ion-modal-view', 'ion-nav-back-button',
        'ion-nav-bar', 'ion-nav-buttons', 'ion-nav-title',
        'ion-nav-view', 'ion-pane', 'ion-popover', 'ion-popover-view', 'ion-radio',
        'ion-refresher', 'ion-scroll', 'ion-side-menu', 'ion-side-menu-content', 'ion-side-menus',
        'ion-slide-box', 'ion-slide', 'ion-spinner', 'ion-tabs', 'ion-toggle', 'ion-view'
    ]);
}

// true/false if we know a file exists or not
var fileExistsCache = {};

/**
 * Check to see if a particular file exists; cache results
 * @param filePath
 * @returns {*}
 */
function doesFileExist(filePath) {
    if (!fileExistsCache.hasOwnProperty(filePath)) {
        fileExistsCache[filePath] = fs.existsSync(filePath);
    }

    return fileExistsCache[filePath];
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
    getNestedValue: getNestedValue,
    isMobileApp: isMobileApp,
    registerMobileComponents: registerMobileComponents,
    doesFileExist: doesFileExist
};