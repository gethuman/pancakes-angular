/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * The app definition for pancakes.angular
 */
angular.module('pancakesAngular', []);

/* jshint undef: false */

// this little hack is used to fix issue with facebook social auth
// TODO: put this someplace better, but won't hurt to have it here for now
// really, this belongs in security plugin once I get to those
if (window.location.hash === '#_=_') {
    history.replaceState ?
        history.replaceState(null, null, window.location.href.split('#')[0]) :
        window.location.hash = '';
}
/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * Default active user that should be overwritten by client app
 */
angular.module('pancakesAngular').factory('activeUser', function () {
    return {};
});

 /**
 * Author: Jeff Whelpley
 * Date: 4/16/14
 *
 * For angular clients to make ajax calls to server
 */
angular.module('pancakesAngular').factory('ajax', function ($q, $http, eventBus, config) {

    /**
     * Send call to the server and get a response
     *
     * @param url
     * @param method
     * @param options
     * @param resourceName
     */
    function send(url, method, options, resourceName) {
        var deferred = $q.defer();
        var key, val, paramArray = [];

        url = config.apiBase + url;
        options = options || {};

        // separate out data if it exists
        var data = options.data;
        delete options.data;

        // attempt to add id to the url if it exists
        if (url.indexOf('{_id}') >= 0) {
            if (options._id) {
                url = url.replace('{_id}', options._id);
                delete options._id;
            }
            else if (data && data._id) {
                url = url.replace('{_id}', data._id);
            }
        }
        else if (method === 'GET' && options._id) {
            url += '/' + options._id;
            delete options._id;
        }

        var showErr = options.showErr !== false;
        delete options.showErr;

        // add params to the URL
        options.lang = options.lang || config.lang;
        for (key in options) {
            if (options.hasOwnProperty(key) && options[key]) {
                val = options[key];
                val = angular.isObject(val) ? JSON.stringify(val) : val;

                paramArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
            }
        }
        if (paramArray.length) {
            url += '?' + paramArray.join('&');
        }

        // set up the api options
        var apiOpts = {
            method: method,
            url: url,
            withCredentials: true,
            cache: false
        };

        // add data to api options if available
        if (data) {
            apiOpts.data = data;
        }

        // emit events for start and end so realtime services can stop syncing for post
        eventBus.emit(resourceName + '.' + method.toLowerCase() + '.start');

        // finally make the http call
        $http(apiOpts)
            .success(function (data) {
                deferred.resolve(data);
            })
            .error(function (err) {
                if (err) {
                    if (showErr) {
                        eventBus.emit('error.api', err);
                    }
                    deferred.reject(err);
                }
                else {
                    deferred.resolve();
                }
            })
            .finally(function () {
                eventBus.emit(resourceName + '.' + method.toLowerCase() + '.end');
            });

        return deferred.promise;
    }

    // expose send
    return {
        send: send
    };
});

