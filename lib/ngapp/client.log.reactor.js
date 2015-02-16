/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Listens for log events and sends them to the console
 */
angular.module('pancakesAngular').factory('clientLogReactor', function (eventBus) {

    /**
     * Send log to the console
     * @param event
     * @param logData
     */
    function logToConsole(event, logData) {
        console.log(logData + ' || ' + JSON.stringify(logData));
    }

    /******* INIT API & EVENT HANDLERS ********/

    eventBus.on('log.debug', logToConsole);              // listen for the log events
    eventBus.on('log.info', logToConsole);
    eventBus.on('log.error', logToConsole);
    eventBus.on('log.critical', logToConsole);
    eventBus.on('error.api', logToConsole);

    // make sure we log any state change errors (only applies to client side)
    eventBus.on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, err) {
        logToConsole({}, 'State change error: ' + err.stack);
    });

    // functions to expose
    return {
        logToConsole: logToConsole
    };
});