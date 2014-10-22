/**
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
module.exports = {
    view: function (div, span, a) {
        return div(
            span(a({ href: '/blah' }, 'hello, world')),
            div({ 'ng-if': 'something', 'ng-bind': 'boo' }),
            div({ 'ng-if': 'another', 'ng-bind': 'yeah' })
        );
    }
};