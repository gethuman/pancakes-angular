/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 *
 */
module.exports = function () {
    return {
        clientDependencies: ['ngTouch'],
        routes: [
            {
                urls: ['/'],
                name: 'fixture.basic'
            }
        ]
    };
};