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
    var appName = 'foo';
    var routeName = 'fixture.basic';

    describe('getUIPart()', function () {
        it('should return a ui part', function () {
            var route = { name: routeName };
            var actual = transformer.getUIPart(appName, route);
            actual.should.have.property('foo').that.equals('choo');
        });
    });

    describe('getResolveHandlers()', function () {
        it('should return resolve handlers', function () {
            var routes = [{ name: routeName }];
            var handlers = transformer.getResolveHandlers(appName, routes);
            handlers.should.have.property(routeName);

            var code = handlers[routeName];
            taste.validateCode(code, true).should.equal(true);
        });
    });

    describe('template()', function () {
        it('should generate valid template code', function () {
            var model = {
                appName: appName,
                routes: JSON.stringify([{ name: routeName, urls: ['/'] }]),
                resolveHandlers: {
                    'fixture.basic': function () {
                        return 'blah';
                    }
                }
            };

            var code = transformer.template(model);
            taste.validateCode(code, false).should.equal(true);
        });
    });
});