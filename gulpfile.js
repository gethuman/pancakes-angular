/**
 * Author: Jeff Whelpley
 * Date: 2/9/14
 *
 * Build file for Pancakes
 */
var gulp    = require('gulp');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var uglify  = require('gulp-uglify');
var ngann   = require('gulp-ng-annotate');
var taste   = require('taste');

taste.init({
    gulp:       gulp,
    rootDir:    __dirname + '/lib',
    loadModule: require,
    karmaTargetCode: ['lib/pancakes.angular.app.js', 'lib/ngapp/**/*.js']
});

gulp.task('build', function () {
    return gulp.src(['lib/pancakes.angular.app.js', 'lib/ngapp/**/*.js'])
        .pipe(concat('pancakes.angular.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('min', function () {
    return gulp.src(['dist/pancakes.angular.js'])
        .pipe(ngann())
        .pipe(uglify())
        .pipe(rename('pancakes.angular.min.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['jshint', 'test', 'test.karma', 'build']);


