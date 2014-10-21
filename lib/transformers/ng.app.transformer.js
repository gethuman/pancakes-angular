/**
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This transformer will the app definition and the schema definitions
 */
var _        = require('lodash');
var pancakes = require('pancakes');

/**
 * Inherit from the base constructor
 * @constructor
 */
function AppTransformer() {
    pancakes.BaseTransformer.call(this, pancakes, __dirname, 'ng.app');
}

_.extend(AppTransformer.prototype, pancakes.BaseTransformer.prototype, {

    /**
     * Get the stringified version of the schem
     * @param appInfo
     * @param resources
     * @returns {*}
     */
    getSchemaValidations: function getSchemaValidations(appInfo, resources) {
        if (!appInfo.includeSchemas) { return null; }

        // if resources not passed in, then get from pancakes
        resources = resources || pancakes.cook('resources', null);

        var validations = {};
        _.each(resources, function (resource) {
            _.each(resource.fields, function (fieldDef, fieldName) {
                if (fieldDef.ui) {
                    validations[resource.name] = validations[resource.name] || {};
                    validations[resource.name][fieldName] = fieldDef;
                }
            });
        });

        return validations;
    },

    /**
     * Stringify the validations object
     * @param validations
     * @returns {*}
     */
    stringify: function stringify(validations) {
        if (!validations) { return ''; }

        return JSON.stringify(validations, function (key, value) {
            if (_.isRegExp(value)) { return value.toString(); }

            switch (value) {
                case String:    return 'String';
                case Boolean:   return 'Boolean';
                case Date:      return 'Date';
                case Number:    return 'Number';
                default:        return value;
            }
        });
    },

    /**
     * Pull together the template model and generate the template
     * @param flapjack
     * @param options
     * @returns {Q}
     */
    transform: function transform(flapjack, options) {
        var filePath = options.filePath;
        var appInfo = pancakes.cook(flapjack, null);
        var validations = this.getSchemaValidations(appInfo);
        var schema = this.stringify(validations);

        return this.template({
            appName:    this.getAppName(filePath, options.ngPrefix),
            deps:       appInfo.clientDependencies || [],
            schema:     schema
        });
    }
});

// return a singleton instance of this transformer
module.exports =  new AppTransformer();





/*


 $rootScope.utils = {};
 {{~it.attach :item:index}}$rootScope.utils.{{=item}} = {{=item}};
 {{~}}


// var attachToScope = (appInfo.attachToClientScope || []).concat(appInfo.attachToScope || []);


 var me = this;

 // add auto-generated attributes
 var directives = [];
 _.each(appInfo.attributeDirectives, function (filterType, attr) {
 var attributeDirectives = directiveHelper.makeAttributeDirectives(attr, filterType);
 _.each(attributeDirectives, function (flapjack, directiveName) {
 var aliases = annotationHelper.getClientAliases(flapjack) || [];
 var params = annotationHelper.getParameters(flapjack) || [];
 var paramInfo = me.getParamInfo(params, aliases) || {};

 directives.push({
 flapjack:           pancakes.cook(flapjack, null),
 name:               utensils.getCamelCase(directiveName),
 params:             paramInfo.list || [],
 convertedParams:    paramInfo.converted || [],
 ngrefs:             paramInfo.ngrefs,
 attr:               attr
 });
 });
 });


 {{~it.directives :directive}}
 angular.module('{{=it.appName}}').directive('{{=directive.name}}', [
 {{~directive.convertedParams :param}}'{{=param}}', {{~}}
 function ({{~directive.params :param:index}}{{=param}}{{? index < (directive.params.length - 1) }}, {{?}}{{~}}) {
 {{~directive.ngrefs :param}}
 var {{=param}} = angular;
 {{~}}

 var directiveNameCamel = '{{=directive.name}}';
 var attr = '{{=directive.attr}}';

 return {{=directive.flapjack}};
 }
 ]);
 {{~}}



 */


