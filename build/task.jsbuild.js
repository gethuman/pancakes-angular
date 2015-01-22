/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * Build the javascript in this library
 */
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var uglify  = require('gulp-uglify');
var ngann   = require('gulp-ng-annotate');

module.exports = function (gulp, opts) {
    var buildFileName = opts.buildFileName || 'pancakes.angular';
    var buildFileDir = opts.buildFileDir || 'dist';

    return {
        concat: function () {
            return gulp.src(opts.karmaTargetCode)
                .pipe(concat(buildFileName + '.js'))
                .pipe(gulp.dest(buildFileDir));
        },
        minify: function () {
            return gulp.src([buildFileDir + '/' + buildFileName + '.js'])
                .pipe(ngann())
                .pipe(uglify())
                .pipe(rename(buildFileName + '.min.js'))
                .pipe(gulp.dest(buildFileDir));
        },
        'default': ['jsbuild.concat', 'jsbuild.minify']
    };
};
