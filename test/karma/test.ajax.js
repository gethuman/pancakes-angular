/**
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
describe('UNIT ajax', function () {
    var apiOpts;

    beforeEach(module('pancakesAngular', function ($provide) {
        $provide.value('config', { apiBase: '/' });
    }));

    beforeEach(inject(function ($httpBackend) {
        $httpBackend
            .when('GET', '/blah')
            .respond({ foo: 'choo' });
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));

    describe('send()', function () {
        it('should send out an ajax request', function (done) {
            inject(function ($httpBackend, ajax) {
                ajax.send('blah', 'GET', {}, 'blah')
                    .then(function (data) {
                        data.should.deep.equal({ foo: 'choo' });
                        done();
                    })
                    .catch(function (err) {
                        done(err);
                    });

                $httpBackend.flush();
            });
        });
    });
});