///**
// * Author: Jeff Whelpley
// * Date: 11/3/14
// *
// *
// */
//(function () {
//
//    /**
//     * Originally from Pasvaz/bindonce, but modified for our purposes (only boIf for now)
//     *
//     * Bindonce - Zero watches binding for AngularJs
//     * @version v0.3.1
//     * @link https://github.com/Pasvaz/bindonce
//     * @author Pasquale Vazzana <pasqualevazzana@gmail.com>
//     * @license MIT License, http://www.opensource.org/licenses/MIT
//     */
//
//    var bindonceModule = angular.module('pancakesAngular');
//
//    bindonceModule.directive('bindonce', function ()
//    {
//        var toBoolean = function (value)
//        {
//            if (value && value.length !== 0)
//            {
//                var v = angular.lowercase("" + value);
//                value = !(v === 'f' || v === '0' || v === 'false' || v === 'no' || v === 'n' || v === '[]');
//            }
//            else
//            {
//                value = false;
//            }
//            return value;
//        };
//
//        //var msie = parseInt((/msie (\d+)/.exec(angular.lowercase(navigator.userAgent)) || [])[1], 10);
//        //if (isNaN(msie))
//        //{
//        //    msie = parseInt((/trident\/.*; rv:(\d+)/.exec(angular.lowercase(navigator.userAgent)) || [])[1], 10);
//        //}
//
//        var bindonceDirective =
//        {
//            restrict: "AM",
//            controller: ['$scope', '$element', '$attrs', '$interpolate', function ($scope, $element, $attrs, $interpolate)
//            {
//                //var showHideBinder = function (elm, attr, value)
//                //{
//                //    var show = (attr === 'show') ? '' : 'none';
//                //    var hide = (attr === 'hide') ? '' : 'none';
//                //    elm.css('display', toBoolean(value) ? show : hide);
//                //};
//                //var classBinder = function (elm, value)
//                //{
//                //    if (angular.isObject(value) && !angular.isArray(value))
//                //    {
//                //        var results = [];
//                //        angular.forEach(value, function (value, index)
//                //        {
//                //            if (value) { results.push(index); }
//                //        });
//                //        value = results;
//                //    }
//                //    if (value)
//                //    {
//                //        elm.addClass(angular.isArray(value) ? value.join(' ') : value);
//                //    }
//                //};
//                var transclude = function (transcluder, scope)
//                {
//                    transcluder.transclude(scope, function (clone)
//                    {
//                        var parent = transcluder.element.parent();
//                        var afterNode = transcluder.element && transcluder.element[transcluder.element.length - 1];
//                        var parentNode = parent && parent[0] || afterNode && afterNode.parentNode;
//                        var afterNextSibling = (afterNode && afterNode.nextSibling) || null;
//                        angular.forEach(clone, function (node)
//                        {
//                            parentNode.insertBefore(node, afterNextSibling);
//                        });
//                    });
//                };
//
//                var ctrl =
//                {
//                    watcherRemover: undefined,
//                    binders: [],
//                    group: $attrs.boName,
//                    element: $element,
//                    ran: false,
//
//                    addBinder: function (binder)
//                    {
//                        this.binders.push(binder);
//
//                        // In case of late binding (when using the directive bo-name/bo-parent)
//                        // it happens only when you use nested bindonce, if the bo-children
//                        // are not dom children the linking can follow another order
//                        if (this.ran)
//                        {
//                            this.runBinders();
//                        }
//                    },
//
//                    setupWatcher: function (bindonceValue)
//                    {
//                        var that = this;
//                        this.watcherRemover = $scope.$watch(bindonceValue, function (newValue)
//                        {
//                            if (newValue === undefined) { return; }
//                            that.removeWatcher();
//                            that.checkBindonce(newValue);
//                        }, true);
//                    },
//
//                    checkBindonce: function (value)
//                    {
//                        var that = this, promise = (value.$promise) ? value.$promise.then : value.then;
//                        // since Angular 1.2 promises are no longer
//                        // undefined until they don't get resolved
//                        if (typeof promise === 'function')
//                        {
//                            promise(function ()
//                            {
//                                that.runBinders();
//                            });
//                        }
//                        else
//                        {
//                            that.runBinders();
//                        }
//                    },
//
//                    removeWatcher: function ()
//                    {
//                        if (this.watcherRemover !== undefined)
//                        {
//                            this.watcherRemover();
//                            this.watcherRemover = undefined;
//                        }
//                    },
//
//                    runBinders: function ()
//                    {
//                        while (this.binders.length > 0)
//                        {
//                            var binder = this.binders.shift();
//                            if (this.group && this.group !== binder.group) { continue; }
//                            var value = binder.scope.$eval((binder.interpolate) ? $interpolate(binder.value) : binder.value);
//                            switch (binder.attr)
//                            {
//                                case 'boIf':
//                                    if (toBoolean(value))
//                                    {
//                                        transclude(binder, binder.scope.$new());
//                                    }
//                                    break;
//                                //case 'boSwitch':
//                                //    var selectedTranscludes, switchCtrl = binder.controller[0];
//                                //    if ((selectedTranscludes = switchCtrl.cases['!' + value] || switchCtrl.cases['?']))
//                                //    {
//                                //        binder.scope.$eval(binder.attrs.change);
//                                //        angular.forEach(selectedTranscludes, function (selectedTransclude)
//                                //        {
//                                //            transclude(selectedTransclude, binder.scope.$new());
//                                //        });
//                                //    }
//                                //    break;
//                                //case 'boSwitchWhen':
//                                //    var ctrl = binder.controller[0];
//                                //    ctrl.cases['!' + binder.attrs.boSwitchWhen] = (ctrl.cases['!' + binder.attrs.boSwitchWhen] || []);
//                                //    ctrl.cases['!' + binder.attrs.boSwitchWhen].push({ transclude: binder.transclude, element: binder.element });
//                                //    break;
//                                //case 'boSwitchDefault':
//                                //    var ctrl = binder.controller[0];
//                                //    ctrl.cases['?'] = (ctrl.cases['?'] || []);
//                                //    ctrl.cases['?'].push({ transclude: binder.transclude, element: binder.element });
//                                //    break;
//                                //case 'hide':
//                                //case 'show':
//                                //    showHideBinder(binder.element, binder.attr, value);
//                                //    break;
//                                //case 'class':
//                                //    classBinder(binder.element, value);
//                                //    break;
//                                //case 'text':
//                                //    binder.element.text(value);
//                                //    break;
//                                //case 'html':
//                                //    binder.element.html(value);
//                                //    break;
//                                //case 'style':
//                                //    binder.element.css(value);
//                                //    break;
//                                //case 'src':
//                                //    binder.element.attr(binder.attr, value);
//                                //    if (msie) binder.element.prop('src', value);
//                                //    break;
//                                //case 'attr':
//                                //    angular.forEach(binder.attrs, function (attrValue, attrKey)
//                                //    {
//                                //        var newAttr, newValue;
//                                //        if (attrKey.match(/^boAttr./) && binder.attrs[attrKey])
//                                //        {
//                                //            newAttr = attrKey.replace(/^boAttr/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
//                                //            newValue = binder.scope.$eval(binder.attrs[attrKey]);
//                                //            binder.element.attr(newAttr, newValue);
//                                //        }
//                                //    });
//                                //    break;
//                                //case 'href':
//                                //case 'alt':
//                                //case 'title':
//                                //case 'id':
//                                //case 'value':
//                                //    binder.element.attr(binder.attr, value);
//                                //    break;
//                            }
//                        }
//                        this.ran = true;
//                    }
//                };
//
//                angular.extend(this, ctrl);
//            }],
//
//            link: function (scope, elm, attrs, bindonceController)
//            {
//                var value = attrs.bindonce && scope.$eval(attrs.bindonce);
//                if (value !== undefined)
//                {
//                    bindonceController.checkBindonce(value);
//                }
//                else
//                {
//                    bindonceController.setupWatcher(attrs.bindonce);
//                    elm.bind("$destroy", bindonceController.removeWatcher);
//                }
//            }
//        };
//
//        return bindonceDirective;
//    });
//
//    angular.forEach(
//        [
//            //{ directiveName: 'boShow', attribute: 'show' },
//            //{ directiveName: 'boHide', attribute: 'hide' },
//            //{ directiveName: 'boClass', attribute: 'class' },
//            //{ directiveName: 'boText', attribute: 'text' },
//            //{ directiveName: 'boBind', attribute: 'text' },
//            //{ directiveName: 'boHtml', attribute: 'html' },
//            //{ directiveName: 'boSrcI', attribute: 'src', interpolate: true },
//            //{ directiveName: 'boSrc', attribute: 'src' },
//            //{ directiveName: 'boHrefI', attribute: 'href', interpolate: true },
//            //{ directiveName: 'boHref', attribute: 'href' },
//            //{ directiveName: 'boAlt', attribute: 'alt' },
//            //{ directiveName: 'boTitle', attribute: 'title' },
//            //{ directiveName: 'boId', attribute: 'id' },
//            //{ directiveName: 'boStyle', attribute: 'style' },
//            //{ directiveName: 'boValue', attribute: 'value' },
//            //{ directiveName: 'boAttr', attribute: 'attr' },
//
//            { directiveName: 'boIf', transclude: 'element', terminal: true, priority: 1000 }
//            //{ directiveName: 'boSwitch', require: 'boSwitch', controller: function () { this.cases = {}; } },
//            //{ directiveName: 'boSwitchWhen', transclude: 'element', priority: 800, require: '^boSwitch' },
//            //{ directiveName: 'boSwitchDefault', transclude: 'element', priority: 800, require: '^boSwitch' }
//        ],
//        function (boDirective)
//        {
//            var childPriority = 200;
//            return bindonceModule.directive(boDirective.directiveName, function ()
//            {
//                var bindonceDirective =
//                {
//                    priority: boDirective.priority || childPriority,
//                    transclude: boDirective.transclude || false,
//                    terminal: boDirective.terminal || false,
//                    require: ['^bindonce'].concat(boDirective.require || []),
//                    controller: boDirective.controller,
//                    compile: function (tElement, tAttrs, transclude)
//                    {
//                        return function (scope, elm, attrs, controllers)
//                        {
//                            var bindonceController = controllers[0];
//                            var name = attrs.boParent;
//                            if (name && bindonceController.group !== name)
//                            {
//                                var element = bindonceController.element.parent();
//                                bindonceController = undefined;
//                                var parentValue;
//
//                                while (element[0].nodeType !== 9 && element.length)
//                                {
//                                    if ((parentValue = element.data('$bindonceController')) && parentValue.group === name)
//                                    {
//                                        bindonceController = parentValue;
//                                        break;
//                                    }
//                                    element = element.parent();
//                                }
//                                if (!bindonceController)
//                                {
//                                    throw new Error("No bindonce controller: " + name);
//                                }
//                            }
//
//                            bindonceController.addBinder(
//                                {
//                                    element: elm,
//                                    attr: boDirective.attribute || boDirective.directiveName,
//                                    attrs: attrs,
//                                    value: attrs[boDirective.directiveName],
//                                    interpolate: boDirective.interpolate,
//                                    group: name,
//                                    transclude: transclude,
//                                    controller: controllers.slice(1),
//                                    scope: scope
//                                });
//                        };
//                    }
//                };
//
//                return bindonceDirective;
//            });
//        });
//})();
/**
 * Author: Jeff Whelpley
 * Date: 2/7/15
 *
 * Simple version of casing that can be overriden by other modules.
 * See casing in client specific project.
 */
