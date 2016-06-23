/**
 * Author: Zachary Allen
 * Date: 3/28/16
 *
 * Build the javascript in this library
 */
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var ngann       = require('gulp-ng-annotate');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };

module.exports = function (gulp, opts) {
    var buildFileName = opts.buildFileName || 'pancakes.angular';
    var buildFileDir = opts.buildFileDir || 'dist';

    return {
        concat: function () {
            return {
                files: [
                    {
                        cwd: 'dist',
                        expand: true,
                        src: 'phonegap-index.html',
                        dest: 'phonegap/www'
                    }, {
                        cwd: 'assets/img',
                        expand: true,
                        src: '*.png',
                        dest: 'mobile/www/img/'
                    }, {
                        cwd: 'public/img',
                        expand: true,
                        src: '*.gif',
                        dest: 'mobile/www/img/'
                    }, {
                        cwd: 'public/img',
                        expand: true,
                        src: '*.png',
                        dest: 'mobile/www/img/'
                    }, {
                        cwd: 'public/img',
                        expand: true,
                        src: '*.jpg',
                        dest: 'mobile/www/img/'
                    }, {
                        cwd: 'dist',
                        expand: true,
                        src: 'libs.css',
                        dest: 'mobile/www/css/'
                    }, {
                        cwd: 'public/css/fonts',
                        expand: true,
                        src: 'playtime.css',
                        dest: 'mobile/www/css/fonts'
                    }, {
                        cwd: 'public/css',
                        expand: true,
                        src: 'app.css',
                        dest: 'mobile/www/css'
                    }, {
                        cwd: 'dist',
                        expand: true,
                        src: 'libs.js',
                        dest: 'mobile/www/js/'
                    }, {
                        cwd: 'app/**/*.js',
                        expand: true,
                        src: '**/*.js',
                        dest: 'mobile/www/js/app/'
                    }, {
                        cwd: 'dist',
                        expand: true,
                        src: 'templates.js',
                        dest: 'mobile/www/js/app'
                    }
                    //}, {
                    //    cwd: 'public/js/lib',
                    //    expand: true,
                    //    src: [
                    //        'angular/angular.js',
                    //        'angular-touch/angular-touch.js',
                    //        'angular-resource/angular-resource.js',
                    //        'angular-cookies/angular-cookies.js',
                    //        'angular-animate/angular-animate.js',
                    //        'angular-facebook/lib/angular-facebook.js',
                    //        'angular-sanitize/angular-sanitize.js',
                    //        'angular-ui-router/release/angular-ui-router.js',
                    //        'i18next/i18next.js',
                    //        'ng-i18next/dist/ng-i18next.js',
                    //        'angular-load/angular-load.js',
                    //        'firebase/firebase.js',
                    //        'angularfire/dist/angularfire.js',
                    //        'oauth-js/dist/oauth.js'
                    //    ],
                    //    dest: 'phonegap/www/js/lib/'
                    //}, {
                    //    cwd: 'public/views',
                    //    expand: true,
                    //    src: '**/*.html',
                    //    dest: 'phonegap/www/views'
                    //}
                ]
            }
        },
        minify: function () {
            setTimeout(function () {
                gulp.src([buildFileDir + '/' + buildFileName + '.js'])
                    .pipe(uglify())
                    .pipe(rename(buildFileName + '.min.js'))
                    .pipe(gulp.dest(buildFileDir));
            }, 500);
        },
        '': ['mobile.copy']
    };
};