/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * This has utilities that are used to help work with generated
 * template code
 */
angular.module('pancakesAngular').factory('tplHelper', function ($q, $injector, pageSettings, eventBus) {

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
     * simply modify the model. Also, for partials, we want to call the rebind
     * right away, but for pages it has already been called by the UI router.
     *
     * @param scope
     * @param isPage
     * @param fn
     */
    function generateRebind(scope, isPage, fn) {
        if (!fn) { return; }

        if (isPage) {
            scope.rebindModel = function () {
                return $q.when($injector.invoke(fn))
                    .then(function (model) {
                        return angular.extend(scope, model);
                    });
            };
        }
        else {
            var computeModel = $injector.invoke(fn);
            scope.rebindModel = function () {
                computeModel(scope);
                return scope;
            };
            scope.rebindModel();
        }
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
     * rebinding fn exists).
     *
     * @param scope
     * @returns {Function}
     */
    function generateRerenderCallback(scope) {
        return function () {
            var rebindModel = scope.rebindModel || function () { return true; };
            $q.when(rebindModel(scope))
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
    function rebindOnScopeChange(scope, watchers) {
        return doOnScopeChange(scope, watchers, scope.rebindModel);
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
    function rebindOnEvent(scope, events) {
        return doOnEvent(scope, events, scope.rebindModel);
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
        generateRerender: generateRerender,
        generateRebind: generateRebind,
        addValidations: addValidations,
        attachToScope: attachToScope,
        generateRerenderCallback: generateRerenderCallback,
        rerenderOnScopeChange: rerenderOnScopeChange,
        rerenderOnEvent: rerenderOnEvent,
        rebindOnScopeChange: rebindOnScopeChange,
        rebindOnEvent: rebindOnEvent,
        generateScopeChangeHandler: generateScopeChangeHandler,
        doOnScopeChange: doOnScopeChange,
        doOnEvent: doOnEvent,
        addInitModel: addInitModel,
        registerListeners: registerListeners,
        addEventHandlers: addEventHandlers
    };
});