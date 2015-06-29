/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This will translate a pancake page or partial into the angular client
 * equivalent. The final output will contain a contro
 */
var _           = require('lodash');
var jangular    = require('jangular');
var path        = require('path');
var delim       = path.normalize('/');

/**
 * Transform a given page or partial module into its various parts. A page/partial is
 * potentially made up of many components: the template, initial model/partial model,
 * client controller, validations, etc.
 *
 * @param flapjack
 * @param options
 * @returns string
 */
function transform(flapjack, options) {
    var filePath    = options.filePath;
    var names       = this.parseNames(filePath, options.prefix, options.appName);
    var uipart      = this.loadUIPart(names.appShortName, filePath);

    // if there is no client side module for this ui part, return resolved
    if (!uipart.view || uipart.serverOnly || uipart.abstract) { return null; }

    // use the uipart to get the directive scope (for partials), view html and controller
    var scope = uipart.scope ? JSON.stringify(uipart.scope) : null;
    var html = this.getHtml(uipart);

    if (options.htmlOnly) {
        return html;
    }

    var ctrlTemplateModel = this.getCtrlTemplateModel(uipart, options);

    // combine all the data we have into one templateModel that will go into the template
    var templateModel = _.extend(ctrlTemplateModel, names, { directiveScope: scope, viewHtml: html });

    //TODO: refactor this; complete hack to add initialModel to sideviews
    if (names.controllerName.match(/Sideview/)) {
        templateModel.params = templateModel.params || [];
        templateModel.convertedParams = templateModel.convertedParams || [];
        templateModel.params.push('initialModel');
        templateModel.convertedParams.push('initialModel');
    }

    // return the generated code
    return this.template(templateModel);
}

/**
 * Using the file path, parse out all the names needed for the UI part template
 * @param filePath
 * @param prefix
 * @param defaultAppName
 */
function parseNames(filePath, prefix, defaultAppName) {
    var appName = this.getAppName(filePath, defaultAppName);
    var names = {
        appShortName: appName,
        appName:    this.getAppModuleName(prefix, appName),
        isPartial:  !!filePath.match(/^.*\.partial\.js/)
    };
    names.isPage = !names.isPartial;

    // name of the page used for setting the css style (ex. my.home.page.js would be my.home)
    // the class name on the maincontent in HTML would be something like gh-my-home
    var lastSlash = filePath.lastIndexOf(delim);
    names.uiPartName = filePath.substring(lastSlash + 1)
        .replace('.page.js', '')
        .replace('.partial.js', '');

    // view url is what is used as unique key in template cache for generated HTML
    names.viewUrl = 'templates/' + names.uiPartName;

    // get the directive and controller name (ex. directive ghAnswerList and controller AnswerListCtrl
    var moduleNamePascal = this.pancakes.utils.getPascalCase(filePath)
        .replace('Page', '')
        .replace('Partial', '');
    names.directiveName = prefix + moduleNamePascal;
    names.controllerName = moduleNamePascal + 'Ctrl';

    return names;
}

/**
 * This is used to convert an object from { name -> flapjack } to { name -> rendered angular string }
 * that is ready to be injected.
 *
 * @param obj
 * @param transOpts
 */
function renderObjFns(obj, transOpts) {
    if (!obj || _.isEmpty(obj)) { return null; }

    var renderedObj = {};
    var me = this;

    _.each(obj, function (val, name) {
        renderedObj[name] = _.isFunction(val) ?
            me.transformers.basic.transform(val, transOpts) :
            _.isObject(val) ?
                JSON.stringify(val) :
                val;
    });

    return renderedObj;
}

/**
 * For a given ui part, get all the appropriate values that will be
 * use by the template to generate the controller
 *
 * @param uipart
 * @param options
 */
