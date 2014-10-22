/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Add directives to jangular
 */
var _           = require('lodash');
var pancakes    = require('pancakes');
var jangular    = require('jeff-jangular');
var jngUtils    = require('./jng.utils');

/**
 * Attempt to isolate the scope (as long as the scope exists)
 * @param model
 * @param scope
 * @param attrs
 * @returns {*|{}}
 */
function isolateScope(model, scope, attrs) {
    model = model || {};

    if (!scope) { return model; }

    // if scope exists, we isolate it
    var isolatedModel = {};
    _.each(scope, function (type, name) {
        var attrName = pancakes.utils.splitCamelCase(name).join('-');
        var value = attrs[attrName];

        if (type === '=') {
            isolatedModel[name] = pancakes.utils.getNestedValue(model, value);
        }
        else if (type === '@') {
            isolatedModel[name] = value;
        }
    });

    return isolatedModel;
}

/**
 * Modify a model according to a partial's model() function
 * @param model
 * @param modelFlapjack
 */
function modifyModel(model, modelFlapjack) {
    if (!modelFlapjack) { return; }

    var modify = pancakes.cook(modelFlapjack, null);
    if (!_.isFunction(modify)) { throw Error('model in partial must return a function'); }

    modify(model);
}

/**
 * Get all subviews
 * @param subviewFlapjacks
 */
function getSubviews(subviewFlapjacks) {
    var renderedSubviews = {};

    _.each(subviewFlapjacks, function (subview, subviewName) {
        renderedSubviews[subviewName] = pancakes.cook(subview, { dependencies: jngUtils.deps });
    });

    return renderedSubviews;
}

/**
 * Get a function to help render a partial
 * @param partial
 * @returns {Function}
 */
function getPartialRenderFn(partial) {
    return function (parentModel, elem, attrs) {
        var model = isolateScope(parentModel, partial.scope, attrs);

        // modify the model accoring to the partial's model() function
        modifyModel(model, partial.model);

        // this is similar to both jng.pages renderPage()
        // as well as ng.uipart.template (for client side pages and partials)
        jngUtils.setDefaults(model, partial.defaults);
        jngUtils.attachToScope(model, partial.attachToScope);

        // generate the partial view
        var dependencies = _.extend({ subviews: getSubviews(partial.subviews) }, jngUtils.deps);
        return pancakes.cook(partial.view, { dependencies: dependencies });
    };
}

/**
 * Get a partial file
 * @param appName
 * @param partialFileName
 */
function getPartial(appName, partialFileName) {
    var rootDir = pancakes.getRootDir();
    var partialPath = rootDir + '/app/' + appName + '/partials/' + partialFileName;
    var partial = require(partialPath);
    var parent;

    // if there is a parent, we need to merge with the page
    if (partial.parent) {
        parent = require(rootDir + '/app/common/partials/' + partial.parent + '.partial');
        partial = _.merge({}, parent, partial);
        delete partial.abstract;
    }

    return partial;
}

/**
 * Get component based directives (i.e. partials)
 * @param appName
 * @param componentPrefix
 */
function getComponentDirectives(appName, componentPrefix) {
    componentPrefix = (componentPrefix || 'pc') + '-';
    var directives = {};

    _.each(jngUtils.getAppFileNames(appName, 'partials'), function (partialName) {

        // if not a JavaScript file, ignore it
        if (!pancakes.utils.isJavaScript(partialName)) { return; }

        // get the right partial name and partial
        var partial = getPartial(appName, partialName);

        // don't include if no view, is client only or is an abstract view
        if ((!partial.view && !partial.subviews && !partial.parent) ||
            partial.clientOnly || partial.abstract) { return; }

        // set the directive map values that will be used by jangular to render
        var directiveName = componentPrefix +
            partialName.substring(0, partialName.length - 11).replace(/\./g, '-');

        directives[directiveName] = getPartialRenderFn(partial);
    });

    return directives;
}

/**
 * Add behavior directives from the jng.directives folder.
 * @param appName
 */
function getBehavioralDirectives(appName) {
    var directives = {};

    _.each(jngUtils.getAppFileNames(appName, 'jng.directives'), function (directiveName) {

        // if not a JavaScript file, ignore it
        if (!pancakes.utils.isJavaScript(directiveName)) { return; }

        // get the directive and load it into the directive map
        var directivePath = 'app/' + appName + '/jng.directives/' + directiveName;
        var directive = pancakes.cook(directivePath, null);
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
 * @returns {Function}
 */
function getGenericDirective(prefix, attrName, filterType, isBind) {
    var directiveName = prefix + attrName.substring(0, 1).toUpperCase() + attrName.substring(1);
    var config = pancakes.cook('config', null);
    var i18n = pancakes.cook('i18n', null);

    return function (scope, element, attrs) {
        var originalValue = attrs[directiveName];
        var value = isBind ? scope[originalValue] : originalValue;

        // if we are using a file filter, add the static file root
        if (filterType === 'file' && config && config.staticFileRoot) {
            value = config.staticFileRoot + value;
        }
        // else for i18n filter, try to translate (only do scope if NOT bind since it does interpolation)
        else if (filterType === 'i18n' && i18n && i18n.translate) {
            value = isBind ? i18n.translate(value) : i18n.translate(value, scope);
        }

        attrName === 'text' ?
            element.text(value) :
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
        'href':         'file',
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

    _.each(genericDirectives, function (type, attr) {
        directives['b-' + attr] = getGenericDirective('b', attr, null, true);
        directives['bo-' + attr] = getGenericDirective('bo', attr, null, true);

        if (type) {
            directives['f-' + attr] = getGenericDirective('f', attr, type, false);
            directives['fo-' + attr] = getGenericDirective('fo', attr, type, false);
            directives['bf-' + attr] = getGenericDirective('bf', attr, type, true);
            directives['bfo-' + attr] = getGenericDirective('bfo', attr, type, true);
        }
    });

    return directives;
}

/**
 * Add directives to jangular
 * @param directives
 */
function addDirectivesToJangular(directives) {
    var directiveMap = {};
    for (var directiveName in directives) {
        if (directives.hasOwnProperty(directiveName)) {
            directiveMap[directiveName] = directiveName;
        }
    }

    jangular.addDirectives(directiveMap);
    jangular.init({
        getTemplate: function(path) {
            return directives[path] ? directives[path] : jangular.getTemplate(path);
        }
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
    var appNames = Object.keys(pancakes.cook('appConfigs', null));

    _.each(appNames, function (appName) {
        _.extend(directives, getComponentDirectives(appName, opts.componentPrefix));
        _.extend(directives, getBehavioralDirectives(appName));
    });

    // this is stuff like f-placeholder, bf-src, etc.
    _.extend(directives, getGenericDirectives());

    // add our custom directives to jangular
    addDirectivesToJangular(directives);
}

// expose functions
module.exports = {
    initDirectives: initDirectives,
    getComponentDirectives: getComponentDirectives,
    getBehavioralDirectives: getBehavioralDirectives,
    getGenericDirective: getGenericDirective,
    getGenericDirectives: getGenericDirectives,
    addDirectivesToJangular: addDirectivesToJangular,
    getPartial: getPartial,
    getPartialRenderFn: getPartialRenderFn,
    isolateScope: isolateScope,
    modifyModel: modifyModel,
    getSubviews: getSubviews
};
