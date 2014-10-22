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