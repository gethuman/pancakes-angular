/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
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
            return streamqueue(objMode,
                //gulp.src(opts.jsLibs),
                gulp.src(opts.karmaTargetCode)
            )
                .pipe(ngann())
                .pipe(concat(buildFileName + '.js'))
                .pipe(gulp.dest(buildFileDir));
        },
        minify: function () {
            setTimeout(function () {
                gulp.src([buildFileDir + '/' + buildFileName + '.js'])
                    .pipe(uglify())
                    .pipe(rename(buildFileName + '.min.js'))
                    .pipe(gulp.dest(buildFileDir));
            }, 500);
        },
        '': ['jsbuild.concat', 'jsbuild.minify']
    };
};
