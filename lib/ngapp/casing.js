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

        _.each(delims, function (delim) {
            var codeParts = str.split(delim);
            var i, codePart;

            for (i = 1; i < codeParts.length; i++) {
                codePart = codeParts[i];
                codeParts[i] = codePart.substring(0, 1).toUpperCase() + codePart.substring(1);
            }

            str = codeParts.join('');
        });

        return str;
    }

    // expose functions
    return {
        camelCase: camelCase
    };
});