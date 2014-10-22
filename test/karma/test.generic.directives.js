/**
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
describe('UNIT generic.directives', function () {

    beforeEach(module('pancakesAngular'));

    describe('bfo-popover', function () {
        it('should exist', inject(function ($compile, $rootScope) {
            var scope = $rootScope.$new();
            var blah = $compile('<div bfo-popover="blah"></div>')(scope);

            // kick off the digest cycle
            scope.$apply(function () { scope.blah = 'hello, world'; });

            var expected = '<div bfo-popover="blah" class="ng-scope" popover="hello, world"></div>';
            var actual = blah[0].outerHTML;
            actual.should.equal(expected);
        }));
    });
});