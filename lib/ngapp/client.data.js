/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Initial client data thta is in the DOM
 */
angular.module('pancakesAngular').factory('clientData', function ($window) {
    var clientData = $window.clientData || {};

    /**
     * Get some data from the DOM clientData object
     * @param name
     * @returns {*}
     */
    function get(name) {
        return clientData[name];
    }

    // expose get
    return {
        get: get
    };
});
