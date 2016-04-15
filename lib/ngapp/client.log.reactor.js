/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Listens for log events and sends them to the console
 */
angular.module('pancakesAngular').factory('clientLogReactor',
    function (_, extlibs, eventBus, config) {

        config = config || {};

        // var errorClient = extlibs.get('NREUM');
        var useConsole = config.logTransport && config.logTransport.indexOf('console') >= 0;
        // var useRemote = errorClient && config.logTransport && config.logTransport.indexOf('remote') >= 0;
        var logLevel = config.logLevel || 'error';

        // log to console and to new relic
        function log(event, logData) {
            logData = logData || {};
            // var status = logData.status || 0;
            // var statusOkToLogRemote = status < 400 || status > 498;

            if (useConsole) {
                /* eslint no-console:0 */
                console.log(logData);
            }

            // log remotely if non-AppError error and remote is active
            // if (useRemote && logData.msg && statusOkToLogRemote) {
            //     errorClient.noticeError(new Error(logData.msg));
            // }
        }

        /******* INIT API & EVENT HANDLERS ********/

        if (logLevel === 'error') {
            eventBus.on('log.error',    log);
            eventBus.on('log.critical', log);
            eventBus.on('error.api',    log);
        }
        else if (logLevel === 'info') {
            eventBus.on('log.info',     log);
            eventBus.on('log.error',    log);
            eventBus.on('log.critical', log);
            eventBus.on('error.api',    log);
        }
        else if (logLevel === 'debug') {
            eventBus.on('log.debug',    log);
            eventBus.on('log.info',     log);
            eventBus.on('log.error',    log);
            eventBus.on('log.critical', log);
            eventBus.on('error.api',    log);
        }


        // make sure we log any state change errors (only applies to client side)
        eventBus.on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, err) {
            log(event, {
                err: err,
                msg: 'state change error from ' + JSON.stringify(fromState) + ' to ' +
                        JSON.stringify(toState) + ' with error: ' + err + ' ' + JSON.stringify(err),
                stack: err && err.stack,
                inner: err && err.inner
            });
        });

        // functions to expose (only for testing purposes)
        return {
            log: log
        };
    }
);