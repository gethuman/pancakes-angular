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

    // keep track of state of the tap with this boolean
    var inProgress = false;

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
        var doAction = function () {
            if (tapped && !inProgress) {

                // we are going to start the tap, don't allow another tap for 500 ms
                inProgress = true;
                $timeout(function () {
                    inProgress = false;
                }, 500);

                // do the action
                scope.$apply(action);
            }
            else {
                tapped = false;
            }
        };

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