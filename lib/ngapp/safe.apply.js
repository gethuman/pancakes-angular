/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Don't apply if already digest cycle in process
 */
angular.module('pancakesAngular').factory('safeApply', function ($rootScope) {
    return function safeApply(fn, scope) {
        scope = scope || $rootScope;

        var phase = scope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof fn === 'function')) {
                fn();
            }
        }
        else {
            scope.$apply(fn);
        }
    };
});
