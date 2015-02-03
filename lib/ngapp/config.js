/**
 * Author: Jeff Whelpley
 * Date: 10/15/14
 *
 * This module should be overridden by the app
 */
angular.module('pancakesAngular').factory('config', function () {
    return {
        staticFiles: {
            assets: '/'
        }
    };
});