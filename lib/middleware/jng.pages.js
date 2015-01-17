/**
 * Author: Jeff Whelpley
 * Date: 10/19/14
 *
 * This module is used to render a page with jangular
 */
var Q           = require('q');
var _           = require('lodash');
var jangular    = require('jangular');
var utils       = require('./jng.utils');
//var newrelic    = require('newrelic');


/**
 * Get a particular layout
 * @param appName
 * @param layoutName
 * @param dependencies
 */
function renderLayout(appName, layoutName, dependencies) {
    var path = this.pancakes.getRootDir() + '/app/' + appName + '/layouts/' + layoutName + '.layout';

    var flapjack = utils.doesFileExist(path + '.js') ?
        require(path) :
        require(path.replace('/' + appName + '/', '/common/'));

    var layout = this.pancakes.cook(flapjack.view, { dependencies: dependencies });
    return jangular.render(layout, dependencies.model, false);
}

/**
 * Render the page. There are 4 potentially levels of rendering that goes
 * on in order to render one page:
 *      1) Subviews - The lowest level; get rolled up to the view
 *      2) View - The main page content
 *      3) Layout - View gets rolled up into a layout
 *      4) Wrapper - Layout or View can get rolled up into a wrapper
 *
 * Note: layouts and wrappers are essentially the same but as a matter of practice
 * we are limiting it to those two levels of rollups. Any other depth on the page
 * is taken care of by subcomponents (i.e. directives)
 *
 * @param routeInfo
 * @param page
 * @param model
 * @returns {*}
 */
function renderPage(routeInfo, page, model) {
    var subviews = {}, pageDeps = {};
    var jangularDeps = this.getJangularDeps();
    var me = this;

    // make some angular-specific modifications to the model before we render
    this.setDefaults(model, page.defaults, null);
    this.applyPresets(model, page.defaults, page.presets);
    this.attachToScope(model, page.attachToScope);
    this.addFiltersToModel(model, routeInfo.appName);

    // if any subviews, put them in an object
    _.each(page.subviews, function (subview, subviewName) {
        subviews[subviewName] = me.pancakes.cook(subview, { dependencies: jangularDeps });
    });

    // get the view
    _.extend(pageDeps, jangularDeps, { model: model, routeInfo: routeInfo, subviews: subviews });
    var view = this.pancakes.cook(page.view, { dependencies: pageDeps });

    //var startTime = (new Date()).getTime();

    // render the view
    //var renderedPage = newrelic.createTracer('jng.pages::renderPage::render', function () {
    //    return jangular.render(view, model, routeInfo.strip);
    //})();

    var renderedPage = jangular.render(view, model, routeInfo.strip);

    //var endTime = (new Date()).getTime();
    //console.log('main page ' + (endTime - startTime));
    //startTime = endTime;

    // if layout exists, need to put the page content within the layout
    if (routeInfo.layout && routeInfo.layout !== 'none') {
        _.extend(pageDeps, { pageContent: renderedPage });

        //renderedPage = newrelic.createTracer('jng.pages::renderPage::renderLayout', function () {
        //    return me.renderLayout(routeInfo.appName, routeInfo.layout, pageDeps);
        //})();

        renderedPage = me.renderLayout(routeInfo.appName, routeInfo.layout, pageDeps);

        //endTime = (new Date()).getTime();
        //console.log('layout ' + (endTime - startTime));
    }

    // if page wrapper exists, put rendered page in that
    if (routeInfo.wrapper && routeInfo.wrapper !== 'none') {
        _.extend(pageDeps, { pageContent: renderedPage });

        //renderedPage = newrelic.createTracer('jng.pages::renderPage::renderWrapper', function () {
        //    return me.renderLayout(routeInfo.appName, routeInfo.wrapper, pageDeps);
        //})();

        renderedPage = me.renderLayout(routeInfo.appName, routeInfo.wrapper, pageDeps);
    }

    return renderedPage;
}

// expose functions
module.exports = {
    renderLayout: renderLayout,
    renderPage: renderPage
};
