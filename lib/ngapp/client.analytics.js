/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Track stats to google analytics upon state changes
 */
angular.module('pancakesAngular').factory('clientAnalytics', function ($window, $location, eventBus) {

    /**
     * Sent to google using the _gaq object that should be loaded on the window
     */
    function captureCurrentPath() {
        var gaq = $window._gaq || [];
        gaq.push(['_trackPageview', $location.absUrl()]);
    }

    // add event handler if the gaq object exists on the window
    if ($window._gaq) {
        eventBus.on('$stateChangeSuccess', function () {
            captureCurrentPath();
        });
    }

    // expose the function for testing purposes
    return {
        captureCurrentPath: captureCurrentPath
    };
});