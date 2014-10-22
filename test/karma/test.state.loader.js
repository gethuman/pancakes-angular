/**
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
describe('UNIT state.loader', function () {

    beforeEach(module('pancakesAngular'));

    describe('getPascalCase()', function () {
        it('should get the pascal case', inject(function (stateLoader) {
            var val = 'some.thing.here';
            var expected = 'SomeThingHere';
            var actual = stateLoader.getPascalCase(val);
            actual.should.equal(expected);
        }));
    });
});