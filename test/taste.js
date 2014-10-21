/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 2/10/14
 *
 * This is a wrapper for all libs needed for testing
 */
var Q               = require('q');
var sinon           = require('sinon');
var chai            = require('chai');
var sinonChai       = require('sinon-chai');
var chaiAsPromised  = require('chai-as-promised');
var path            = require('path');
var pancakes        = require('pancakes');
var jshint          = require('jshint').JSHINT;
var prettyjson      = require('prettyjson');

chai.use(sinonChai);
chai.use(chaiAsPromised);

pancakes.init({
    preload:        ['utils'],
    rootDir:        __dirname + '/fixtures',
    require:        require,
    container:      'webserver',
    clientPlugin: {
        init:           function () {},
        renderPage:     function () {}
    },
    serverPlugin: {
        init:           function () {},
        addApiRoutes:   function () {},
        addWebRoutes:   function () {}
    },
    adapterMap:     {}
});

/**
 * Used to wrap all promises
 * @param promises
 * @param done Optional param if it exists, will do notify at end
 * @returns {*|Promise.<Array.<Object>>}
 */
function all(promises, done) {
    return done ? Q.all(promises).should.notify(done) : Q.all(promises);
}

/**
 * Shorthand for just making sure a promise eventually equals a value
 * @param promise
 * @param expected
 * @param done
 */
function eventuallySame(promise, expected, done) {
    all([
        promise.should.be.fulfilled,
        promise.should.eventually.deep.equal(expected)
    ], done);
}

/**
 * Require the target
 * @param relativePath
 * @returns {*}
 */
function target(relativePath) {
    return require('../lib/' + relativePath);
}

/**
 * eval code with a mock angular object
 * @param code
 */
function validateCode(code) {
    var success = jshint(code);

    if (!success) {
        console.log('\n\nerror with the following generated code:\n\n' + code + '\n');
        console.log('JSHINT ERRORS\n' + prettyjson.render(jshint.errors));
    }

    return success;
}

module.exports = {
    all: all,
    eventuallySame: eventuallySame,
    target: target,
    validateCode: validateCode,

    fixturesDir: __dirname + '/fixtures',
    delim: path.normalize('/'),

    spy:    sinon.spy,
    expect: chai.expect,
    should: chai.should()
};




