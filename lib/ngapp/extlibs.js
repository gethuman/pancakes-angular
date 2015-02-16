/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Simple wrapper for getting external libraries outside Angular
 * from the client
 */
angular.module('pancakesAngular').factory('extlibs', function ($window) {

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
});