function getCtrlTemplateModel(uipart, options) {

    var remodelOnScopeChange = uipart.remodelOnScopeChange || (uipart.remodel && uipart.remodel.onScopeChange);
    var remodelOnEvent = uipart.remodelOnEvent || (uipart.remodel && uipart.remodel.onEvent);
    var rerenderOnScopeChange = uipart.rerenderOnScopeChange || (uipart.rerender && uipart.rerender.onScopeChange);
    var rerenderOnEvent = uipart.rerenderOnEvent || (uipart.rerender && uipart.rerender.onEvent);
    var remodelWatchers = remodelOnScopeChange ? JSON.stringify(remodelOnScopeChange) : 'null';
    var remodelEvents = remodelOnEvent ? JSON.stringify(remodelOnEvent) : 'null';
    var rerenderWatchers = rerenderOnScopeChange ? JSON.stringify(rerenderOnScopeChange) : 'null';
    var rerenderEvents = rerenderOnEvent ? JSON.stringify(rerenderOnEvent) : 'null';

    var defaults = uipart.defaults ? JSON.stringify(uipart.defaults) : 'null';
    var presets = uipart.presets ? JSON.stringify(uipart.presets) : null;
    var attachToScope = uipart.attachToScope ? JSON.stringify(uipart.attachToScope) : null;
    var paramInfo = this.getFilteredParamInfo(uipart.controller, options);
    var transOpts = _.extend({ raw: true, isClient: true }, options);
    var useRemodelOnWatch = uipart.model && remodelOnScopeChange && remodelOnScopeChange.length;
    var useRemodelOnEvent = uipart.model && remodelOnEvent && remodelOnEvent.length;
    var useRerenderOnWatch = uipart.model && rerenderOnScopeChange && rerenderOnScopeChange.length;
    var useRerenderOnEvent = uipart.model && rerenderOnEvent && rerenderOnEvent.length;
    var remodelFnExists = uipart.model && _.isFunction(uipart.model);
    var remodelObjExists = !remodelFnExists && uipart.model && _.isObject(uipart.model);
    var clientLoadExists = uipart.onClientLoad && _.isFunction(uipart.onClientLoad);

    return {
        params:             paramInfo.list,
        convertedParams:    paramInfo.converted,
        ngrefs:             paramInfo.ngrefs,
        defaults:           defaults,
        presets:            presets,
        attachToScope:      attachToScope,
        rerenderExists:     useRerenderOnEvent || useRemodelOnWatch,
        remodelFnExists:    remodelFnExists,
        remodelFn:          remodelFnExists && this.transformers.basic.transform(uipart.model, transOpts),
        remodelObjExists:   remodelObjExists,
        remodelObj:         remodelObjExists && this.renderObjFns(uipart.model, transOpts),
        clientLoadExists:   clientLoadExists,
        clientLoadFn:       clientLoadExists && this.transformers.basic.transform(uipart.onClientLoad, transOpts),
        remodelWatchers:    remodelWatchers,
        remodelEvents:      remodelEvents,
        rerenderWatchers:   rerenderWatchers,
        rerenderEvents:     rerenderEvents,
        useRemodelOnWatch:  useRemodelOnWatch,
        useRemodelOnEvent:  useRemodelOnEvent,
        useRerenderOnWatch: useRerenderOnWatch,
        useRerenderOnEvent: useRerenderOnEvent,
        validations:        this.renderObjFns(uipart.validations, transOpts),
        eventBusListeners:  this.renderObjFns(uipart.eventBusListeners, transOpts),
        uiEventHandlers:    this.renderObjFns(uipart.uiEventHandlers, transOpts),
        body:               this.getModuleBody(uipart.controller)
    };
}

/**
 * Get the HTML for a given ui part
 *
 * @param uipart
 * @returns {string}
 */
function getHtml(uipart) {
    var me = this;

    // if any subviews, add them as dependencies
    var deps = _.extend({ subviews: {} }, this.getJangularDeps());
    _.each(uipart.subviews, function (subview, subviewName) {
        deps.subviews[subviewName] = me.pancakes.cook(subview, { dependencies: deps });
    });

    // cook the view; the result will be jeff objects
    var view = this.pancakes.cook(uipart.view, { dependencies: deps });

    // we can now generate HTML off the jyt objects (using jyt render so angular NOT interpreted)
    var html = jangular.jytRender(view);
    html = html.replace(/\'/g, '\\\'');     // need to protect all single quotes

    return html;
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

// expose functions
module.exports = {
    transform: transform,
    parseNames: parseNames,
    renderObjFns: renderObjFns,
    getCtrlTemplateModel: getCtrlTemplateModel,
    getHtml: getHtml,
    getJangularDeps: getJangularDeps
};

// debug comments not being used right now
//    addDebugComments: function addDebugComments(html, filePath) {
//        var idx = filePath.indexOf('/app/');
//        var debugPath = filePath.substring(idx + 4);
//
//        html = html.replace('>', '><!-- ghstart: ' + debugPath + ' -->');
//        html = html.replace(/<([^<]*)$/, '<!-- ghend: ' + debugPath + ' --><$1');
//
//        return html;
//    },