angular.module('pancakesAngular').factory('casing', function () {
    var _ = angular;

    /**
     * Convert to camelCase
     * @param str
     * @param delim
     */
    function camelCase(str, delim) {
        var delims = delim || ['_', '.', '-'];

        if (!_.isArray(delims)) {
            delims = [delims];
        }

        _.each(delims, function (delim) {
            var codeParts = str.split(delim);
            var i, codePart;

            for (i = 1; i < codeParts.length; i++) {
                codePart = codeParts[i];
                codeParts[i] = codePart.substring(0, 1).toUpperCase() + codePart.substring(1);
            }

            str = codeParts.join('');
        });

        return str;
    }

    // expose functions
    return {
        camelCase: camelCase
    };
});
/**
 * Author: Jeff Whelpley
 * Date: 10/24/14
 *
 * Client side implementation of pancakes.utensils.chainPromises()
 */
angular.module('pancakesAngular').factory('chainPromises', function ($q) {
    return function chainPromises(calls, val) {
        if (!calls || !calls.length) { return $q.when(val); }
        return calls.reduce($q.when, $q.when(val));
    };
});
/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/22/14
 *
 * Client side event bus is essentially an isolated scope that
 * has been enhanced with a couple convenience functions
 */
angular.module('pancakesAngular').factory('eventBus', function ($document, $rootScope) {

    // the event bus is a new isolated scope
    var eventBus = $rootScope.$new(true);
    eventBus.on = eventBus.$on;
    eventBus.watch = eventBus.$watch;

    /**
     * For emit, we want to make sure everyone sees it even
     * if they are just listening on a local scope so we broadcast
     * to the rootScope
     */
    eventBus.emit = function () {
        $rootScope.$broadcast.apply($rootScope, arguments);
    };

    /**
     * Bind an event to the root document
     * @param eventName
     * @param callback
     */
    eventBus.bindToDocument = function (eventName, callback) {
        $document.bind(eventName, callback);
    };

    return eventBus;
});

