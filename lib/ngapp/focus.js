/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * A function that sets focus on a particular element
 */
angular.module('pancakesAngular').factory('focus', function ($timeout, extlibs) {
    var jQuery = extlibs.get('jQuery');

    /**
     * Set focus on an element
     * @param selector
     */
    function set(selector) {
        $timeout(function setFocus() {
            var el = jQuery(selector);
            if (el && el.length) {
                var len = el.val().length;
                el[0].focus();
                el[0].setSelectionRange(len, len);
            }
        }, 200);
    }

    /**
     * Blur an element
     * @param selector
     */
    function blur(selector) {
        $timeout(function blurFocus() {

            // fix for iOS
            if (document && document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }

            var el = jQuery(selector);
            if (el && el.length) {
                el[0].blur();
            }
        }, 100);
    }

    // expose functions
    return {
        set: set,
        blur: blur
    };
});
