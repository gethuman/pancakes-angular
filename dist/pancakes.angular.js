/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * The app definition for pancakes.angular
 */
angular.module('pancakesAngular', []);
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
        staticFileRoot: '/'
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

    var app = angular.module('pancakesAngular');
    var attrPascal, type;

    // function used for each of the generic directives
    function addDirective(directiveName, attrName, filterType, isBind, isBindOnce) {
        app.directive(directiveName, ['i18n', 'config', function (i18n, config) {
            return function (scope, element, attrs) {
                var originalValue = attrs[directiveName];

                // if we are binding to the attribute value
                if (isBind) {
                    var unwatch = scope.$watch(originalValue, function (value) {
                        if (value) {
                            value = filterType === 'file' ?
                                config.staticFileRoot + value :
                                i18n.translate(value);

                            attrName === 'text' ?
                                element.text(value) :
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
            };
        }]);
    }

    // loop through all generic directive attributes and add directives
    for (var attr in genericDirectives) {
        if (genericDirectives.hasOwnProperty(attr)) {
            attrPascal = attr.substring(0, 1).toUpperCase() + attr.substring(1);

            // everyone gets a binding directive
            addDirective('b' + attrPascal, attr, null, true, false);
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
angular.module('pancakesAngular').factory('tplHelper', function ($injector, pageSettings, eventBus) {

    /**
     * Given a set of default values, add them to the scope if
     * a value does not already exist.
     *
     * @param scope
     * @param defaults
     */
    function setDefaults(scope, defaults) {
        if (!defaults) { return; }

        for (var name in defaults) {
            if (defaults.hasOwnProperty(name) && scope[name] === undefined) {
                scope[name] = defaults[name];
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
     * Create the render model function, execute it and set up
     * watchers for when it should be re-rendered.
     *
     * @param scope
     * @param renderModelFn
     * @param scopeWatchers
     */
    function execRenderModel(scope, renderModelFn, scopeWatchers) {
        var renderModel = $injector.invoke(renderModelFn);
        renderModel(scope);

        function rerenderModel() {
            renderModel(scope);
        }

        if (scopeWatchers) {
            var i, watchExp;
            for (i = 0; i < scopeWatchers.length; i++) {
                watchExp = scopeWatchers[i];
                scope.$watch(watchExp, rerenderModel);
            }
        }
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

        // make sure handler is destroyed along with scope
        scope.$on('$destroy', function () {
            for (var i = 0; i < fns.length; i++) {
                fns[i]();
            }
        });
    }

    /**
     * Add the UI event handlers to the scope
     * @param scope
     * @param handlers
     */
    function addEventHandlers(scope, handlers) {
        if (!handlers) { return; }

        for (var name in handlers) {
            if (handlers.hasOwnProperty(name) && handlers[name]) {
                scope[name] = $injector.invoke(handlers[name]);
            }
        }
    }

    // expose functions
    return {
        setDefaults: setDefaults,
        attachToScope: attachToScope,
        execRenderModel: execRenderModel,
        addInitModel: addInitModel,
        registerListeners: registerListeners,
        addEventHandlers: addEventHandlers
    };
});