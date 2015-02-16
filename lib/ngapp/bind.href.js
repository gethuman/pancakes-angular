/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Simple utility for the href directives to utilize
 */
angular.module('pancakesAngular').factory('bindHref', function (tapTrack, stateHelper) {

    return function bind(scope, elem, attrs, value) {
        var name = elem.length && elem[0].localName;

        // if an a tag, then just set the href attribute
        if (name === 'a') {
            attrs.$set('href', value, scope);
        }
        // else we are doing a client side gh-tap
        else {
            tapTrack.bind(scope, elem, true, function () {
                stateHelper.goToUrl(value);
            });
        }
    };
});