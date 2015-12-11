/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Listens for log events and sends them to the console
 */
angular.module('pancakesAngular').factory('clientLogReactor',
    function (_, extlibs, eventBus, config, stateHelper, activeUser, storage) {

        config = config || {};

        var errorClient = extlibs.get('Raven');
        var useConsole = config.logTransport && config.logTransport.indexOf('console') >= 0;
        var useRemote = errorClient && config.logTransport && config.logTransport.indexOf('remote') >= 0;
        var logLevel = config.logLevel || 'error';

        if (errorClient && errorClient.config) {
            errorClient.config(config.errorUrl, {}).install();
        }

        var ignoreErrs = [
            'SkypeClick2Call',
            'atomicFindClose',
            'Cannot access back end',
            'Cannot call method \'addListener\'',
            'getElementsByTagName(\'video\')',
            'Invalid character',
            'NPObject',
            'Unexpected token',
            'NS_ERROR_',
            'Failed to execute \'removeChild\' on \'Node\'',
            'Out of memory',
            'Error loading script',
            'Could not login with that username',
            'The email you entered is already registered'
        ];

        /* eslint no-console:0 */

        /**
         * Send log to the console
         * @param logData
         */
        function errorHandler(logData) {
            if (!logData) {
                return;
            }

            logData.msg = (logData.msg === 'undefined' || logData.msg === 'null') ? null : logData.msg;
            logData.err = (logData.err === 'undefined' || logData.err === 'null') ? null : logData.err;

            logData.yo = 'This is error: ' + logData.err + ' with msg ' + logData.msg;
            if (!(logData.err instanceof Error)) {
                delete logData.err;
            }

            if (!logData.msg && !logData.err) {
                return;
            }

            // extra data to help with debugging
            logData.msg = logData.msg || logData.message || logData.yo;
            logData.url = stateHelper.getCurrentUrl();
            logData.userId = activeUser._id;
            logData.username = activeUser.username;
            logData.lastApiCall = storage.get('lastApiCall');

            // jw: super hack to make sure ignore logs aren't sent to sentry
            var yo = (logData.yo || '') + '';
            var err = (logData.err || '') + '';
            var msg = (logData.msg || '') + '';
            for (var i = 0; i < ignoreErrs.length; i++) {
                if (yo.indexOf(ignoreErrs[i]) >= 0 ||
                    err.indexOf(ignoreErrs[i]) >= 0 ||
                    msg.indexOf(ignoreErrs[i]) >= 0) {

                    return;
                }
            }

            logData.err ?
                errorClient.captureException(logData.err, { extra: logData }) :
                errorClient.captureMessage(logData.msg, { extra: logData });
        }

        function log(event, logData) {
            if (useConsole) {
                console.log(logData);
            }

            if (useRemote && logData &&
                (!logData.level || logData.level === 'error' || logData.level === 'critical')) {

                errorHandler(logData);
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