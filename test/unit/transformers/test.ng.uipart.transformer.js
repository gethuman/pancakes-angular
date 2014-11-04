/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'transformers/ng.uipart.transformer';
var taste       = require('../../pancakes.angular.taste');
var transformer = taste.target(name);
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var prefix = 'tst';
    var context = { pancakes: pancakes, transformers: { basic: { transform: function () { return null; }}} };
    _.extend(context, pancakes.baseTransformer, pancakes.utils, pancakes.annotations, transformer);

    describe('parseNames()', function () {
        it('should get the app name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'tstBooyeahApp';
            var names = transformer.parseNames.call(context, filePath, prefix);
            names.appName.should.equal(expected);
        });

        it('should identify page as NOT a partial', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var names = transformer.parseNames.call(context, filePath, prefix);
            names.isPartial.should.equal(false);
        });

        it('should identify path as a partial', function () {
            var filePath = '/app/booyeah/partials/my.home.partial.js';
            var names = transformer.parseNames.call(context, filePath, prefix);
            names.isPartial.should.equal(true);
        });

        it('should get the ui part name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'my.home';
            var names = transformer.parseNames.call(context, filePath, prefix);
            names.uiPartName.should.equal(expected);
            names.viewUrl.should.equal('templates/' + expected);
        });

        it('should set the directive name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'tstMyHome';
            var names = transformer.parseNames.call(context, filePath, prefix);
            names.directiveName.should.equal(expected);
        });

        it('should set the directive name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'MyHomeCtrl';
            var names = transformer.parseNames.call(context, filePath, prefix);
            names.controllerName.should.equal(expected);
        });
    });

    describe('renderObjFns()', function () {
        it('should convert an object', function () {
            var obj = {
                one: function (foo, choo) { return foo + choo; },
                two: function (foo, choo) { return foo - choo; }
            };
            var opts = { raw: true, isClient: true };

            var actual = transformer.renderObjFns.call(context, obj, opts);
            actual.should.have.property('one');
            actual.should.have.property('two');
        });
    });

    describe('getCtrlTemplateModel()', function () {
        it('should return a controller template model', function () {
            var uipart = {
                controller: function (val, moo) {
                    return _.extend({}, val, moo);
                }
            };
            var names = { isPartial: false };
            var options = {};

            var expected = {
                params:             ['val', 'moo'],
                convertedParams:    ['val', 'moo'],
                ngrefs:             [],
                defaults:           'null',
                attachToScope:      'null',
                rerenderExists:     undefined,
                rebindExists:       undefined,
                rebindFn:           null,
                rebindWatchers:     'null',
                rebindEvents:       'null',
                rerenderWatchers:   'null',
                rerenderEvents:     'null',
                useRebindOnWatch:   undefined,
                useRebindOnEvent:   undefined,
                useRerenderOnWatch: undefined,
                useRerenderOnEvent: undefined,
                validations:        null,
                eventBusListeners:  null,
                uiEventHandlers:    null,
                body:               '\n\t                    return _.extend({}, val, moo);\n\t                '
            };

            var actual = transformer.getCtrlTemplateModel.call(context, uipart, names, options);
            actual.should.deep.equal(expected);
        });
    });

    describe('getHtml()', function () {
        it('should generate html with subviews', function () {
            var uipart = {
                view: function (div, span, subviews) {
                    return div(
                        span('hello, world'),
                        subviews.first
                    );
                },
                subviews: {
                    first: function (div, a) {
                        return div(
                            a({ href: '/' }, 'hello again')
                        );
                    }
                }
            };

            var expected = '<div><span>hello, world</span><div><a href="/">hello again</a></div></div>';
            var actual = transformer.getHtml.call(context, uipart);
            actual.should.equal(expected);
        });
    });
});