/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'transformers/ng.routing.transformer';
var taste       = require('../../taste');
var transformer = taste.target(name);

describe('UNIT ' + name, function () {
    describe('getUIPart()', function () {
        var appName = 'foo';
        var route = { name: 'fixture.basic' };
        var actual = transformer.getUIPart(appName, route);
        actual.should.have.property('foo').that.equals('choo');
    });
});