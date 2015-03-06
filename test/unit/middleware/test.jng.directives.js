/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'middleware/jng.directives';
var taste       = require('../../pancakes.angular.taste');
var jng         = taste.target(name);
var utils       = taste.target('middleware/jng.utils');
var jangular    = require('jangular');
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var context = {
        pancakes: pancakes
    };

    _.extend(context, utils, jng);

    describe('isolateScope()', function () {
        it('should not do anything if no scope', function () {
            var model = { foo: 'choo' };
            var scope = null;
            var attrs = null;
            var expected = { foo: 'choo' };
            jng.isolateScope.call(context, model, scope, attrs);
            model.should.deep.equal(expected);
        });

        it('should isolate the scope', function () {
            var model = { foo: 'choo', boo: 'loo', something: true };
            var scope = { foo: '=', blah: '@' };
            var attrs = { foo: 'foo', blah: 'hello, world' };
            var expected = { foo: 'choo', blah: 'hello, world', boo: 'loo', something: true };
            jng.isolateScope.call(context, model, scope, attrs);
            model.should.deep.equal(expected);
        });
    });

    describe('evalModel()', function () {
        var model = { foo: 'boo' };
        var modelFlapjack = function () {
            return { another: 'yes' };
        };
        var expected = { foo: 'boo', another: 'yes' };
        jng.evalModel.call(context, model, {}, modelFlapjack);
        model.should.deep.equal(expected);
    });

    describe('getSubviews()', function () {
        var subviewFlapjacks = {
            one: function (div) { return div('hello'); },
            two: function (div) { return div('world'); }
        };
        var actual = jng.getSubviews.call(context, subviewFlapjacks);
        jangular.render(actual.one).should.equal('<div>hello</div>');
        jangular.render(actual.two).should.equal('<div>world</div>');
    });

    describe('getPartialRenderFn()', function () {
        it('should render a partial', function () {
            var partial = { view: function (div) {
                return div('hello, world');
            }};
            var model = {};
            var expected = '<div>hello, world</div>';

            var fn = jng.getPartialRenderFn.call(context, partial);
            var renderedView = fn(model, {}, {});
            jangular.render(renderedView).should.equal(expected);
        });
    });

    describe('getComponentDirectives()', function () {
        it('should return some directives for foo', function () {
            var directives = jng.getComponentDirectives.call(context, 'foo', 'pan');
            directives.should.have.property('pan-fakesimple');
        });
    });

    describe('getBehavioralDirectives()', function () {
        it('should return behaviorial directives', function () {
            var directives = jng.getBehavioralDirectives.call(context, 'common');
            directives.should.have.property('blah-fakebehave');
        });
    });

    describe('getGenericDirective()', function () {
        it('should generate a bind filter with i18n', function () {
            var attrName = 'testattr';
            var fn = jng.getGenericDirective.call(context, 'pre', 'testattr', 'i18n', true);
            var scope = { blah: 'wawa' };
            var element = {};
            var attrs = { $set: taste.spy(), preTestattr: 'blah' };
            fn(scope, element, attrs);
            attrs.$set.should.have.been.calledWith(attrName, scope.blah, scope);
        });
    });

    describe('getGenericDirectives()', function () {
        it('should generate all the generic directives', function () {
            var directives = jng.getGenericDirectives.call(context);
            directives.should.have.property('bfo-popover');
        });
    });

    describe('initDirectives()', function () {
        var obj = {};
        jangular.addShortcutsToScope(obj);

        jng.initDirectives.call(context, { componentPrefix: 'pan' });
        var template = obj.div({ 'pan-fakesimple': null });
        var expected = '<div pan-fakesimple><span>hello, world</span></div>';
        var actual =    jangular.render(template);
        actual.should.equal(expected);
    });
});