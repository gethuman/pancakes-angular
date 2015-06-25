/**
 * Author: Jeff Whelpley
 * Date: 2/27/15
 *
 * This is used to store stuff in localStorage and cookies at same time
 */
angular.module('pancakesAngular').factory('storage', function (_, extlibs, config, $cookies) {
    var localStorage = extlibs.get('localStorage');
    var cookieDomain = config.cookieDomain;

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

        localStorage.setItem(name, value);

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

        if (!value) {
            value = localStorage.getItem(name);
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
});
