/**
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
describe('UNIT client.event.bus', function () {

    beforeEach(module('pancakesAngular'));

    describe('emit() and on()', function () {
        it('should emit an event and capture it', function (done) {
            inject(function (eventBus) {
                eventBus.on('something', function () { done(); });
                eventBus.emit('something');
            });
        });
    });
});