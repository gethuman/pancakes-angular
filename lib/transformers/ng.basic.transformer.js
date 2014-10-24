/**
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This is used to transform a pancakes originalModule module into an Angular
 * util (i.e. Angular service via factory()
 */
var _ = require('lodash');

/**
 * Transform a given module
 * @param flapjack
 * @param options
 */
function transform(flapjack, options) {
    var filePath = options.filePath;
    var appName = options.appName || this.getAppName(filePath);
    flapjack = this.checkIngredients(flapjack, options);

    // if no flapjack, return without doing anything
    if (!flapjack) { return null; }

    var defaults = options.defaults && !_.isString(options.defaults) ?
        JSON.stringify(options.defaults) : null;

    // get the param info and then generate the template
    var paramInfo = this.getFilteredParamInfo(flapjack, options);
    return this.template({
        defaults:           defaults,
        raw:                options.raw,
        ngType:             options.ngType,
        appName:            this.getAppModuleName(options.ngPrefix, appName),
        moduleName:         options.moduleName,
        includeName:        options.ngType !== 'config',        // don't include a module name for confing declarations
        params:             paramInfo.list,
        convertedParams:    paramInfo.converted,
        ngrefs:             paramInfo.ngrefs,
        body:               this.getModuleBody(flapjack)
    });
}

/**
 * Check to make sure the flapjack has the right ingredients
 * (i.e. is a valid potential module)
 *
 * @param flapjack
 * @param options
 */
function checkIngredients(flapjack, options) {
    options = options || {};

    // If original module is not a function but has client function, use that
    if (flapjack && !_.isFunction(flapjack) && flapjack.client) {
        flapjack = flapjack.client;
    }
    // else if dealing with factory and no client annotation (i.e. it's server only), return null
    else if (flapjack && options.ngType === 'factory' && !options.isClient) {
        var moduleInfo = this.getModuleInfo(flapjack) || {};
        if (!moduleInfo.client) { return null; }
    }

    return flapjack;
}

// expose functions
module.exports = {
    transform: transform,
    checkIngredients: checkIngredients
};
