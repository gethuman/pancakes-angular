/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'transformers/ng.app.transformer';
var taste       = require('../../pancakes.angular.taste');
var transformer = taste.target(name);
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var context = { pancakes: pancakes };
    _.extend(context, pancakes.baseTransformer, transformer);

    describe('getSchemaValidations()', function () {
        it('should return null if includeSchemas false', function () {
            var appInfo = {};
            var actual = transformer.getSchemaValidations.call(context, appInfo, null);
            taste.expect(actual).to.be.null;
        });

        it('should return validations from resources', function () {
            var appInfo = { includeSchemas: true };
            var resources = [
                { name: 'blah', fields: { fld1: { ui: true, foo: 'choo' }, fld2: { zoo: 'boo' }}},
                { name: 'wham', fields: { fld3: { ui: true, so: 'no' }}}
            ];
            var expected = {
                blah: { fld1: { ui: true, foo: 'choo' } },
                wham: { fld3: { ui: true, so: 'no' } }
            };
            var actual = transformer.getSchemaValidations.call(context, appInfo, resources);
            actual.should.deep.equal(expected);
        });
    });

    describe('stringify()', function () {
        it('should return empty string if no validations', function () {
            var validations = null;
            var expected = '';
            var actual = transformer.stringify.call(context, validations);
            actual.should.equal(expected);
        });

        it('should change regex and types to string values', function () {
            var validations = {
                blah: { fld1: { ui: true, match: /asdf/ } },
                wham: { fld3: { ui: true, type: Number } }
            };
            var expected = '{"blah":{"fld1":{"ui":true,"match":"/asdf/"}},"wham":{"fld3":{"ui":true,"type":"Number"}}}';
            var actual = transformer.stringify.call(context, validations);
            actual.should.equal(expected);
        });
    });

    describe('template()', function () {
        it('should generate validate javascript', function () {
            var model = {
                appName:    'commonApp',
                deps:       ['dep1', 'dep2'],
                schema:     '{"blah":{"fld1":{"ui":true,"match":"/asdf/"}},"wham":{"fld3":{"ui":true,"type":"Number"}}}'
            };

            var code = taste.getTemplate('app')(model);
            taste.validateCode(code).should.equal(true);
        });
    });
});