/**
 * Author: Jeff Whelpley
 * Date: 10/15/14
 *
 * This module should be overridden by the app
 */
angular.module('pancakesAngular').factory('config', function () {
    return {
        staticFiles: {
            assets: '/'
        }
    };
});
/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 9/3/14
 *
 * Utilities for generating directives or helping generate them. This functionality
 * should somewhat line up with the server side implementation that is in
 * pancakes.angular.middleware.js addGenericDirectives()
 */
(function () {
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

    var app = angular.module('pancakesAngular');
    var attrPascal, type;

    // function used for each of the generic directives
    function addDirective(directiveName, attrName, filterType, isBind, isBindOnce) {
        app.directive(directiveName, ['i18n', 'config', function (i18n, config) {
            return {
                priority: 101,
                link: function linkFn(scope, element, attrs) {
                    var originalValue = attrs[directiveName];

                    // if we are binding to the attribute value
                    if (isBind) {
                        var unwatch = scope.$watch(originalValue, function (value) {
                            if (value !== undefined && value !== null) {
                                value = filterType === 'file' ?
                                config.staticFileRoot + value :
                                    i18n.translate(value);

                                attrName === 'text' ?
                                    element.text(value) :
                                    attrName === 'class' ?
                                        attrs.$addClass(value) :
                                        attrs.$set(attrName, value, scope);

                                // if bind once, we are unwatch after the first time
                                if (isBindOnce && unwatch) { unwatch(); }
                            }
                        });
                    }

                    // else we are not binding, but we want to do some filtering
                    else if (!isBind && filterType !== null) {

                        // if the value contains {{ it means there is interpolation
                        if (originalValue.indexOf('{{') >= 0) {
                            var unobserve = attrs.$observe(directiveName, function (value) {
                                value = filterType === 'file' ?
                                config.staticFileRoot + value :
                                    i18n.translate(value, scope);

                                attrName === 'text' ?
                                    element.text(value) :
                                    attrs.$set(attrName, value, scope);

                                if (isBindOnce && unobserve) { unobserve(); }
                            });
                        }
                        // else we are very simply setting the value
                        else {
                            var targetValue = filterType === 'file' ?
                            config.staticFileRoot + originalValue :
                                i18n.translate(originalValue);

                            attrName === 'text' ?
                                element.text(targetValue) :
                                attrs.$set(attrName, targetValue, scope);
                        }
                    }
                }
            };
        }]);
    }

    // loop through all generic directive attributes and add directives
    for (var attr in genericDirectives) {
        if (genericDirectives.hasOwnProperty(attr)) {
            attrPascal = attr.substring(0, 1).toUpperCase() + attr.substring(1);

            // no b-class because just adding class one time
            if (attr !== 'class') {
                addDirective('b' + attrPascal, attr, null, true, false);
            }

            addDirective('bo' + attrPascal, attr, null, true, true);

            // if file then do f- and bf- for static file
            type = genericDirectives[attr];
            if (type) {
                addDirective('f' + attrPascal, attr, type, false, false);
                addDirective('fo' + attrPascal, attr, type, false, true);
                addDirective('bf' + attrPascal, attr, type, true, false);
                addDirective('bfo' + attrPascal, attr, type, true, true);
            }
        }
    }
})();

