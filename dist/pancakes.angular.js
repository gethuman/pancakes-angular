/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * The app definition for pancakes.angular
 */
angular.module('pancakesAngular', ['ngCookies']);

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
angular.module('pancakesAngular')
    .factory('ajaxInterceptor', ["$q", "$injector", "$timeout", "eventBus", function ($q, $injector, $timeout, eventBus) {
        var maxRetries = 5;
        var resetTime = 0;

        // if state changes, set the last reset (i.e. stop all retries)
        eventBus.on('$stateChangeSuccess', function () {
            resetTime = (new Date()).getTime();
        });
        eventBus.on('$stateChangeError', function () {
            resetTime = (new Date()).getTime();
        });

        return {
            'responseError': function (response) {
                var config = response.config;
                config.retryCount = config.retryCount || 0;

                // only do retry if the following is true:
                //      1. no status returned in response (i.e. server didn't respond with anything)
                //      2. retry count under max threshold (i.e. only 5 retries allowed max)
                //      3. a reset event hasn't occurred (i.e. the state hasn't changed)
                if (!response.status && config.retryCount < maxRetries &&
                    (!config.retryTime || config.retryTime > resetTime)) {

                    config.retryCount++;
                    config.retryTime = (new Date()).getTime();

                    var $http = $injector.get('$http');
                    var deferred = $q.defer();

                    // do timeout to
                    $timeout(function () {
                        $http(config)
                            .then(function (respData) {
                                deferred.resolve(respData);
                            })
                            .catch(function (respData) {
                                deferred.reject(respData);
                            });
                    }, 200 * config.retryCount);

                    return deferred.promise;
                }

                // give up
                return $q.reject(response);
            }
        };
    }])
    .config(["$httpProvider", function ($httpProvider) {
        $httpProvider.interceptors.push('ajaxInterceptor');
    }])
    .factory('ajax', ["$q", "$http", "eventBus", "config", "storage", "log", function ($q, $http, eventBus, config, storage, log) {

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

            // add visitorId to params
            var visitorId = storage.get('visitorId');
            if (visitorId && visitorId !== 'null' && visitorId !== 'undefined') {
                paramArray.push('onBehalfOfVisitorId' + '=' + visitorId);
            }

            // add params to URL
            if (paramArray.length) {
                url += '?' + paramArray.join('&');
            }

            // set up the api options
            var apiOpts = {
                method:     method,
                url:        url
            };

            // if the jwt exists, add it to the request
            var jwt = storage.get('jwt');
            if (jwt && jwt !== 'null') {  // hack fix; someone setting localStorage to 'null'
                apiOpts.headers = {
                    Authorization: jwt
                };
            }

            // add data to api options if available
            if (data) {
                apiOpts.data = data;
            }

            // emit events for start and end so realtime services can stop syncing for post
            eventBus.emit(resourceName + '.' + method.toLowerCase() + '.start');

            // finally make the http call
            $http(apiOpts)
                .success(function (respData) {
                    storage.set('lastApiCall', JSON.stringify(apiOpts));
                    deferred.resolve(respData);
                })
                .error(function (err, status, headers, conf) {
                    storage.set('lastApiCall', JSON.stringify(apiOpts));

                    if (!err && !status) {
                        err = new Error('Cannot access back end');
                    }
                    else if (!err && status) {
                        err = new Error('error httpCode ' + status);
                    }

                    if (showErr) {
                        eventBus.emit('error.api', err);
                    }

                    // todo: remove this once have debugged issues
                    log.error(err, {
                        apiOpts: apiOpts,
                        status: status,
                        headers: headers,
                        config: conf
                    });

                    deferred.reject(err);
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
    }]
);

/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Simple utility for the href directives to utilize
 */
angular.module('pancakesAngular').factory('bindHref', ["tapTrack", "stateHelper", function (tapTrack, stateHelper) {

    return function bind(scope, elem, attrs, value) {
        var name = elem.length && elem[0].localName;

        // if an a tag, then just set the href attribute
        if (name === 'a') {
            attrs.$set('href', value, scope);
        }
        // else we are doing a client side gh-tap
        else {
            tapTrack.bind(scope, elem, true, function () {
                stateHelper.goToUrl(value);
            });
        }
    };
}]);
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

        _.each(delims, function (adelim) {
            var codeParts = str.split(adelim);
            var i, codePart;

            for (i = 1; i < codeParts.length; i++) {
                codePart = codeParts[i];
                codeParts[i] = codePart.substring(0, 1).toUpperCase() + codePart.substring(1);
            }

            str = codeParts.join('');
        });

        return str;
    }

    /**
     * Convert a dash string to dash Proper:
     * @param str
     */
    function dashProperCase(str) {
        if ( !str.length ) {
            return str;
        }
        return str.split('-').map(function(piece) {
            if ( piece.length ) {
                return piece.substring(0,1).toUpperCase() + piece.substring(1);
            }
            return piece;
        }).join('-');
    }

    // expose functions
    return {
        camelCase: camelCase,
        dashProperCase: dashProperCase
    };
});
/**
 * Author: Jeff Whelpley
 * Date: 10/24/14
 *
 * Client side implementation of pancakes.utensils.chainPromises()
 */
