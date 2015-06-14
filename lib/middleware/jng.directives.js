/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Add directives to jangular
 */
var _           = require('lodash');
var jangular    = require('jangular');

/**
 * Attempt to "isolate" the scope (as long as the scope exists). We don't actually
 * isolate the scope because right now Jangular is in charge of handling that. We
 * just want to make sure the model has the values identified in the partial.scope.
 * In the future when we refactor Jangular, we should be more explicity about truly
 * isolating scope (i.e. removing all model values not in the scope).
 *
 * @param model
 * @param scope
 * @param attrs
 */
function isolateScope(model, scope, attrs) {
    model = model || {};
    var me = this;

    if (!scope) { return; }

    // if scope exists, we isolate it
    _.each(scope, function (type, name) {
        var attrName = me.pancakes.utils.splitCamelCase(name).join('-');
        var value = attrs[attrName];

        if (type === '=') {
            model[name] = me.pancakes.utils.getNestedValue(model, value);
        }
        else if (type === '@') {
            model[name] = value;
        }
    });
}

/**
 * Make sure the remodelOnScopeChange and rerenderOnScopeChange values are
 * all from the isolated scope definition. In other words, are values that
 * come from the parent scope.
 *
 * @param partial
 * @param partialName
 */
function checkOnScopeChangeVals(partial, partialName) {
    var remodelOnScopeChange = partial.remodelOnScopeChange || (partial.remodel && partial.remodel.onScopeChange);
    var rerenderOnScopeChange = partial.rerenderOnScopeChange || (partial.rerender && partial.rerender.onScopeChange);
    var scope = partial.scope || {};

    _.each(remodelOnScopeChange, function (scopeVal) {
        var idx = scopeVal.indexOf('.');
        var val = idx > 0 ? scopeVal.substring(0, idx) : scopeVal;
        if (!scope[val]) {
            throw new Error(partialName + ' remodelOnScope value \'' + scopeVal + '\' is not defined in the scope definition.');
        }
    });

    _.each(rerenderOnScopeChange, function (scopeVal) {
        var idx = scopeVal.indexOf('.');
        var val = idx > 0 ? scopeVal.substring(0, idx) : scopeVal;
        if (!scope[val]) {
            throw new Error(partialName + ' rerenderOnScopeChange value \'' + scopeVal + '\' is not defined in the scope definition.');
        }
    });
}

/**
 * Take value returned from model() and apply it to the current scope
 * @param updates
 * @param scopeDefinition
 * @param currentScope
 * @param partialName
 * @param updatesName
 */
function updateScope(updates, scopeDefinition, currentScope, partialName, updatesName) {
    scopeDefinition = scopeDefinition || {};

    // if no updates, that is an issue
    if (!updates) {
        throw new Error(partialName + ' model() does not return a value');
    }

    // we don't do anything with a partial promise on the server side
    if (updates.toString() !== '[object Promise]') {
        if (updatesName) {
            currentScope[updatesName] = updates;
        }
        else {

            // we are loading each of the update values into the current scope
            _.each(updates, function (updateVal, updateName) {

                // if an update name is on the scope definition, throw error since it is from the parent scope
                if (scopeDefinition[updateName]) {
                    throw new Error(partialName + ' model() returns a value ' + updateName + ' that is from the parent scope.');
                }

                currentScope[updateName] = updateVal;
            });
        }
    }
}

/**
 * Modify a model according to a partial's model() function
 * @param currentScope
 * @param scopeDefinition
 * @param partialModel
 * @param partialName
 */
function evalModel(currentScope, scopeDefinition, partialModel, partialName) {
    if (!partialModel) { return; }

    var opts = { dependencies: { currentScope: currentScope }};
    var me = this;

    // if its a function, then its our injection point
    if (_.isFunction(partialModel)) {
        updateScope(this.pancakes.cook(partialModel, opts), scopeDefinition, currentScope, partialName);
    }
    // else if its an object, we want to loop through the object values
    else if (_.isObject(partialModel)) {
        _.each(partialModel, function (partialModelVal, partialModelName) {

            // if the name is in the scope definition, throw error because it means we are trying to modify a parent scope value in the model
            if (scopeDefinition[partialModelName]) {
                throw new Error(partialName + 'mode() value ' + partialModelName + ' is from the parent scope and should not be modified in the mode().');
            }

            // any function in the object is an injection point
            if (_.isFunction(partialModelVal)) {
                updateScope(me.pancakes.cook(partialModelVal, opts), scopeDefinition, currentScope, partialName, partialModelName);
            }
            // else just set the value on the scope
            else {
                currentScope[partialModelName] = partialModelVal;
            }
        });
    }
    else {
        throw new Error(partialName + ' invalid model() format');
    }
}

