/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * This module will get the query params and raise an event for any notifications
 */
angular.module('pancakesAngular').factory('queryParams', function (_, $timeout, $location, eventBus, stateHelper) {
    var params = {};

    eventBus.on('$locationChangeSuccess', function () {

        var url = $location.url();
        var idx = url.indexOf('?');

        // if there is a query string
        if (idx < 0) { return; }

        // get the query string and split the keyvals
        var query = url.substring(idx + 1);
        var keyVals = query.split('&');

        // put each key/val into the params object
        _.each(keyVals, function (keyVal) {
            var keyValArr = keyVal.split('=');
            params[keyValArr[0]] = keyValArr[1];
        });

        // timeout for 500ms to allow angular to load the page as normal
        $timeout(function modParams() {

            // remove the query params
            stateHelper.removeQueryParams();

            // if there is a notify param, emit it so the notify service can display it
            if (params.notify) { eventBus.emit('notify', params.notify); }
        }, 500);
    });

    return params;
});