/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Listens for log events and sends them to the console
 */
angular.module('pancakesAngular').factory('clientLogReactor',
    function (_, extlibs, eventBus, config, stateHelper, activeUser, storage) {

        config = config || {};

        var raven = extlibs.get('Raven');
        var useConsole = config.logTransport && config.logTransport.indexOf('console') >= 0;
        var useRemote = raven && config.logTransport && config.logTransport.indexOf('remote') >= 0;
        var logLevel = config.logLevel || 'error';

        if (raven && raven.config) {
            raven.config(config.errorUrl, {}).install();
        }

        /* eslint no-console:0 */

        /**
         * Send log to the console
         * @param event
         * @param logData
         */
        function log(event, logData) {
            if (useConsole) {
                console.log(logData);
            }

            if (useRemote) {
                var err = logData.err;
                delete logData.err;

                if (angular.isString(logData)) {
                    var msg = logData;
                    logData = {};
                    logData.msg = msg;
                }

                logData.url = stateHelper.getCurrentUrl();
                logData.userId = activeUser._id;
                logData.username = activeUser.username;
                logData.lastApiCall = storage.get('lastApiCall');

                err ?
                    raven.captureException(err, { extra: logData }) :
                    logData.msg ?
                        raven.captureMessage(logData.msg, { extra: logData }) :
                        raven.captureMessage(JSON.stringify(logData), { extra: logData });

            }
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
                msg: 'state change error from ' + fromState + ' to ' + toState + ' with error: ' + err + '',
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