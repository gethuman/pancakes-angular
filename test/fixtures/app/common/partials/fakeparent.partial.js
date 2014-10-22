/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/22/14
 *
 *
 */
module.exports = {
    abstract: true,

    view: function (div, subviews) {
        return div(subviews.sub1);
    }
};