angular.module('pancakesAngular').factory('chainPromises', ["$q", function ($q) {
    return function chainPromises(calls, val) {
        if (!calls || !calls.length) { return $q.when(val); }
        return calls.reduce($q.when, $q.when(val));
    };
}]);
/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Track stats to google analytics upon state changes
 */
angular.module('pancakesAngular').factory('clientAnalytics', ["$window", "$location", "eventBus", function ($window, $location, eventBus) {

    /**
     * Sent to google using the _gaq object that should be loaded on the window
     */
    function captureCurrentPath() {
        var gaq = $window._gaq || [];
        gaq.push(['_trackPageview', $location.path()]);
    }

    // add event handler if the gaq object exists on the window
    if ($window._gaq) {
        eventBus.on('$stateChangeSuccess', function () {
            captureCurrentPath();
        });
    }

    // expose the function for testing purposes
    return {
        captureCurrentPath: captureCurrentPath
    };
}]);
/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Initial client data thta is in the DOM
 */
angular.module('pancakesAngular').factory('clientData', ["$window", function ($window) {
    var clientData = $window.clientData || {};

    /**
     * Get some data from the DOM clientData object
     * @param name
     * @returns {*}
     */
    function get(name) {
        return clientData[name];
    }

    // expose get
    return {
        get: get
    };
}]);

/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/22/14
 *
 * Client side event bus is essentially an isolated scope that
 * has been enhanced with a couple convenience functions
 */
angular.module('pancakesAngular').factory('eventBus', ["$document", "$rootScope", function ($document, $rootScope) {

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
}]);

/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Listens for log events and sends them to the console
 */
