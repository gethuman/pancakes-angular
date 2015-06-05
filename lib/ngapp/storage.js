/**
 * Author: Jeff Whelpley
 * Date: 2/27/15
 *
 * This is used to store stuff in localStorage and cookies at same time
 */
angular.module('pancakesAngular').factory('storage', function (_, extlibs, config, $cookies) {
    var localStorage = extlibs.get('localStorage');
    var cookieDomain = config.security && config.security.cookie && config.security.cookie.domain;

    /**
     * Set a value in both localStorage and cookies
     * @param name
     * @param value
     */
    function set(name, value) {
        localStorage.setItem(name, value);

        _.isFunction($cookies.put) ?
            $cookies.put(name, value, { domain: cookieDomain }) :
            $cookies[name] = value;

    }

    /**
     * Get a value. This will first check localStorage. If doesn't
     * exist there, then will check cookies
     * @param name
     */
    function get(name) {
        return localStorage.getItem(name) ||
            _.isFunction($cookies.getItem) ? $cookies.get(name) : $cookies[name];
    }

    /**
     * Remove a value from localStorage and cookies
     * @param name
     */
    function remove(name) {
        localStorage.removeItem(name);

        _.isFunction($cookies.remove) ?
            $cookies.remove(name, { domain: cookieDomain }) :
            $cookies[name] = null;
    }

    return {
        set: set,
        get: get,
        remove: remove
    };
});
