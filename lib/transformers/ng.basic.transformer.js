/**
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This is used to transform a pancakes originalModule module into an Angular
 * util (i.e. Angular service via factory()
 */
var _        = require('lodash');
var pancakes = require('pancakes');

/**
 * Constructor sets the template by calling the parent constructor
 * @constructor
 */
function BasicTransformer() {
    pancakes.BaseTransformer.call(this, pancakes, __dirname, 'ng.basic');
}

// add all the functions
_.extend(BasicTransformer.prototype, pancakes.BaseTransformer.prototype, {

    /**
     * Check to make sure the flapjack has the right ingredients
     * (i.e. is a valid potential module)
     *
     * @param flapjack
     * @param options
     */
    checkIngredients: function checkIngredients(flapjack, options) {
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
    },

    /**
     * Transform a given module
     * @param flapjack
     * @param options
     */
    transform: function transform(flapjack, options) {
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
            appName:            options.appName,
            moduleName:         options.moduleName,
            includeName:        options.ngType !== 'config',        // don't include a module name for confing declarations
            params:             paramInfo.list,
            convertedParams:    paramInfo.converted,
            ngrefs:             paramInfo.ngrefs,
            body:               this.getModuleBody(flapjack)
        });
    }
});

// return a singleton instance of this transformer
module.exports = new BasicTransformer();