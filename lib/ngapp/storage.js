/**
 * Author: Jeff Whelpley
 * Date: 2/27/15
 *
 * This is used to store stuff in localStorage and cookies at same time
 */
angular.module('pancakesAngular').factory('storage', function (extlibs, config, $cookies) {
    var localStorage = extlibs.get('localStorage');
    var cookieDomain = config.security && config.security.cookie && config.security.cookie.domain;

    /**
     * Set a value in both localStorage and cookies
     * @param name
     * @param value
     */
    function set(name, value) {
        localStorage.setItem(name, value);
        $cookies.put(name, value, { domain: cookieDomain });
    }

    /**
     * Get a value. This will first check localStorage. If doesn't
     * exist there, then will check cookies
     * @param name
     */
    function get(name) {
        return localStorage.getItem(name) || $cookies.get(name);
    }

    /**
     * Remove a value from localStorage and cookies
     * @param name
     */
    function remove(name) {
        localStorage.removeItem(name);
        $cookies.remove(name, { domain: cookieDomain });
    }

    return {
        set: set,
        get: get,
        remove: remove
    };
});
