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
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var appName = 'foo';
    var routeName = 'fixture.basic';
    var context = { pancakes: pancakes, transformers: { basic: { transform: function () { return 'dddfff'; }}}};
    _.extend(context, pancakes.baseTransformer, transformer);

    describe('getUIPart()', function () {
        it('should return a ui part', function () {
            var route = { name: routeName };
            var actual = transformer.getUIPart.call(context, appName, route);
            actual.should.have.property('foo').that.equals('choo');
        });
    });

    describe('getResolveHandlers()', function () {
        it('should return resolve handlers', function () {
            var routes = [{ name: routeName }];
            var handlers = transformer.getResolveHandlers.call(context, appName, routes);
            handlers.should.have.property(routeName);

            var code = handlers[routeName];
            code.should.equal('dddfff');
        });
    });

    describe('template()', function () {
        it('should generate valid template code', function () {
            var model = {
                appName: appName,
                routes: JSON.stringify([{ name: routeName, urls: ['/'] }]),
                resolveHandlers: {
                    'fixture.basic': function () {
                        return '[]';
                    }
                }
            };

            var code = taste.getTemplate('routing')(model);
            taste.validateCode(code, false).should.equal(true);
        });
    });
});