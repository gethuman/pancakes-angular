/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'transformers/ng.uipart.transformer';
var taste       = require('../../taste');
var transformer = taste.target(name);

describe('UNIT ' + name, function () {
    var ngPrefix = 'tst';

    describe('parseNames()', function () {
        it('should get the app name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'tstBooyeahApp';
            var names = transformer.parseNames(filePath, ngPrefix);
            names.appName.should.equal(expected);
        });

        it('should identify page as NOT a partial', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var names = transformer.parseNames(filePath, ngPrefix);
            names.isPartial.should.equal(false);
        });

        it('should identify path as a partial', function () {
            var filePath = '/app/booyeah/partials/my.home.partial.js';
            var names = transformer.parseNames(filePath, ngPrefix);
            names.isPartial.should.equal(true);
        });

        it('should get the ui part name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'my.home';
            var names = transformer.parseNames(filePath, ngPrefix);
            names.uiPartName.should.equal(expected);
            names.viewUrl.should.equal('templates/' + expected);
        });

        it('should set the directive name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'tstMyHome';
            var names = transformer.parseNames(filePath, ngPrefix);
            names.directiveName.should.equal(expected);
        });

        it('should set the directive name', function () {
            var filePath = '/app/booyeah/pages/my.home.page.js';
            var expected = 'MyHomeCtrl';
            var names = transformer.parseNames(filePath, ngPrefix);
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

            var expected = {};
            var actual = transformer.renderObjFns(obj, opts);
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
                params: ['val', 'moo'],
                convertedParams: ['val', 'moo'],
                ngrefs: [],
                defaults: 'null',
                attachToScope: 'null',
                shouldRenderModel: false,
                renderModelFn: null,
                scopeWatchers: 'null',
                eventBusListeners: null,
                uiEventHandlers: null,
                body: '\n\t                    return _.extend({}, val, moo);\n\t                '
            };

            var actual = transformer.getCtrlTemplateModel(uipart, names, options);
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
                    )
                },
                subviews: {
                    first: function (div, a) {
                        return div(
                            a({ href: '/' }, 'hello again')
                        )
                    }
                }
            };

            var expected = '<div><span>hello, world</span><div><a href="/">hello again</a></div></div>';
            var actual = transformer.getHtml(uipart);
            actual.should.equal(expected);
        });
    });

    describe('flapjack()', function () {
        it('should generate code for a uipart', function () {
            var filePath = __dirname + '/../../fixtures/app/foo/partials/answerlist.partial';
            var flapjack = require(filePath);
            var options = { filePath: filePath, ngPrefix: 'gh' };

            var code = transformer.transform(flapjack, options);
            taste.validateCode(code, false).should.equal(true);
        });
    });
});