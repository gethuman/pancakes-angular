/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 1/27/14
 *
 * This is the config file for the Karma unit tests
 */
module.exports = function (config) {
    config.set({

        basePath:       '..',
        port:           9201,
        runnerPort:     9301,
        captureTimeout: 20000,
        growl:          true,
        colors:         true,
        logLevel:       config.LOG_INFO,
        browsers:       ['PhantomJS'],
        reporters:      ['progress', 'coverage'],
        frameworks:     ['mocha', 'sinon-chai'],
        preprocessors:  { 'lib/ngapp/**/*.js': 'coverage' },
        coverageReporter : {
            type: 'text-summary',
            dir: 'test/coverage/'
        }
    });
};