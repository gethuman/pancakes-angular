/**
 * Author: Jeff Whelpley
 * Date: 10/18/14
 *
 *
 */
describe('UNIT tpl.helper', function () {

    beforeEach(module('pancakesAngular'));

    describe('setDefaults()', function () {
        it('should return wo changes if no defaults', inject(function (tplHelper) {
            var scope = { foo: 'choo' };
            var defaults = null;
            var expected = JSON.parse(JSON.stringify(scope));
            tplHelper.setDefaults(scope, defaults);
            scope.should.deep.equal(expected);
        }));

        it('should set values on empty object', inject(function (tplHelper) {
            var model = {};
            var defaults = { one: 'foo', two: 'choo' };
            var expected = { defaults: { one: 'foo', two: 'choo' }, one: 'foo', two: 'choo' };
            tplHelper.setDefaults(model, defaults);
            model.should.deep.equal(expected);
        }));

        it('should not overwrite value that already there', inject(function (tplHelper) {
            var model = { one: 'zoo' };
            var defaults = { one: 'foo', two: 'choo' };
            var expected = { defaults: { one: 'foo', two: 'choo' }, one: 'zoo', two: 'choo' };
            tplHelper.setDefaults(model, defaults);
            model.should.deep.equal(expected);
        }));
    });

    describe('attachToScope()', function () {
        it('should attach values to scope', inject(function (tplHelper) {
            var model = {};
            var itemsToAttach = ['ajax'];
            tplHelper.attachToScope(model, itemsToAttach);
            model.should.have.property('ajax');
        }));
    });

    describe('addEventHandlers()', function () {
        it('should add handlers to scope', inject(function (tplHelper) {
            var scope = {};
            var handlers = { one: function () {
                return function () {};
            }};
            tplHelper.addEventHandlers(scope, 'shmoo', handlers);
            scope.should.have.property('one').that.is.a('Function');
        }));
    });
});

