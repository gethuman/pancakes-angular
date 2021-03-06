/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'middleware/jng.pages';
var taste       = require('../../pancakes.angular.taste');
var jng         = taste.target(name);
var utils       = taste.target('middleware/jng.utils');
var filters     = taste.target('middleware/jng.filters');
var jangular    = require('jangular');
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var appName = 'foo';
    var context = { pancakes: pancakes };

    _.extend(context, utils, jng, filters);

    describe('renderLayout()', function () {
        it('should return the rendered layout', function () {
            var layoutName = 'fake';
            var dependencies = { model: {
                something: true,
                another: false,
                boo: 'blah'
            }};
            jangular.addShortcutsToScope(dependencies);

            var expected = '<div><span><a href="/blah">hello, world</a></span><div ng-if="something" ng-bind="boo">blah</div></div>';
            var actual = jng.renderLayout.call(context, appName, layoutName, dependencies);
            actual.should.equal(expected);
        });
    });

    describe('renderPage()', function () {
        var routeInfo = { appName: appName, strip: true };
        var page = {
            defaults: { foo1: true },
            subviews: {
                sub1: function (div) { return div({ 'ng-if': 'foo1' }, 'sub1'); },
                sub2: function (span) { return span({ 'ng-if': 'foo2' }, 'sub2'); }
            },
            view: function (div, subviews) {
                return div(subviews.sub1, subviews.sub2);
            }
        };
        var model = { foo2: false };
        var expected = '<div><div>sub1</div></div>';
        var actual = jng.renderPage.call(context, routeInfo, page, model);
        actual.should.eventually.equal(expected);
    });
});