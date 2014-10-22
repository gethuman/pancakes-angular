/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name    = 'middleware/jng.filters';
var taste   = require('../../taste');
var jng     = taste.target(name);

describe('UNIT ' + name, function () {
    describe('addFiltersToModel()', function () {
        it('should add no filters to model for fake app', function () {
            var model = { foo: 'la' };
            var appName = 'asdfsdf';
            jng.addFiltersToModel(model, appName);
            model.should.deep.equal({ foo: 'la' });
        });

        it('should add filters for existing app', function () {
            var model = { foo: 'la' };
            var appName = 'foo';
            jng.addFiltersToModel(model, appName);
            model.should.have.property('testfilter');
            model.testfilter.should.be.a('Function');
        });
    });
});