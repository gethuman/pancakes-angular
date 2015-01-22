/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * This task is to run karma tests on angular code
 */
var _       = require('lodash');
var karma   = require('karma').server;
var ngCode  = ['node_modules/angular/angular.js', 'node_modules/angular-mocks/angular-mocks.js'];

module.exports = function (gulp, opts) {
    var browser         = [].concat(opts.browser || 'PhantomJS');
    var reporter        = [].concat(opts.reporter || 'progress');
    var useTestCoverage = opts.cov;
    var useWatch        = opts.watch;
    var karmaTargetCode = [].concat(opts.karmaTargetCode || []);
    var karmaTestCode   = opts.karmaTestCode || 'test/karma/**/*.js';
    var karmaCode       = [].concat(ngCode, karmaTargetCode, karmaTestCode);

    if (!karmaTargetCode.length) {
        throw new Error('Karma tests require karmaTargetCode param in batter.whip()');
    }

    var karmaConfig = {
        port:               9201,
        runnerPort:         9301,
        captureTimeout:     20000,
        growl:              true,
        colors:             true,
        browsers:           browser,
        reporters:          reporter,
        frameworks:         ['jquery-2.1.0', 'mocha', 'sinon-chai'],
        preprocessors:      {},
        coverageReporter:   { type: 'text-summary', dir: 'test/coverage/' },
        files:              karmaCode,
        singleRun:          !useWatch,
        autoWatch:          useWatch
    };

    // add coverage reporter and preprocessor if karam
    if (useTestCoverage) {
        karmaConfig.reporters.push('coverage');

        _.each(karmaTargetCode, function (code) {
            karmaConfig.preprocessors[code] = 'coverage';
        });
    }

    return function (done) {
        karma.start(karmaConfig, function () { done(); });
    };
};