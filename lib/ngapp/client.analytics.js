/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Track stats to google analytics upon state changes
 */
angular.module('pancakesAngular').factory('clientAnalytics', function ($window, $location, eventBus) {

    var tripwire = false;

    /**
     * Sent to google using the _gaq object that should be loaded on the window
     */
    function captureCurrentPath() {
        if (tripwire ) {
            $window.ga('send', 'pageview', $location.path());
        }
        else {
            tripwire = true; // just don't record the first one- it was already recorded in the head script
        }
    }

    // add event handler if the gaq object exists on the window
    if ($window.ga) {
        eventBus.on('$stateChangeSuccess', captureCurrentPath);
    }

    // expose the function for testing purposes
    return {
        captureCurrentPath: captureCurrentPath
    };
});