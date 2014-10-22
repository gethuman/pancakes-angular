/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
module.exports = {
    parent: 'fakeparent',
    subviews: {
        sub1: function (span) {
            return span('hello, world');
        }
    }
};