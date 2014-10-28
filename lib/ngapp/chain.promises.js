/**
 * Author: Jeff Whelpley
 * Date: 10/24/14
 *
 * Client side implementation of pancakes.utensils.chainPromises()
 */
angular.module('pancakesAngular').factory('chainPromises', function ($q) {
    return function chainPromises(calls, val) {
        if (!calls || !calls.length) { return $q.when(val); }
        return calls.reduce($q.when, $q.when(val));
    };
});