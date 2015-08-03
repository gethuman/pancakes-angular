/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Tracking for taps used by the tap directive. We need this in order to maintain
 * one source of truth across the entire web app as to the status of the tap.
 * This allows us to create events off touch instead of the 300ms delay for click
 * events.
 */
angular.module('pancakesAngular').factory('tapTrack', function ($timeout) {

    // we want to prevent mistake double taps
    var lastElemTapped = null;
    var lastTapTime = (new Date()).getTime();

    /**
     * Do the actual tap
     * @param scope
     * @param elem
     * @param preventDefault
     * @param action
     */
    function bind(scope, elem, preventDefault, action) {
        var tapped = false;

        // Attempt to do the action as long as tap not already in progress
        function doAction() {
            var now = (new Date()).getTime();
            var diff = now - lastTapTime;
            var diffElemSafeDelay = elem !== lastElemTapped && diff > 200;
            var sameElemSafeDelay = elem === lastElemTapped && diff > 2000;

            if (tapped && (diffElemSafeDelay || sameElemSafeDelay)) {
                lastElemTapped = elem;
                lastTapTime = now;
                scope.$apply(action);
            }

            // reset tapped at end
            tapped = false;
        }

        elem.bind('click', function (event) {                           // click event normal
            tapped = true;
            doAction();
            if (preventDefault) { event.preventDefault(); }
        });
        elem.bind('touchstart', function () { tapped = true; });        // start tap
        elem.bind('touchend', function (event) {                        // end tap and do the action
            doAction();
            if (preventDefault) { event.preventDefault(); }
        });
        elem.bind('touchmove', function (event) {                       // if move, then cancel tap
            tapped = false;
            return event.stopImmediatePropagation();
        });
    }

    // expose functions
    return {
        bind: bind
    };
});