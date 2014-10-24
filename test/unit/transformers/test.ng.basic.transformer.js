/**
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
var name        = 'transformers/ng.basic.transformer';
var taste       = require('../../taste');
var transformer = taste.target(name);
var pancakes    = require('pancakes');
var _           = require('lodash');

describe('UNIT ' + name, function () {
    var context = { pancakes: pancakes };
    _.extend(context, pancakes.baseTransformer, pancakes.annotations, transformer);

    describe('checkIngredients()', function () {
        it('should return back the client if flapjack is an object', function () {
            var flapjack = { client: { boo: 'yeah' }};
            var expected = flapjack.client;
            var actual = transformer.checkIngredients.call(context, flapjack, null);
            actual.should.deep.equal(expected);
        });

        it('should return back the flapjack sent in if no type', function () {
            var flapjack = { blah: { boo: 'yeah' }};
            var actual = transformer.checkIngredients.call(context, flapjack, null);
            actual.should.deep.equal(flapjack);
        });

        it('should return null if factor and no client', function () {
            var flapjack = { asdf: { boo: 'yeah' }};
            var options = { ngType: 'factory' };
            var actual = transformer.checkIngredients.call(context, flapjack, options);
            taste.expect(actual).to.be.null;
        });
    });

    describe('template()', function () {
        it('should return back valid JS without raw', function () {
            var model = {
                defaults:           '{}',
                raw:                false,
                ngType:             'factory',
                appName:            'commonApp',
                moduleName:         'myModule',
                includeName:        true,
                params:             ['some', '$log'],
                convertedParams:    ['some', 'log'],
                ngrefs:             ['_'],
                body:               'var blah = 3;'
            };

            var code = taste.getTemplate('basic')(model);
            taste.validateCode(code, false).should.equal(true);
        });

        it('should return back valid JS with raw', function () {
            var model = {
                defaults:           '{}',
                raw:                true,
                ngType:             'factory',
                appName:            'commonApp',
                moduleName:         'myModule',
                includeName:        true,
                params:             ['some', '$log'],
                convertedParams:    ['some', 'log'],
                ngrefs:             ['_'],
                body:               'var blah = 3;'
            };

            var code = taste.getTemplate('basic')(model);
            taste.validateCode(code, true).should.equal(true);
        });
    });
});