angular.module('pancakesAngular').factory('clientLogReactor',
    ["_", "extlibs", "eventBus", "config", "stateHelper", "activeUser", "storage", function (_, extlibs, eventBus, config, stateHelper, activeUser, storage) {

        config = config || {};

        var raven = extlibs.get('Raven');
        var useConsole = config.logTransport && config.logTransport.indexOf('console') >= 0;
        var useRemote = raven && config.logTransport && config.logTransport.indexOf('remote') >= 0;
        var logLevel = config.logLevel || 'error';

        if (raven && raven.config) {
            raven.config(config.errorUrl, {}).install();
        }

        /* eslint no-console:0 */

        /**
         * Send log to the console
         * @param event
         * @param logData
         */
        function log(event, logData) {
            if (useConsole) {
                console.log(logData);
            }

            if (useRemote) {
                var err = logData.err;
                delete logData.err;

                if (angular.isString(logData)) {
                    var msg = logData;
                    logData = {};
                    logData.msg = msg;
                }

                logData.msg = logData.msg || logData.message;
                logData.url = stateHelper.getCurrentUrl();
                logData.userId = activeUser._id;
                logData.username = activeUser.username;
                logData.lastApiCall = storage.get('lastApiCall');

                if (!err && !logData.msg) {
                    return;
                }

                err ?
                    raven.captureException(err, { extra: logData }) :
                    raven.captureMessage(logData.msg, { extra: logData });
            }
        }

        /******* INIT API & EVENT HANDLERS ********/

        if (logLevel === 'error') {
            eventBus.on('log.error',    log);
            eventBus.on('log.critical', log);
            eventBus.on('error.api',    log);
        }
        else if (logLevel === 'info') {
            eventBus.on('log.info',     log);
            eventBus.on('log.error',    log);
            eventBus.on('log.critical', log);
            eventBus.on('error.api',    log);
        }
        else if (logLevel === 'debug') {
            eventBus.on('log.debug',    log);
            eventBus.on('log.info',     log);
            eventBus.on('log.error',    log);
            eventBus.on('log.critical', log);
            eventBus.on('error.api',    log);
        }


        // make sure we log any state change errors (only applies to client side)
        eventBus.on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, err) {
            log(event, {
                err: err,
                msg: 'state change error from ' + fromState + ' to ' + toState + ' with error: ' + err + '',
                stack: err && err.stack,
                inner: err && err.inner
            });
        });

        // functions to expose (only for testing purposes)
        return {
            log: log
        };
    }]
);
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
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Simple wrapper for getting external libraries outside Angular
 * from the client
 */
angular.module('pancakesAngular').factory('extlibs', ["$window", function ($window) {

    /**
     * Get an external client side library on the window or return empty object
     * @param name
     * @returns {*|{}}
     */
    function get(name) {
        return $window[name] || {};
    }

    // expose get
    return {
        get: get
    };
}]);
/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * A function that sets focus on a particular element
 */
angular.module('pancakesAngular').factory('focus', ["$timeout", "extlibs", function ($timeout, extlibs) {
    var jQuery = extlibs.get('jQuery');

    /**
     * Set focus on an element
     * @param selector
     */
    function set(selector) {
        $timeout(function setFocus() {
            var el = jQuery(selector);
            if (el && el.length) {
                var len = el.val().length;
                el[0].focus();
                el[0].setSelectionRange(len, len);
            }
        }, 200);
    }

    /**
     * Blur an element
     * @param selector
     */
    function blur(selector) {
        $timeout(function blurFocus() {
            var el = jQuery(selector);
            if (el && el.length) {
                el[0].blur();
            }
        }, 100);
    }

    // expose functions
    return {
        set: set,
        blur: blur
    };
}]);

