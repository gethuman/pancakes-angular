/**
 * Author: Jeff Whelpley
 * Date: 10/16/14
 *
 * The app definition for pancakes.angular
 */
angular.module('pancakesAngular', []);

// this little hack is used to fix issue with facebook social auth
// TODO: put this someplace better, but won't hurt to have it here for now
// really, this belongs in security plugin once I get to those
if (window.location.hash === '#_=_') {
    history.replaceState ?
        history.replaceState(null, null, window.location.href.split('#')[0]) :
        window.location.hash = '';
}