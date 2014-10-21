/**
 * Author: Jeff Whelpley
 * Date: 10/15/14
 *
 * Initial model that will be overwritten by the UI router resolve. Not every
 * page has a model() function, so this will be used as a default so the uipart
 * generator can safely put 'initialModel' in all page controllers
 */
angular.module('pancakesAngular').factory('initialModel', function () {
    return {};
});
