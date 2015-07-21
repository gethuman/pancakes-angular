/**
 * Author: Jeff Whelpley
 * Date: 2/16/15
 *
 * Listens for log events and sends them to the console
 */
angular.module('pancakesAngular').factory('clientLogReactor', function (extlibs, eventBus, config, stateHelper, activeUser) {
    config = config || {};

    var raven = extlibs.get('Raven');
    var useConsole = config.logTransport && config.logTransport.indexOf('console') >= 0;
    var useRemote = raven && config.logTransport && config.logTransport.indexOf('remote') >= 0;

    if (raven && raven.config) {
        raven.config(config.errorUrl, {}).install();
    }

    /**
     * Send log to the console
     * @param event
     * @param logData
     */
    function log(event, logData) {
        if (useConsole) {
            /* eslint no-console:0 */
            console.log(logData + ' || ' + JSON.stringify(logData));
        }

        if (useRemote) {
            var err = logData.err;
            delete logData.err;

            logData.url = stateHelper.getCurrentUrl();
            logData.userId = activeUser._id;
            logData.username = activeUser.username;

            err ?
                raven.captureException(err, { extra: logData }) :
                angular.isString(logData) ?
                    raven.captureMessage('msg1=' + logData, { extra: logData }) :
                    logData.msg ?
                        raven.captureMessage('msg2=' + logData.msg, { extra: logData }) :
                        raven.captureMessage('msg3=' + JSON.stringify(logData), { extra: logData });

        }
    }

    /******* INIT API & EVENT HANDLERS ********/

    eventBus.on('log.debug',    log);
    eventBus.on('log.info',     log);
    eventBus.on('log.error',    log);
    eventBus.on('log.critical', log);
    eventBus.on('error.api',    log);

    // make sure we log any state change errors (only applies to client side)
    eventBus.on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, err) {
        eventBus.emit('log.error', {
            err: err,
            msg: err + '',
            stack: err && err.stack,
            inner: err && err.inner
        });
    });

    // functions to expose (only for testing purposes)
    return {
        log: log
    };
});