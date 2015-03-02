/**
 * Author: Jeff Whelpley
 * Date: 2/27/15
 *
 * This is used to store stuff in localStorage and cookies at same time
 */
angular.module('pancakesAngular').factory('storage', function (extlibs, $cookies) {
    var localStorage = extlibs.get('localStorage');

    /**
     * Set a value in both localStorage and cookies
     * @param name
     * @param value
     */
    function set(name, value) {
        localStorage.setItem(name, value);
        $cookies[name] = value;
    }

    /**
     * Get a value. This will first check localStorage. If doesn't
     * exist there, then will check cookies
     * @param name
     */
    function get(name) {
        return localStorage.getItem(name) || $cookies[name];
    }

    /**
     * Remove a value from localStorage and cookies
     * @param name
     */
    function remove(name) {
        localStorage.removeItem(name);
        window.document.cookie = name + '=; path=/; domain=.gethuman.com; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    }

    return {
        set: set,
        get: get,
        remove: remove
    };
});
