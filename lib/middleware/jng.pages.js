/**
 * Author: Jeff Whelpley
 * Date: 10/19/14
 *
 * This module is used to render a page with jangular
 */
var _           = require('lodash');
var fs          = require('fs');
var pancakes    = require('pancakes');
var jangular    = require('jeff-jangular');
var jngFilters  = require('./jng.filters');
var jngUtils    = require('./jng.utils');

/**
 * Get a particular layout
 * @param appName
 * @param layoutName
 * @param dependencies
 */
function renderLayout(appName, layoutName, dependencies) {
    var path = pancakes.getRootDir() + '/app/' + appName + '/layouts/' + layoutName + '.layout';
    var flapjack = fs.existsSync(path + '.js') ?
        require(path) :
        require(path.replace('/' + appName + '/', '/common/'));

    var layout = pancakes.cook(flapjack.view, { dependencies: dependencies });
    return jangular.templateToString(jangular.naked(layout), dependencies.model);
}

/**
 * Render the page
 * @param routeInfo
 * @param page
 * @param model
 * @returns {*}
 */
function renderPage(routeInfo, page, model) {
    var withLayout, fullPage;
    var subviews = {}, pageDeps = {};

    // make some modifications to the model
    jngUtils.setDefaults(model, page.defaults);
    jngUtils.attachToScope(model, page.attachToScope);
    jngFilters.addFiltersToModel(model, routeInfo.appName);

    // if any subviews, put them in an object
    _.each(page.subviews, function (subview, subviewName) {
        subviews[subviewName] = pancakes.cook(subview, { dependencies: jngUtils.deps });
    });

    // get the view
    _.extend(pageDeps, jngUtils.deps, { model: model, routeInfo: routeInfo, subviews: subviews });
    var view = pancakes.cook(page.view, { dependencies: pageDeps });

    // render the view (and strip directives)
    model[jangular.JNG_STRIP_DIRECTIVES] = true;
    var angularizedView = jangular.templateToString(view, model);
    delete(model[jangular.JNG_STRIP_DIRECTIVES]);

    // if layout exists, need to put the page content within the layout
    if (routeInfo.layout && routeInfo.layout !== 'none') {

        // add the rendered view as a dependency that gets injected into the app layout
        _.extend(pageDeps, { pageContent: angularizedView });
        withLayout = renderLayout(routeInfo.appName, routeInfo.layout, pageDeps);

        // add the rendered app layout as a dependency injected into the site layout
        _.extend(pageDeps, { appContent: withLayout });
        fullPage = renderLayout('common', 'server.page', pageDeps);
    }
    // else no layout, so just use the generate page content
    else {
        fullPage = angularizedView;
    }

    return fullPage;
}

// expose functions
module.exports = {
    renderPage: renderPage,
    renderLayout: renderLayout
};
