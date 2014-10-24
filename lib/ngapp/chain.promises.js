/**
 * Author: Jeff Whelpley
 * Date: 10/24/14
 *
 * Client side implementation of pancakes.utensils.chainPromises()
 */
angular.module('pancakesAngular').factory('chainPromises', function () {
    return function chainPromises(calls, val) {
        if (!calls || !calls.length) { return Q.when(val); }
        return calls.reduce(Q.when, Q.when(val));
    };
});