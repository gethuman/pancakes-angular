/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Don't apply if already digest cycle in process
 */
angular.module('pancakesAngular').factory('safeApply', function ($timeout) {
    return function safeApply(fn) {
        //scope = scope || $rootScope;

        $timeout(fn, 0);

        //var phase = scope.$$phase;
        //if (phase === '$apply' || phase === '$digest') {
        //    if (fn && (typeof fn === 'function')) {
        //        fn();
        //    }
        //}
        //else {
        //    scope.$apply(fn);
        //}
    };
});
