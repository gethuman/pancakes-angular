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
        /*
        this[funcName] = function (appName, routeName, opts) {
            return handler(opts);
        };
        */

        if ( !this[funcName] ) {
            this[funcName] = function (appName, routeName, opts) {
                return apps[appName][routeName][funcName](opts);
            };
        }

    };

    return pageHelper;
});
