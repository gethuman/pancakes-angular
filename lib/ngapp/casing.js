/**
 * Author: Jeff Whelpley
 * Date: 2/7/15
 *
 * Simple version of casing that can be overriden by other modules.
 * See casing in client specific project.
 */
angular.module('pancakesAngular').factory('casing', function () {
    var _ = angular;

    /**
     * Convert to camelCase
     * @param str
     * @param delim
     */
    function camelCase(str, delim) {
        var delims = delim || ['_', '.', '-'];

        if (!_.isArray(delims)) {
            delims = [delims];
        }

        _.each(delims, function (adelim) {
            var codeParts = str.split(adelim);
            var i, codePart;

            for (i = 1; i < codeParts.length; i++) {
                codePart = codeParts[i];
                codeParts[i] = codePart.substring(0, 1).toUpperCase() + codePart.substring(1);
            }

            str = codeParts.join('');
        });

        return str;
    }

    /**
     * Convert a dash string to dash Proper:
     * @param str
     */
    function dashProperCase(str) {
        if ( !str.length ) {
            return str;
        }
        return str.split('-').map(function (piece) {
            if ( piece.length ) {
                return piece.substring(0, 1).toUpperCase() + piece.substring(1);
            }
            return piece;
        }).join('-');
    }

    // expose functions
    return {
        camelCase: camelCase,
        dashProperCase: dashProperCase
    };
});