/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * Default i18n that should be overwritten by the client
 */
angular.module('pancakesAngular').factory('i18n', function () {
    return {
        translate: function (val) { return val; }
    };
});
/**
 * Author: Jeff Whelpley
 * Date: 10/15/14
 *
 * Initial model that will be overwritten by the UI router resolve. Not every
 * page has a model() function, so this will be used as a default so the uipart
 * generator can safely put 'initialModel' in all page controllers
 */
angular.module('pancakesAngular').factory('initialModel', function () {
    return {};
});

/**
 * Author: Jeff Whelpley
 * Date: 2/7/15
 *
 * Client version of the pageHelper in pancakes that is used on the server side
 */
angular.module('pancakesAngular').factory('pageHelper', function (casing, routeHelper) {
    var apps = {};
    var pageHelper = {};

    /**
     * Register a page helper function
     * @param appName
     * @param routeName
     * @param funcName
     * @param func
     */
    pageHelper.register = function register(appName, routeName, funcName, func) {

        // app and route name could be dot notation, so make them camel case
        appName = casing.camelCase(appName, '.');
        routeName = casing.camelCase(routeName, '.');

        // make sure object is initialized
        apps[appName] = apps[appName] || {};
        apps[appName][routeName] = apps[appName][routeName] || {};

        // we wrap the input function so we can add the routeHandler to the input options
        function handler(opts) {
            opts.routeHelper = routeHelper;
            return func(opts);
        }

        // set handler in the object in case the user calls it dynamically
        apps[appName][routeName][funcName] = handler;

        // and add a convenience function name for example pageHelper.formatUrlAnswersPost(opts)
        var name = casing.camelCase([funcName, appName, routeName].join('.'), '.');
        this[name] = handler;

        // also since many times the route name is unique, pageHelper.formatUrlPost()
        name = casing.camelCase([funcName, routeName].join('.'), '.');
        this[name] = handler;

        // finally if just call the function name, let them pass in the appName and routeName
        // pageHelper.formatUrl(appName, routeName, opts);
        this[funcName] = function (appName, routeName, opts) {
            return apps[appName][routeName][funcName](opts);
        };
    };

    return pageHelper;
});

/**
 * Author: Jeff Whelpley
 * Date: 4/22/14
 *
 * Change the HTML page settings
 */
angular.module('pancakesAngular').factory('pageSettings', function ($window, $rootElement) {

    /**
     * Set the page title and description
     * @param title
     * @param description
     */
    function updateHead(title, description) {
        $window.document.title = title;
        var metaDesc = angular.element($rootElement.find('meta[name=description]')[0]);
        metaDesc.attr('content', description);
    }

    /**
     * Update the class name used to key off all styles on the page
     * @param pageName
     */
    function updatePageStyle(pageName) {
        var pageCssId = 'gh-' + pageName.replace('.', '-');
        var elem = $rootElement.find('.maincontent');

        if (elem && elem.length) {
            elem = angular.element(elem[0]);
            elem.attr('id', pageCssId);
        }
    }

    // expose functions
    return {
        updateHead: updateHead,
        updatePageStyle: updatePageStyle
    };
});


/**
 * Author: Jeff Whelpley
 * Date: 2/7/15
 *
 * This should be overriden by an implementing project
 */
angular.module('pancakesAngular').factory('routeHelper', function () {
    return {};
});
/**
 * Author: Jeff Whelpley
 * Date: 11/7/14
 *
 *
 */