/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 9/3/14
 *
 * Utilities for generating directives or helping generate them. This functionality
 * should somewhat line up with the server side implementation that is in
 * pancakes.angular jng.directives.js addGenericDirectives()
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
    function addDirective(directiveName, attrName, filterType, isBind, isBindOnce, isFilter) {
        app.directive(directiveName, ['i18n', 'config', function (i18n, config) {

            function setValue(scope, element, attrs, value) {
                value = !isFilter ? value :
                    filterType === 'file' ?
                        (config.staticFileRoot + value) :
                        i18n.translate(value, scope);

                attrName === 'text' ?
                    element.text(value) :
                    attrName === 'class' ?
                        attrs.$addClass(value) :
                        attrs.$set(attrName, value, scope);
            }

            return {
                priority: 101,
                link: function linkFn(scope, element, attrs) {
                    var originalValue = attrs[directiveName];

                    // if we are binding to the attribute value
                    if (isBind) {
                        var unwatch = scope.$watch(originalValue, function (value) {
                            if (value !== undefined && value !== null) {
                                setValue(scope, element, attrs, value);
                                if (isBindOnce && unwatch) { unwatch(); }
                            }
                        });
                    }

                    // else we are not binding, but we want to do some filtering
                    else if (!isBind && isFilter && filterType !== null) {

                        // if the value contains {{ it means there is interpolation
                        if (originalValue.indexOf('{{') >= 0) {
                            var unobserve = attrs.$observe(directiveName, function (value) {
                                setValue(scope, element, attrs, value);
                                if (isBindOnce && unobserve) { unobserve(); }
                            });
                        }
                        // else we are very simply setting the value
                        else {
                            setValue(scope, element, attrs, originalValue);
                        }
                    }
                    else {
                        throw new Error('Not bind nor filter in generic addDirective for ' + originalValue);
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
                addDirective('b' + attrPascal, attr, null, true, false, false);
            }

            addDirective('bo' + attrPascal, attr, null, true, true, false);

            // if file then do f- and bf- for static file
            type = genericDirectives[attr];
            if (type) {
                addDirective('f' + attrPascal, attr, type, false, false, true);
                addDirective('fo' + attrPascal, attr, type, false, true, true);
                addDirective('bf' + attrPascal, attr, type, true, false, true);
                addDirective('bfo' + attrPascal, attr, type, true, true, true);
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
        translate: function (val) {
            return val;
        }
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
 * Date: 4/22/14
 *
 * Change the HTML page settings
 */
angular.module('pancakesAngular').factory('pageSettings', ["$window", "$rootElement", function ($window, $rootElement) {

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
}]);


/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * This module will get the query params and raise an event for any notifications
 */
angular.module('pancakesAngular').factory('queryParams', ["_", "$timeout", "$location", "eventBus", "stateHelper", function (_, $timeout, $location, eventBus, stateHelper) {
    var params = {};

    eventBus.on('$locationChangeSuccess', function () {

        stateHelper.getQueryParams(params);

        // timeout for 500ms to allow angular to load the page as normal
        $timeout(function modParams() {

            // remove the query params
            stateHelper.removeQueryParams(params);

            // if there is a notify param, emit it so the notify service can display it
            if (params.notify) {
                eventBus.emit('notify', params.notify);
                delete params.notify;
            }
        }, 500);
    });

    return params;
}]);
/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Don't apply if already digest cycle in process
 */
angular.module('pancakesAngular').factory('safeApply', ["$rootScope", function ($rootScope) {
    return function safeApply(fn) {
        var phase = $rootScope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof fn === 'function')) {
                fn();
            }
        }
        else {
            $rootScope.$apply(fn);
        }
    };
}]);

/**
 * Author: Jeff Whelpley
 * Date: 11/7/14
 *
 *
 */
angular.module('pancakesAngular').factory('serviceHelper', ["ajax", function (ajax) {

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
}]);

/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * This client side service is used to help with state changes
 */
angular.module('pancakesAngular').factory('stateHelper', ["$window", "$timeout", "$location", "_", "eventBus", function ($window, $timeout, $location, _, eventBus) {
    var preventStateChange = false;
    var preventLocationChange = false;

    /**
     * Simply go to the url and allow the state to change
     * @param url
     */
    function goToUrl(url) {
        if (!url) { return; }

        if (_.isArray(url)) {
            url = url.join('/');
        }

        var hasHttp = url.indexOf('http') === 0;
        if (!hasHttp && url.indexOf('/') !== 0) {
            url = '/' + url;
        }

        hasHttp ? $window.location.href = url : $location.path(url);
    }

    /**
     * Change the URL to the slug for the given question
     * WITHOUT firing the state changed events
     * @param url
     */
    function switchUrl(url) {

        // state changing off and then remove the query string
        preventStateChange = true;
        $location.replace().url(url);

        // turn state changing back on after 200 ms
        $timeout(function () { preventStateChange = false; }, 200);
    }

    /**
     * Get params from the URL
     */
    function getQueryParams(params) {
        params = params || {};
        var url = $location.url();
        var idx = url.indexOf('?');

        // if there is a query string
        if (idx < 0) { return {}; }

        // get the query string and split the keyvals
        var query = url.substring(idx + 1);
        var keyVals = query.split('&');

        // put each key/val into the params object
        _.each(keyVals, function (keyVal) {
            var keyValArr = keyVal.split('=');
            params[keyValArr[0]] = keyValArr[1];
        });

        return params;
    }

    /**
     * Remove the query params from a page
     */
    function removeQueryParams() {
        switchUrl($location.path());

        //params = params || getQueryParams();
        //
        //if (!params.updated) {
        //    switchUrl($location.path());
        //}
    }

    /**
     * By adding updated query param, we let browser know state has changed
     */
    function saveBrowserState() {
        switchUrl($location.path() + '?updated=' + (new Date()).getTime());
    }

    /**
     * Get the current URL using the $location service
     * @returns {string}
     */
    function getCurrentUrl() {
        return $location.absUrl();
    }

    /**
     * Get the current user agent
     */
    function getUserAgent() {
        return $window.navigator.userAgent;
    }

    // so, this is a total hack, but basically this combination of variables and
    // event handlers allows us to change the URL without changing the UI router state
    eventBus.on('$stateChangeStart', function (event) {
        if (preventStateChange) {                               // while we are switching URL, don't allow state change
            event.preventDefault();
        }
    });

    // whenevever state has successfully changed, make sure scroll to the top
    eventBus.on('$stateChangeSuccess', function () {
        $window.scrollTo(0, 0);
    });

    eventBus.on('$locationChangeStart', function (event) {
        if (preventStateChange) {                               // while we are switcing URL
            if (preventLocationChange) {                        // if we are suppossed to prevent a location change
                event.preventDefault();                         // prevent the change
                preventLocationChange = false;                  // set to false to goes back to normal now
            }
            else {
                preventLocationChange = true;                   // first URL change is the one we want, after this, we prevent URL change
            }
        }
        else {
            preventLocationChange = false;
        }
    });

    // expose function
    return {
        goToUrl: goToUrl,
        switchUrl: switchUrl,
        getQueryParams: getQueryParams,
        removeQueryParams: removeQueryParams,
        saveBrowserState: saveBrowserState,
        getCurrentUrl: getCurrentUrl,
        getUserAgent: getUserAgent
    };
}]);
/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/16/14
 *
 * Load given set of states into the UI router $stateProvider
 */
angular.module('pancakesAngular').provider('stateLoader', function () {

    var stateCounter = 0;

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
     * @param appName
     * @param routes
     * @param resolves
     * @param isMobile
     */
    this.loadStates = function loadStates($stateProvider, appName, routes, resolves, isMobile) {
        var stateNames = {};
        angular.forEach(routes, function (route) {
            angular.forEach(route.urls, function (url, idx) {
                var sideview = route.sideview || 'default';
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
                    data: route.data,
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
                if (route.data) {
                    stateConfig.data = route.data;
                }
                if (route.ads) {
                    stateConfig.data = stateConfig.data || {};
                    stateConfig.data.ads = route.ads;
                }

                //TODO: need to have better way of not including sideview
                if (!isMobile) {
                    stateConfig.views.sideview = {
                        controller:     getPascalCase(appName + '.sideview.' + sideview + '.ctrl'),
                        templateUrl:    'templates/' + appName + '.sideview.' + sideview
                    };
                }

                // need to make sure state names, so add a number if nothing else
                if (stateNames[stateName]) {
                    stateName += stateCounter;
                    stateCounter++;
                }
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
 * Date: 2/27/15
 *
 * This is used to store stuff in localStorage and cookies at same time
 */
angular.module('pancakesAngular').factory('storage', ["_", "extlibs", "config", "$cookies", function (_, extlibs, config, $cookies) {
    var localStorage = extlibs.get('localStorage');
    var cookieDomain = config.cookieDomain;

    /* eslint no-empty:0 */

    /**
     * Remove a value from localStorage and cookies
     * @param name
     */
    function remove(name) {

        if (localStorage) {
            try {
                localStorage.removeItem(name);
            }
            catch (ex) {}
        }

        _.isFunction($cookies.remove) ?
            $cookies.remove(name, { domain: cookieDomain }) :
            $cookies[name] = null;
    }

    /**
     * Set a value in both localStorage and cookies
     * @param name
     * @param value
     */
    function set(name, value) {

        // if no value then remove
        if (!value) {
            remove(name);
            return;
        }

        if (localStorage) {
            try {
                localStorage.setItem(name, value);
            }
            catch (ex) {}
        }

        _.isFunction($cookies.put) ?
            $cookies.put(name, value, { domain: cookieDomain }) :
            $cookies[name] = value;

    }

    /**
     * First check cookie; if not present, however, check local storage
     * @param name
     */
    function get(name) {
        var value = (_.isFunction($cookies.get) ? $cookies.get(name) : $cookies[name]);

        if (!value && localStorage) {

            try {
                value = localStorage.getItem(name);
            }
            catch (ex) {}

            if (value) {
                set(name, value);
            }
        }

        return value;
    }

    return {
        set: set,
        get: get,
        remove: remove
    };
}]);

/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Tracking for taps used by the tap directive. We need this in order to maintain
 * one source of truth across the entire web app as to the status of the tap.
 * This allows us to create events off touch instead of the 300ms delay for click
 * events.
 */
angular.module('pancakesAngular').factory('tapTrack', ["$timeout", function ($timeout) {

    // keep track of state of the tap with this boolean
    var inProgress = false;

    /**
     * Do the actual tap
     * @param scope
     * @param elem
     * @param preventDefault
     * @param action
     */
    function bind(scope, elem, preventDefault, action) {
        var tapped = false;

        // Attempt to do the action as long as tap not already in progress
        var doAction = function () {
            if (tapped && !inProgress) {

                // we are going to start the tap, don't allow another tap for 500 ms
                inProgress = true;
                $timeout(function () {
                    inProgress = false;
                }, 500);

                // do the action
                scope.$apply(action);
            }
            else {
                tapped = false;
            }
        };

        elem.bind('click', function (event) {                           // click event normal
            tapped = true;
            doAction();
            if (preventDefault) { event.preventDefault(); }
        });
        elem.bind('touchstart', function () { tapped = true; });        // start tap
        elem.bind('touchend', function (event) {                        // end tap and do the action
            doAction();
            if (preventDefault) { event.preventDefault(); }
        });
        elem.bind('touchmove', function (event) {                       // if move, then cancel tap
            tapped = false;
            return event.stopImmediatePropagation();
        });
    }

    // expose functions
    return {
        bind: bind
    };
}]);
/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * This has utilities that are used to help work with generated
 * template code
 */
angular.module('pancakesAngular').factory('tplHelper', ["$q", "$injector", "config", "pageSettings", "eventBus", function ($q, $injector, config, pageSettings, eventBus) {

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
        var opts = scope.presets || (scope.item && scope.item.type && presets[scope.item.type]) || presets[scope.preset] ||
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
        if (!fnOrObj) { return true; }
        directiveScope = directiveScope || {};

        // return true in case expecting a promise
        var formerRemodel = function () { return true; };
        if (scope.remodel) {
            formerRemodel = scope.remodel;
        }

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

                    return $q.when($injector.invoke(fnOrObj, null, locals))
                        .then(function (model) {
                            angular.forEach(model, function (modelVal, modelName) {
                                if (directiveScope[modelName]) {
                                    throw new Error(ctrlName + ' model() should not return ' + modelName + ' from the parent scope');
                                }

                                scope[modelName] = modelVal;
                            });
                            //return true;
                            return formerRemodel();
                        });
                }
                // else it should be an object so loop through
                else {
                    var updates = [];
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

                            updates.push($q.when($injector.invoke(val, null, locals))
                                .then(function (model) {
                                    scope[name] = model;
                                    return model;
                                }));
                        }
                        // else just set the value on scope[name]
                        else {
                            updates.push($q.when(scope[name] = val));  // think we can just do this instead of larger wrapper
                        }
                    });
                    return $q.all(updates).then(function () {
                        return formerRemodel();
                    });
                }

            }
            catch (ex) {
                /* eslint no-console:0 */
                console.log(ctrlName + ' has err ');
                throw ex;
            }
        };

        // for partials, we want to remodel right away
        return isPartial ? scope.remodel() : true;
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
                handler = generateScopeChangeHandler(cb, watchers);
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
            return $q.when(remodel(scope))
                .then(function () {
                    return scope.rerenderComponent();
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
                for (i = 0; i < fns.length; i++) {
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
}]);