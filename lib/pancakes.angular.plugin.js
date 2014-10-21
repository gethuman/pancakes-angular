/**
 * Author: Jeff Whelpley
 * Date: 10/15/14
 *
 * This will be the main interface for the Angular plugin
 */
var jngDirectives   = require('./middleware/jng.directives');
var jngPages        = require('./middleware/jng.pages');

/**
 * Call transformer transform function
 * @param name
 * @param flapjack
 * @param options
 * @returns {*}
 */
function transform(name, flapjack, options) {
    var transformer = require('./' + name + '.transformer');
    return transformer.transform(flapjack, options);
}

// expose functions
module.exports = {
    transform:      transform,
    init:           jngDirectives.addDirectives,
    renderPage:     jngPages.renderPage
};