/**
 * Get all subviews
 * @param subviewFlapjacks
 */
function getSubviews(subviewFlapjacks) {
    var renderedSubviews = {};
    var jangularDeps = this.getJangularDeps();
    var me = this;

    _.each(subviewFlapjacks, function (subview, subviewName) {
        renderedSubviews[subviewName] = me.pancakes.cook(subview, { dependencies: jangularDeps });
    });

    return renderedSubviews;
}

/**
 * Get a function to help render a partial
 * @param partial
 * @param partialName
 * @returns {Function}
 */
function getPartialRenderFn(partial, partialName) {
    var jangularDeps = this.getJangularDeps();
    var me = this;

    return function renderPartial(model, elem, attrs) {
        me.isolateScope(model, partial.scope, attrs);

        // throw error if onScopeChange values not in the scope {} definition
        me.checkOnScopeChangeVals(partial, partialName);

        // set defaults before the modify model
        me.setDefaults(model, partial.defaults, partial.scope);

        // set the presets if they exist
        me.applyPresets(model, partial.defaults, partial.presets);

        // if model is injection function, just use that
        me.evalModel(model, partial.scope, partial.model, partialName);

        // this is similar to both jng.pages renderPage()
        // as well as ng.uipart.template (for client side pages and partials)
        me.attachToScope(model, partial.attachToScope);

        // generate the partial view
        var dependencies = _.extend({ subviews: me.getSubviews(partial.subviews) }, jangularDeps);
        return me.pancakes.cook(partial.view, { dependencies: dependencies });
    };
}

/**
 * Get component based directives (i.e. partials)
 * @param appName
 * @param componentPrefix
 */
function getComponentDirectives(appName, componentPrefix) {
    componentPrefix = (componentPrefix || 'pc') + '-';
    var directives = {};
    var me = this;

    _.each(this.getAppFileNames(appName, 'partials'), function (partialName) {

        // if not a JavaScript file, ignore it
        if (!me.pancakes.utils.isJavaScript(partialName)) { return; }

        // get the right partial name and partial
        var partial = me.pancakes.cook('app/' + appName + '/partials/' + partialName);

        // don't include if no view, is client only or is an abstract view
        if ((!partial.view && !partial.subviews && !partial.parent) ||
            partial.clientOnly || partial.abstract) { return; }

        // set the directive map values that will be used by jangular to render
        var directiveName = componentPrefix +
            partialName.substring(0, partialName.length - 11).replace(/\./g, '-');

        directives[directiveName] = me.getPartialRenderFn(partial, partialName);
    });

    return directives;
}

/**
 * Add behavior directives from the jng.directives folder.
 * @param appName
 */
function getBehavioralDirectives(appName) {
    var directives = {};
    var me = this;

    _.each(this.getAppFileNames(appName, 'jng.directives'), function (directiveName) {

        // if not a JavaScript file, ignore it
        if (!me.pancakes.utils.isJavaScript(directiveName)) { return; }

        // get the directive and load it into the directive map
        var directivePath = 'app/' + appName + '/jng.directives/' + directiveName;
        var directive = me.pancakes.cook(directivePath, null);
        directiveName = directiveName.substring(0, directiveName.length - 3).replace('.', '-');
        directives[directiveName] = directive;
    });

    return directives;
}

/**
 * Get a generic directive
 * @param prefix
 * @param attrName
 * @param filterType
 * @param isBind
 * @param isFilter
 * @returns {Function}
 */
