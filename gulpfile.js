/**
 * Author: Jeff Whelpley
 * Date: 2/9/14
 *
 * Build file for Pancakes
 */
var gulp    = require('gulp');
var mocha   = require('gulp-mocha');
var jshint  = require('gulp-jshint');
var watch   = require('gulp-watch');
var karma   = require('gulp-karma');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var uglify  = require('gulp-uglify');
var ngann   = require('gulp-ng-annotate');

var alljs = ['test/**/*.js', 'lib/**/*.js'];
var serverjs = ['test/unit/**/*.js', 'lib/transformers/**/*.js'];
var clientjs = [
    'node_modules/angular/angular.js',
    'node_modules/angular-mocks/angular-mocks.js',
    'test/karma/**/*.js',
    'lib/pancakes.angular.app.js',
    'lib/ngapp/**/*.js'
];

gulp.task('jshint', function () {
    return gulp.src(alljs)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('test', function () {
    return gulp.src('test/unit/**/*.js')
        .pipe(mocha({
            growl: true,
            ui: 'bdd',
            reporter: 'progress',
            timeout: 5000,
            require: 'test/setup'
        }));
});

gulp.task('ngtest', function () {
    return gulp.src(clientjs).pipe(karma({ configFile: 'test/karma.config.js', action: 'run' }));
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

gulp.task('watch', function (){
    gulp.watch(serverjs, ['jshint', 'test']);
    gulp.src(clientjs).pipe(karma({ configFile: 'test/karma.config.js', action: 'watch' }));
});

gulp.task('default', ['jshint', 'test', 'ngtest', 'build']);


