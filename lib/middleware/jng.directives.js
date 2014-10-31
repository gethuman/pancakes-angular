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
 * Modify a model according to a partial's model() function
 * @param model
 * @param modelFlapjack
 */
function modifyModel(model, modelFlapjack) {
    if (!modelFlapjack) { return; }

    var modify = this.pancakes.cook(modelFlapjack, null);
    if (!_.isFunction(modify)) { throw Error('model in partial must return a function'); }

    modify(model);
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
 * @returns {Function}
 */
function getPartialRenderFn(partial) {
    var jangularDeps = this.getJangularDeps();
    var me = this;

    return function renderPartial(model, elem, attrs) {
        me.isolateScope(model, partial.scope, attrs);

        // set defaults before the modify model
        me.setDefaults(model, partial.defaults);

        // modify the model accoring to the partial's model() function
        me.modifyModel(model, partial.model);

        // this is similar to both jng.pages renderPage()
        // as well as ng.uipart.template (for client side pages and partials)
        me.attachToScope(model, partial.attachToScope);

        // generate the partial view
        var dependencies = _.extend({ subviews: me.getSubviews(partial.subviews) }, jangularDeps);
        return me.pancakes.cook(partial.view, { dependencies: dependencies });
    };
}

/**
 * Get a partial file
 * @param appName
 * @param partialFileName
 */
function getPartial(appName, partialFileName) {
    var rootDir = this.pancakes.getRootDir();
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
    var me = this;

    _.each(this.getAppFileNames(appName, 'partials'), function (partialName) {

        // if not a JavaScript file, ignore it
        if (!me.pancakes.utils.isJavaScript(partialName)) { return; }

        // get the right partial name and partial
        var partial = me.getPartial(appName, partialName);

        // don't include if no view, is client only or is an abstract view
        if ((!partial.view && !partial.subviews && !partial.parent) ||
            partial.clientOnly || partial.abstract) { return; }

        // set the directive map values that will be used by jangular to render
        var directiveName = componentPrefix +
            partialName.substring(0, partialName.length - 11).replace(/\./g, '-');

        directives[directiveName] = me.getPartialRenderFn(partial);
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
 * @returns {Function}
 */
function getGenericDirective(prefix, attrName, filterType, isBind) {
    var directiveName = prefix + attrName.substring(0, 1).toUpperCase() + attrName.substring(1);
    var config = this.pancakes.cook('config', null);
    var i18n = this.pancakes.cook('i18n', null);

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
    var me = this;

    _.each(genericDirectives, function (type, attr) {
        directives['b-' + attr] = me.getGenericDirective('b', attr, null, true);
        directives['bo-' + attr] = me.getGenericDirective('bo', attr, null, true);

        if (type) {
            directives['f-' + attr] = me.getGenericDirective('f', attr, type, false);
            directives['fo-' + attr] = me.getGenericDirective('fo', attr, type, false);
            directives['bf-' + attr] = me.getGenericDirective('bf', attr, type, true);
            directives['bfo-' + attr] = me.getGenericDirective('bfo', attr, type, true);
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
    getPartial: getPartial,
    getPartialRenderFn: getPartialRenderFn,
    isolateScope: isolateScope,
    modifyModel: modifyModel,
    getSubviews: getSubviews
};
