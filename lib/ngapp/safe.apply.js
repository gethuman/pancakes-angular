/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Don't apply if already digest cycle in process
 */
angular.module('pancakesAngular').factory('safeApply', function ($rootScope) {
    return function safeApply(fn) {
        var phase = $rootScope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            $rootScope.$apply(fn);
        }
    };
});