function getGenericDirective(prefix, attrName, filterType, isBind, isFilter) {
    var directiveName = prefix + attrName.substring(0, 1).toUpperCase() + attrName.substring(1);
    var config = this.pancakes.cook('config', null);
    var i18n = this.pancakes.cook('i18n', null);
    var eventBus = this.pancakes.cook('eventBus', null);
    var me = this;

    return function (scope, element, attrs) {
        var originalValue = attrs[directiveName];
        var boundValue = isBind ? me.getNestedValue(scope, originalValue) : originalValue;
        var value = boundValue;
        var useSSL, staticFileRoot, status;

        // if we are using a file filter, add the static file root
        if (isFilter && filterType === 'file' && config && config.staticFiles) {
            useSSL = (config[scope.appName] && config[scope.appName].useSSL !== undefined) ?
                config[scope.appName].useSSL : config.useSSL;
            staticFileRoot = config.staticFiles.assets;
            staticFileRoot = (staticFileRoot.charAt(0) === '/') ? staticFileRoot :
                ((useSSL ? 'https://' : 'http://') + config.staticFiles.assets + '/');
            value = staticFileRoot + value;
        }
        // else for i18n filter, try to translate
        else if (isFilter && filterType === 'i18n' && i18n && i18n.translate) {
            status = {};
            value = i18n.translate(value, scope, status);

            // this is only done when we are in i18nDebug mode which is used to figure out
            // where we have missing translations
            if (status.missing) {
                eventBus.emit('i18n.missing', {
                    lang:       status.lang,
                    text:       boundValue,
                    appName:    scope.appName,
                    binding:    originalValue,
                    directive:  directiveName,
                    context:    JSON.stringify(element)
                });
            }
        }

        attrName === 'text' ?
            element.text(value) :
            attrName === 'class' ?
                attrs.$addClass(value) :
                attrs.$set(attrName, value, scope);
    };
}

/**
 * Add generic directives. This functionality should match up to the generic.directives.js
 * client side code.
 */
function getGenericDirectives() {
    var directives = {};
    var genericDirectives = {
        'src':          'file',
        'title':        'i18n',
        'placeholder':  'i18n',
        'popover':      'i18n',
        'value':        'i18n',
        'alt':          'i18n',
        'text':         'i18n',
        'id':           null,
        'type':         null,
        'class':        null
    };
    var me = this;

    _.each(genericDirectives, function (type, attr) {

        // no b-class because it is just adding classes one time
        if (attr !== 'class') {
            directives['b-' + attr] = me.getGenericDirective('b', attr, null, true, false);
        }

        directives['bo-' + attr] = me.getGenericDirective('bo', attr, null, true, false);

        if (type) {
            directives['f-' + attr] = me.getGenericDirective('f', attr, type, false, true);
            directives['fo-' + attr] = me.getGenericDirective('fo', attr, type, false, true);
            directives['bf-' + attr] = me.getGenericDirective('bf', attr, type, true, true);
            directives['bfo-' + attr] = me.getGenericDirective('bfo', attr, type, true, true);
        }
    });

    return directives;
}

/**
 * Add directives to jangular
 * @param directives
 */
function addDirectivesToJangular(directives) {
    _.each(directives, function (directive, directiveName) {
        jangular.addDirective(directiveName, directive);
    });
}

/**
 * Load all directives into jangular so when we render a page, jangular can render
 * all the other directives on the page. There are three types of directives:
 *      1) compontents (i.e. partials)
 *      2) jng directives (behavioral directives that render on the server)
 *      3) generic directives (i.e. f-, b-, bf-, bo-, bfo-)
 *
 * @param opts
 */
function initDirectives(opts) {
    var directives = {};
    var appNames = Object.keys(this.pancakes.cook('appConfigs', null));
    var me = this;

    _.each(appNames, function (appName) {
        _.extend(directives, me.getComponentDirectives(appName, opts.componentPrefix));
        _.extend(directives, me.getBehavioralDirectives(appName));
    });

    // this is stuff like f-placeholder, bf-src, etc.
    _.extend(directives, this.getGenericDirectives());

    // add our custom directives to jangular
    this.addDirectivesToJangular(directives);
}

// expose functions
module.exports = {
    initDirectives: initDirectives,
    getComponentDirectives: getComponentDirectives,
    getBehavioralDirectives: getBehavioralDirectives,
    getGenericDirective: getGenericDirective,
    getGenericDirectives: getGenericDirectives,
    addDirectivesToJangular: addDirectivesToJangular,
    getPartialRenderFn: getPartialRenderFn,
    isolateScope: isolateScope,
    checkOnScopeChangeVals: checkOnScopeChangeVals,
    evalModel: evalModel,
    getSubviews: getSubviews
};