angular.module('pancakesAngular').factory('serviceHelper', function (ajax) {

    /**
     * Generate a service method
     * @param method
     * @returns {Function}
     */
    function genServiceMethod(method) {
        return function (req) {
            return ajax.send(method.url, method.httpMethod, req, method.resourceName);
        };
    }

    /**
     * Generate a service based on a set of methods
     * @param methods
     */
    function genService(methods) {
        var service = {};

        for (var methodName in methods) {
            if (methods.hasOwnProperty(methodName)) {
                service[methodName] = genServiceMethod(methods[methodName]);
            }
        }

        return service;
    }

    //function genModelMethod(methodName, serviceMethod) {
    //    return function (req) {
    //
    //        // in the future we may
    //
    //        return serviceMethod(req);
    //    };
    //}

    /**
     * Generate a model off the service
     */
    function genModel(service) {
        var model = function (data) {
            this.data = data;
        };

        model.prototype.save = function () {
            return (this.data && this.data._id) ?
                service.update({ data: this.data }) :
                service.create({ data: this.data });
        };

        angular.extend(model, service);

        //for (var methodName in service) {
        //    if (service.hasOwnProperty(methodName)) {
        //        model[methodName] = genModelMethod(methodName, service[methodName]);
        //    }
        //}

        return model;
    }

    // expose functions
    return {
        genServiceMethod: genServiceMethod,
        genService: genService,
        genModel: genModel
    };
});

/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/16/14
 *
 * Load given set of states into the UI router $stateProvider
 */
angular.module('pancakesAngular').provider('stateLoader', function () {

    /**
     * Helper function to get pascal case of a route name
     * @param val
     * @returns {string}
     */
    function getPascalCase(val) {
        var parts = val.split('.');
        var newVal = '';

        for (var i = 0; i < parts.length; i++) {
            newVal += parts[i].substring(0, 1).toUpperCase() + parts[i].substring(1);
        }

        return newVal;
    }

    /**
     * This is the route loader for angular where we take the input route config data
     * and load it into the UI Router
     *
     * @param $stateProvider
     * @param routes
     * @param resolves
     */
    this.loadStates = function loadStates($stateProvider, routes, resolves) {
        var stateNames = {};
        angular.forEach(routes, function (route) {
            angular.forEach(route.urls, function (url, idx) {
                var initialModel = resolves[route.name] || function () { return {}; };
                var stateName = (route.name + (idx === 0 ? '' : '--' + idx)).replace(/\./g, '-');
                var stateConfig = {
                    url: url,
                    resolve: {
                        initialModel: initialModel,
                        loadedUser: ['activeUser', function (activeUser) {
                            return activeUser.init();
                        }]
                    },
                    onEnter: ['$rootScope', function ($rootScope) {
                        $rootScope.stateData = route.data || {};
                        $rootScope.pageLoadTimestamp = (new Date()).getTime();
                    }],
                    views: {
                        '': {
                            controller:     getPascalCase(route.name + 'Ctrl'),
                            templateUrl:    'templates/' + route.name
                        }
                    }
                };

                // need to make sure state names are unique so just add a timestamp if nothing else
                if (stateNames[stateName]) { stateName += (new Date()).getTime(); }
                stateNames[stateName] = true;

                // add state to the UI Router
                $stateProvider.state(stateName, stateConfig);
            });
        });
    };

    /**
     * This doesn't do anything because we are hijacking the provider angular type
     * so we can get this functionality into the config
     * @returns {{}}
     */
    this.$get = function () { return { getPascalCase: getPascalCase }; };
});

/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * This has utilities that are used to help work with generated
 * template code
 */
