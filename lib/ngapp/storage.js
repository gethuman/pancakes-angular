/**
 * Author: Jeff Whelpley
 * Date: 2/27/15
 *
 * This is used to store stuff in localStorage and cookies at same time
 */
angular.module('pancakesAngular').factory('storage', function (extlibs, config) {
    var localStorage = extlibs.get('localStorage');
    var cookieDomain = config.cookieDomain;
    var document = window.document;

    /**
     * Set a cookie value
     * @param name
     * @param value
     * @param domain
     * @returns {boolean}
     */
    function setCookie(name, value, domain) {
        if (!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name)) { return false; }

        // infinity
        var expires = "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
        var path = '/';
        var isSecure = false;

        document.cookie = encodeURIComponent(name) +
            "=" + encodeURIComponent(value) + expires +
            (domain ? "; domain=" + domain : "") +
            (path ? "; path=" + path : "") +
            (isSecure ? "; secure" : "");
    }

    /**
     * Set a value in both localStorage and cookies
     * @param name
     * @param value
     */
    function set(name, value) {
        localStorage.setItem(name, value);
        setCookie(name, value, cookieDomain);
    }

    /**
     * Helper function to get a cookie
     * @param name
     * @returns {*}
     */
    function getCookie(name) {
        if (!name) { return null; }
        return decodeURIComponent(
                document.cookie.replace(
                    new RegExp("(?:(?:^|.*;)\\s*" +
                    encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") +
                    "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1"
                )
            ) || null;
    }

    /**
     * Get a value. This will first check localStorage. If doesn't
     * exist there, then will check cookies
     * @param name
     */
    function get(name) {
        return localStorage.getItem(name) || getCookie(name);
    }

    /**
     * Check to see if a cookie exists
     * @param name
     * @returns {boolean}
     */
    //function cookieExists(name) {
    //    if (!name) { return false; }
    //    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    //}

    /**
     * Remove a cookie
     * @param name
     * @param domain
     * @returns {boolean}
     */
    function removeCookie(name, domain) {
        //if (!cookieExists(name)) { return false; }

        var path = '/';
        document.cookie = encodeURIComponent(name) +
            "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
            (domain ? "; domain=" + domain : "") +
            (path ? "; path=" + path : "");
    }

    /**
     * Remove a value from localStorage and cookies
     * @param name
     */
    function remove(name) {
        localStorage.removeItem(name);
        removeCookie(name, cookieDomain);
    }

    return {
        setCookie: setCookie,
        set: set,
        getCookie: getCookie,
        get: get,
        removeCookie: removeCookie,
        remove: remove
    };
});
