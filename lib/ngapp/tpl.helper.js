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
     * This is used to re-render the model (wrapped in a fn so we can pass into watch and eventBus)
     *
     * @param scope
     * @param fn
     */
    function computeModelFn(scope, fn) {
        if (!fn) { return; }

        var computeModel = $injector.invoke(fn);
        scope.recomputeModel = function () { computeModel(scope); };
        scope.recomputeModel();
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
     * Create the render model function, execute it and set up
     * watchers for when it should be re-rendered.
     *
     * @param scope
     * @param scopeWatchers
     */
    function rerenderOnWatch(scope, scopeWatchers) {
        var i, watchExp;

        // set up the watchers if they exist
        if (scopeWatchers) {
            for (i = 0; i < scopeWatchers.length; i++) {
                watchExp = scopeWatchers[i];
                scope.$watch(watchExp, scope.recomputeModel);
            }
        }
    }

    /**
     * Create the render model function, execute it and set up
     * watchers for when it should be re-rendered.
     *
     * @param scope
     * @param eventWatchers
     */
    function rerenderOnEvent(scope, eventWatchers) {
        var i, eventName;
        var fns = [];  // these will hold callbacks for removing listeners

        // set up the watchers if they exist
        if (eventWatchers) {
            for (i = 0; i < eventWatchers.length; i++) {
                eventName = eventWatchers[i];
                fns.push(eventBus.on(eventName, scope.recomputeModel));
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
        computeModelFn: computeModelFn,
        addValidations: addValidations,
        attachToScope: attachToScope,
        rerenderOnWatch: rerenderOnWatch,
        rerenderOnEvent: rerenderOnEvent,
        addInitModel: addInitModel,
        registerListeners: registerListeners,
        addEventHandlers: addEventHandlers
    };
});