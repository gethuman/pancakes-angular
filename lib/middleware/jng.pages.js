/**
 * Author: Jeff Whelpley
 * Date: 10/19/14
 *
 * This module is used to render a page with jangular
 */
var Q           = require('q');
var _           = require('lodash');
var jangular    = require('jangular');

/**
 * Get a particular layout
 * @param appName
 * @param layoutName
 * @param isAmp
 * @param dependencies
 */
function renderLayout(appName, layoutName, isAmp, dependencies) {
    var layout = this.pancakes.cook('app/' + appName + '/layouts/' + layoutName + '.layout');
    var layoutView = this.pancakes.cook(layout.view, { dependencies: dependencies });
    return jangular.render(layoutView, dependencies.model, { strip: false, isAmp: isAmp });
}

/**
 * Render sideview
 *
 *     TODO: these fns are in jng.directives. need to refactor to make this NOT a class
 *
 * @param appName
 * @param initialModel
 * @param routeInfo
 */
function renderSideview(appName, initialModel, routeInfo) {

    if ( !routeInfo.hasSideview ) {
        return new Q('');
    }

    var sideviewName = routeInfo.sideview || 'default';
    var sideview = this.pancakes.cook('app/' + appName + '/partials/' + appName +
                                        '.sideview.' + sideviewName + '.partial');
    var me = this;

    var user = initialModel && initialModel.user;
    var activeUser = user ? {
        _id: user._id,
        name: user.username,
        role: user.role,
        user: user
    } : {};

    var modelDeps = {
        currentScope:   sideview.defaults || {},
        initialModel:   initialModel,
        routeInfo:      routeInfo,
        activeUser:     activeUser
    };

    // call the sideview model allowing it to make another database call
    return Q.when(this.pancakes.cook(sideview.model, { dependencies: modelDeps }))
        .then(function (model) {

            // this is similar to both jng.pages renderPage() and jng.directives
            // as well as ng.uipart.template (for client side pages and partials)
            me.attachToScope(model, sideview.attachToScope);

            // generate the partial view
            var viewDeps = { model: model, subviews: me.getSubviews(sideview.subviews) };
            _.extend(viewDeps, me.getJangularDeps());
            var view = me.pancakes.cook(sideview.view, { dependencies: viewDeps });
            return jangular.render(view, model, { strip: routeInfo.strip });
        });
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
 * @param inlineCss
 * @returns {*}
 */
function renderPage(routeInfo, page, model, inlineCss) {
    inlineCss = inlineCss || 'none';

    var subviews = {};
    var appName = routeInfo.appName;
    var jangularDeps = this.getJangularDeps();
    var isLayout = routeInfo.layout && routeInfo.layout !== 'none' &&
        routeInfo.wrapper && routeInfo.wrapper !== 'none';

    // passing in model with two diff aliases for diff situations
    // initialModel used by sideview to designate value from page model
    var pageDeps = _.extend({ model: model, routeInfo: routeInfo }, jangularDeps);
    var me = this;

    // sideview may make an additional database call, so need to call async
    return this.renderSideview(appName, model, routeInfo)
        .then(function (sideview) {

            // make some angular-specific modifications to the model before we render
            me.setDefaults(model, page.defaults, null);
            me.applyPresets(model, page.defaults, page.presets);
            me.attachToScope(model, page.attachToScope);
            me.addFiltersToModel(model, routeInfo.appName);

            // if any subviews, put them in an object
            _.each(page.subviews, function (subview, subviewName) {
                subviews[subviewName] = me.pancakes.cook(subview, { dependencies: jangularDeps });
            });

            // get the view
            _.extend(pageDeps, jangularDeps, { subviews: subviews });
            var view = me.pancakes.cook(page.view, { dependencies: pageDeps });
            var renderedPage = jangular.render(view, model, { strip: routeInfo.strip, isAmp: routeInfo.isAmp });

            // if layout exists, need to put the page content within the layout
            if (isLayout) {
                _.extend(pageDeps, { pageContent: renderedPage, sideviewContent: sideview });
                renderedPage = me.renderLayout(appName, routeInfo.layout, routeInfo.isAmp, pageDeps);
            }

            // if page wrapper exists, put rendered page in that
            if (isLayout) {
                _.extend(pageDeps, { pageContent: renderedPage, routeInfo: routeInfo, inlineCss: inlineCss });
                renderedPage = me.renderLayout(appName, routeInfo.wrapper, routeInfo.isAmp, pageDeps);
            }

            // special one off thing for AMP pages
            if (routeInfo.isAmp && renderedPage.substring(0, 5) === '<html') {
                renderedPage = '<!DOCTYPE html>' + renderedPage;
            }

            return renderedPage;
        });
}

// expose functions
module.exports = {
    renderLayout: renderLayout,
    renderPage: renderPage,
    renderSideview: renderSideview
};
