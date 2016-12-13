/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * This client side service is used to help with state changes
 */
angular.module('pancakesAngular').factory('stateHelper', function ($window, $timeout, $location, _, eventBus) {
    var preventStateChange = false;
    var preventLocationChange = false;

    /**
     * Simply go to the url and allow the state to change
     * @param url
     */
    function goToUrl(url) {
        if (!url) { return; }

        if (_.isArray(url)) {
            url = url.join('/');
        }

        var hasHttp = url.indexOf('http') === 0;
        if (!hasHttp && url.indexOf('/') !== 0) {
            url = '/' + url;
        }

        hasHttp ? $window.location.href = url : $location.path(url);
    }

    /**
     * Change the URL to the slug for the given question
     * WITHOUT firing the state changed events
     * @param url
     */
    function switchUrl(url) {

        // state changing off and then remove the query string
        preventStateChange = true;
        $location.replace().url(url);

        // turn state changing back on after 200 ms
        $timeout(function () { preventStateChange = false; }, 200);
    }

    /**
     * Get params from the URL
     */
    function getQueryParams(params) {
        params = params || {};
        var url = $location.url();
        var idx = url.indexOf('?');

        // if there is a query string
        if (idx < 0) { return {}; }

        // get the query string and split the keyvals
        var query = url.substring(idx + 1);
        var keyVals = query.split('&');

        // put each key/val into the params object
        _.each(keyVals, function (keyVal) {
            var keyValArr = keyVal.split('=');
            params[keyValArr[0]] = keyValArr[1];
        });

        return params;
    }

    /**
     * Remove the query params from a page
     */
    function removeQueryParams() {
        switchUrl($location.path());

        //params = params || getQueryParams();
        //
        //if (!params.updated) {
        //    switchUrl($location.path());
        //}
    }

    /**
     * By adding updated query param, we let browser know state has changed
     */
    function saveBrowserState() {
        switchUrl($location.path() + '?updated=' + (new Date()).getTime());
    }

    /**
     * Get the current URL using the $location service
     * @returns {string}
     */
    function getCurrentUrl() {
        return $location.absUrl();
    }

    /**
     * Get just the part of the URL after the host name
     * @returns {*}
     */
    function getPath() {
        return $location.path();
    }

    /**
     * Get the current user agent
     */
    function getUserAgent() {
        return $window.navigator.userAgent;
    }

    // so, this is a total hack, but basically this com`bination of variables and
    // event handlers allows us to change the URL without changing the UI router state
    eventBus.on('$stateChangeStart', function (event) {
        if (preventStateChange) {                               // while we are switching URL, don't allow state change
            event.preventDefault();
        }
    });

    // whenevever state has successfully changed, make sure scroll to the top
    eventBus.on('$stateChangeSuccess', function () {
        $window.scrollTo(0, 0);
    });

    eventBus.on('$locationChangeStart', function (event) {
        if (preventStateChange) {                               // while we are switcing URL
            if (preventLocationChange) {                        // if we are suppossed to prevent a location change
                event.preventDefault();                         // prevent the change
                preventLocationChange = false;                  // set to false to goes back to normal now
            }
            else {
                preventLocationChange = true;                   // first URL change is the one we want, after this, we prevent URL change
            }
        }
        else {
            preventLocationChange = false;
        }
    });

    // expose function
    return {
        goToUrl: goToUrl,
        switchUrl: switchUrl,
        getQueryParams: getQueryParams,
        removeQueryParams: removeQueryParams,
        saveBrowserState: saveBrowserState,
        getPath: getPath,
        getCurrentUrl: getCurrentUrl,
        getUserAgent: getUserAgent
    };
});