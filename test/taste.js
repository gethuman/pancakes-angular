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
var fs              = require('fs');
var dot             = require('dot');

// universally set strip to false for dot templates (i.e. respect whitespace)
dot.templateSettings.strip = false;

chai.use(sinonChai);
chai.use(chaiAsPromised);

pancakes.init({
    preload:        ['utils'],
    rootDir:        __dirname + '/fixtures',
    require:        require,
    container:      'webserver',
    componentPrefix:'gh',
    clientPlugin:   function () {},
    serverPlugin:   function () {},
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
function eventuallyEqual(promise, expected, done) {
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
function validateCode(code, isRaw) {
    var success = isRaw ?
        jshint('var blah = ' + code + ';') :
        jshint(code);

    if (!success) {
        console.log('\n\nerror with the following generated code:\n\n' + code + '\n');
        console.log('JSHINT ERRORS\n' + prettyjson.render(jshint.errors));
    }

    return success;
}

/**
 * Get a dot template
 * @param name
 * @returns {*}
 */
function getTemplate(name) {
    var filePath = __dirname + '/../lib/transformers/ng.' + name + '.template';
    var file = fs.readFileSync(path.normalize(filePath));
    return dot.template(file);
}

module.exports = {
    all: all,
    eventuallyEqual: eventuallyEqual,
    target: target,
    validateCode: validateCode,
    getTemplate: getTemplate,

    fixturesDir: __dirname + '/fixtures',
    delim: path.normalize('/'),

    spy:    sinon.spy,
    expect: chai.expect,
    should: chai.should()
};




