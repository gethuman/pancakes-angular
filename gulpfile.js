/**
 * Author: Jeff Whelpley
 * Date: 2/9/14
 *
 * Build file for Pancakes
 */
var gulp    = require('gulp');
var taste   = require('taste');
var batter  = require('batter');

batter.whip(gulp, taste, {
    karmaTargetCode:    ['lib/pancakes.angular.app.js', 'lib/ngapp/**/*.js'],
    tasksets: {
        'default': ['lint', 'test', 'test.karma', 'jsbuild']
    },
    jsLibs: [
        'node_modules/angular-cookies/angular-cookies.min.js'
    ]
});
