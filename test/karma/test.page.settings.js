/**
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
describe('UNIT ', function () {

    beforeEach(module('pancakesAngular'));

    describe('updateHead()', function () {
        it('should update the page head', inject(function (pageSettings, $window) {
            pageSettings.updateHead('title here yo', 'desc here yo');
            var title = $window.document.title;
            title.should.equal('title here yo');
        }));
    });
});