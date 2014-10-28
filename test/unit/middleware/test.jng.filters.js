/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name    = 'middleware/jng.filters';
var taste   = require('../../pancakes.angular.taste');
var jng     = taste.target(name);
var utils       = taste.target('middleware/jng.utils');
var jangular    = require('jangular');
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var context = {
        pancakes: pancakes,
        jangular: jangular
    };

    _.extend(context, utils, jng);

    describe('addFiltersToModel()', function () {
        it('should add no filters to model for fake app', function () {
            var model = { foo: 'la' };
            var appName = 'asdfsdf';
            jng.addFiltersToModel.call(context, model, appName);
            model.should.deep.equal({ foo: 'la' });
        });

        it('should add filters for existing app', function () {
            var model = { foo: 'la' };
            var appName = 'foo';
            jng.addFiltersToModel.call(context, model, appName);
            model.should.have.property('testfilter');
            model.testfilter.should.be.a('Function');
        });
    });
});