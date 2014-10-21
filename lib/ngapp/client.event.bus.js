/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/22/14
 *
 * Client side event bus is essentially an isolated scope that
 * has been enhanced with a couple convenience functions
 */
angular.module('pancakesAngular').factory('eventBus', function ($document, $rootScope) {

    // the event bus is a new isolated scope
    var eventBus = $rootScope.$new(true);
    eventBus.on = eventBus.$on;
    eventBus.watch = eventBus.$watch;

    /**
     * For emit, we want to make sure everyone sees it even
     * if they are just listening on a local scope so we broadcast
     * to the rootScope
     */
    eventBus.emit = function () {
        $rootScope.$broadcast.apply($rootScope, arguments);
    };

    /**
     * Bind an event to the root document
     * @param eventName
     * @param callback
     */
    eventBus.bindToDocument = function (eventName, callback) {
        $document.bind(eventName, callback);
    };

    return eventBus;
});
