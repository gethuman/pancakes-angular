/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'middleware/jng.utils';
var taste       = require('../../pancakes.angular.taste');
var jng         = taste.target(name);
var jangular    = require('jangular');
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var context = {
        pancakes: pancakes,
        jangular: jangular
    };

    _.extend(context, jng);

    describe('setDefaults()', function () {
        it('should set values on empty object', function () {
            var model = {};
            var defaults = { one: 'foo', two: 'choo' };
            jng.setDefaults.call(context, model, defaults);
            model.should.deep.equal(defaults);
        });

        it('should not overwrite value that already there', function () {
            var model = { one: 'zoo' };
            var defaults = { one: 'foo', two: 'choo' };
            var expected = { one: 'zoo', two: 'choo' };
            jng.setDefaults.call(context, model, defaults);
            model.should.deep.equal(expected);
        });
    });

    describe('attachToScope()', function () {
        it('should attach values to scope', function () {
            var model = {};
            var itemsToAttach = ['faketest'];
            var expected = { faketest: { foo: 'choo' }};
            jng.attachToScope.call(context, model, itemsToAttach);
            model.should.deep.equal(expected);
        });
    });

    describe('getAppFileNames()', function () {
        it('should get file names', function () {
            var appName = 'foo';
            var dir = 'pages';
            var names = jng.getAppFileNames.call(context, appName, dir);
            taste.should.exist(names);
            names.length.should.be.greaterThan(0);
        });
    });

    describe('getJangularDeps()', function () {
        it('should return all the jangular and jyt dependencies', function () {
            var deps = jng.getJangularDeps.call(context);
            taste.should.exist(deps.div);
            taste.should.exist(deps.span);
        });
    });

    describe('dotToCamelCase()', function () {
        it('should return camel case for dot case file name', function () {
            var fileName = 'some.thing.here.js';
            var expected = 'someThingHere';
            var actual = jng.dotToCamelCase(fileName);
            actual.should.equal(expected);
        });
    });

    describe('registerJytPlugins()', function () {
        it('should register the jyt plugins', function () {
            jng.registerJytPlugins.call(context);
            var deps = jng.getJangularDeps();
            taste.should.exist(deps.testAnother);
            taste.should.exist(deps.testStars);
        });
    });
});