angular.module('pancakesAngular').factory('tplHelper', function ($q, $injector, config, pageSettings, eventBus) {

    /**
     * Given a set of default values, add them to the scope if
     * a value does not already exist.
     *
     * @param scope
     * @param defaults
     */
    function setDefaults(scope, defaults) {
        if (!defaults) { return; }

        // store defaults for use in generateRemodel
        scope.defaults = defaults;

        for (var name in defaults) {
            if (defaults.hasOwnProperty(name) && scope[name] === undefined) {
                scope[name] = defaults[name];
            }
        }
    }

    /**
     * Set options if they exist. Only can override defaults, though, so
     * if no defaults value, then error thrown.
     * This matches jng.utils.applyPresets()
     *
     * @param scope
     * @param defaults
     * @param presets
     */
    function applyPresets(scope, defaults, presets) {
        if (!scope || !presets) { return; }

        // presets come from either scope (i.e. passed in directly) or get from the ui part presets
        var opts = scope.presets || presets[scope.preset] ||
            (scope.preset && presets[scope.type + '.' + scope.preset]) || presets[scope.type];
        if (!opts) { return; }

        for (var name in opts) {
            if (opts.hasOwnProperty(name)) {
                if (!defaults || defaults[name] === undefined) {
                    throw new Error('No defaults value for ' + name + ' but in options.' + scope.preset);
                }
                else {
                    scope[name] = opts[name];
                }
            }
        }
    }

    /**
     * This will generate a re-render function for pages. Partials don't need this because
     * re-render is defined in the directive link function. See ng.uipart.template.
     *
     * @param scope
     * @param $state This is from the UI router, but we don't want a dependency on UI router at this level, so pass it in from app
     */
    function generateRerender(scope, $state) {
        if (!$state) { return; }

        scope.rerenderComponent = function () {
            $state.go($state.current, {}, {reload: true});
        };
    }

    /**
     * Add a function to the scope that will re-call the model() function for
     * a given uipart. This function is different for pages and partials because
     * pages are async and return a promise while partials are functions that
     * simply modify the model. Also, for partials, we want to call the remodel
     * right away, but for pages it has already been called by the UI router.
     *
     * @param scope
     * @param ctrlName
     * @param isPartial
     * @param fnOrObj
     * @param directiveScope
     */
    function generateRemodel(scope, ctrlName, isPartial, fnOrObj, directiveScope) {
        if (!fnOrObj) { return; }
        directiveScope = directiveScope || {};

        // remodeling will call the model function
        scope.remodel = function () {
            var locals = {
                currentScope:   scope,
                defaults:       scope.defaults
            };

            try {

                // if the partial model() is a function or an array with a function at the end,
                // inject it and set the return value on the scope
                if (angular.isFunction(fnOrObj) ||
                    (angular.isArray(fnOrObj) && angular.isFunction(fnOrObj[fnOrObj.length - 1]))) {

                    $q.when($injector.invoke(fnOrObj, null, locals))
                        .then(function (model) {
                            angular.forEach(model, function (modelVal, modelName) {
                                if (directiveScope[modelName]) {
                                    throw new Error(ctrlName + ' model() should not return ' + modelName + ' from the parent scope');
                                }

                                scope[modelName] = modelVal;
                            });
                        });
                }
                // else it should be an object so loop through
                else {
                    angular.forEach(fnOrObj, function (val, name) {
                        if (name === 'end') {
                            return;
                        }

                        if (directiveScope[name]) {
                            throw new Error(ctrlName + ' model() should not return ' + name + ' from the parent scope');
                        }

                        // if a function inject it and set returned value on scope[name]
                        if (angular.isFunction(val) ||
                            (angular.isArray(val) && angular.isFunction(val[val.length - 1]))) {

                            $q.when($injector.invoke(val, null, locals))
                                .then(function (model) {
                                    scope[name] = model;
                                });
                        }
                        // else just set the value on scope[name]
                        else {
                            scope[name] = val;
                        }
                    });
                }

            }
            catch (ex) {
                console.log(ctrlName + ' has err ');
                throw ex;
            }
        };

        // for partials, we want to remodel right away
        if (isPartial) { scope.remodel(); }
    }

    /**
     * Add validations to the scope
     * @param scope
     * @param validations
     */
    function addValidations(scope, validations) {
        for (var name in validations) {
            if (validations.hasOwnProperty(name) && validations[name]) {
                scope[name] = $injector.invoke(validations[name]);
            }
        }
    }

    /**
     * Given an array of items, instantiate them and attach them to the scope.
     * @param scope
     * @param itemsToAttach
     */
    function attachToScope(scope, itemsToAttach) {
        if (!itemsToAttach || !itemsToAttach.length) { return; }

        itemsToAttach.push(function () {
            var i, val;
            for (i = 0; i < arguments.length; i++) {
                val = arguments[i];
                scope[itemsToAttach[i]] = val;
            }
        });

        $injector.invoke(itemsToAttach);
    }

    /**
     * Generate a handler for a given callback
     * @param cb
     * @returns {Function}
     */
    function generateScopeChangeHandler(cb) {
        var firstTime = true;
        return function () {
            if (firstTime) {
                firstTime = false;
            }
            else {
                cb();
            }
        };
    }

    /**
     * Create the render model function, execute it and set up
     * watchers for when it should be re-rendered.
     *
     * @param scope
     * @param watchers
     * @param cb Callback when scope changes
     */
    function doOnScopeChange(scope, watchers, cb) {
        var i, watchExp, firstChar, handler;

        // set up the watchers if they exist
        if (watchers && cb) {
            for (i = 0; i < watchers.length; i++) {
                handler = generateScopeChangeHandler(cb);
                watchExp = watchers[i];
                firstChar = watchExp.charAt(0);
                if (firstChar === '^') {
                    scope.$watchCollection(watchExp.substring(1), handler);
                }
                else if (firstChar === '*') {
                    scope.$watch(watchExp.substring(1), handler, true);
                }
                else {
                    scope.$watch(watchExp, handler);
                }
            }
        }
    }

    /**
     * When rerendering, we need to make sure the model is rebound as well (if the
     * remodeling fn exists).
     *
     * @param scope
     * @returns {Function}
     */
    function generateRerenderCallback(scope) {
        return function () {
            var remodel = scope.remodel || function () { return true; };
            $q.when(remodel(scope))
                .then(function () {
                    scope.rerenderComponent();
                });
        };
    }

    /**
     * Re-bind the model when the scope changes
     * @param scope
     * @param watchers
     * @returns {*}
     */
    function remodelOnScopeChange(scope, watchers) {
        return doOnScopeChange(scope, watchers, scope.remodel);
    }

    /**
     * Re-render the component (i.e. directive) when the scope changes
     * @param scope
     * @param watchers
     * @returns {*}
     */
    function rerenderOnScopeChange(scope, watchers) {
        return doOnScopeChange(scope, watchers, generateRerenderCallback(scope));
    }

    /**
     * Create the render model function, execute it and set up
     * watchers for when it should be re-rendered.
     *
     * @param scope
     * @param events
     * @param cb Callback when event occurs
     */
    function doOnEvent(scope, events, cb) {
        var i, eventName;
        var fns = [];  // these will hold callbacks for removing listeners

        // set up the watchers if they exist
        if (events && cb) {
            for (i = 0; i < events.length; i++) {
                eventName = events[i];
                fns.push(eventBus.on(eventName, cb));
            }

            // make sure handlers are destroyed along with scope
            scope.$on('$destroy', function () {
                for (var i = 0; i < fns.length; i++) {
                    fns[i]();
                }
            });
        }
    }

    /**
     * Re-bind the model when there is an event
     * @param scope
     * @param events
     * @returns {*}
     */
    function remodelOnEvent(scope, events) {
        return doOnEvent(scope, events, scope.remodel);
    }

    /**
     * Re-render the component (i.e. directive) when there is an event
     * @param scope
     * @param events
     * @returns {*}
     */
    function rerenderOnEvent(scope, events) {
        return doOnEvent(scope, events, generateRerenderCallback(scope));
    }

    /**
     * Add the initial model to the scope and set the page title, desc, etc.
     * @param scope
     * @param initialModel
     * @param pageName
     */
    function addInitModel(scope, initialModel, pageName) {
        angular.extend(scope, initialModel);

        if (scope.pageHead && scope.pageHead.title) {
            var title = scope.pageHead.title;
            pageSettings.updateHead(title, scope.pageHead.description ||  title);
            pageSettings.updatePageStyle(pageName);
        }
    }

    /**
     * Register listeners and make sure they will be destoryed once the scope
     * is destroyed.
     *
     * @param scope
     * @param listeners
     */
    function registerListeners(scope, listeners) {
        var fns = [];

        for (var name in listeners) {
            if (listeners.hasOwnProperty(name) && listeners[name]) {
                fns.push(eventBus.on(name, $injector.invoke(listeners[name])));
            }
        }

        // make sure handlers are destroyed along with scope
        scope.$on('$destroy', function () {
            for (var i = 0; i < fns.length; i++) {
                fns[i]();
            }
        });
    }

    /**
     * Add the UI event handlers to the scope
     * @param scope
     * @param ctrlName
     * @param handlers
     */
    function addEventHandlers(scope, ctrlName, handlers) {
        if (!handlers) { return; }

        for (var name in handlers) {
            if (handlers.hasOwnProperty(name) && handlers[name]) {
                scope[name] = $injector.invoke(handlers[name]);

                // if it is not a function, throw error b/c dev likely made a mistake
                if (!angular.isFunction(scope[name])) {
                    throw new Error(ctrlName + ' has uiEventHandler ' + name + ' that does not return a function');
                }
            }
        }
    }

    /**
     * Sugar for the controller fn in a uipart. Purpose is to make it more clear what
     * the user is trying to do (i.e. some side effects once the client loads)
     * @param clientLoadFn
     */
    function onClientLoad(clientLoadFn) {
        $injector.invoke(clientLoadFn);
    }

    // expose functions
    return {
        setDefaults: setDefaults,
        applyPresets: applyPresets,
        generateRerender: generateRerender,
        generateRemodel: generateRemodel,
        addValidations: addValidations,
        attachToScope: attachToScope,
        generateRerenderCallback: generateRerenderCallback,
        rerenderOnScopeChange: rerenderOnScopeChange,
        rerenderOnEvent: rerenderOnEvent,
        remodelOnScopeChange: remodelOnScopeChange,
        remodelOnEvent: remodelOnEvent,
        generateScopeChangeHandler: generateScopeChangeHandler,
        doOnScopeChange: doOnScopeChange,
        doOnEvent: doOnEvent,
        addInitModel: addInitModel,
        registerListeners: registerListeners,
        addEventHandlers: addEventHandlers,
        onClientLoad: onClientLoad
    };
});