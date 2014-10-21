/**
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This transformer used to generate an API client for angular which means a local service and model
 * classes. This does not generate any aggregation services (use ng.aggregator.transformer for that)
 */
var _           = require('lodash');
var pancakes    = require('pancakes');

/**
 * Inherit from the base transformer
 * @constructor
 */
function ApiClientTransformer() {
    pancakes.BaseTransformer.call(this, pancakes, __dirname, 'ng.apiclient');
}

_.extend(ApiClientTransformer.prototype, pancakes.BaseTransformer.prototype, {

    /**
     * Take a resource file and transform it into a client side service
     *
     * @param flapjack
     * @param options
     */
    transform: function transform(flapjack, options) {
        var moduleName = options.moduleName;
        var resource = pancakes.cook(moduleName, { flapjack: flapjack });
        var templateModel = this.getTemplateModel(resource, options.appName);
        return templateModel ? this.template(templateModel) : null;
    },

    /**
     * Given a set of inputs, generate the model data that will be used for a given template
     * @param resource
     * @param appName
     */
    getTemplateModel: function getTemplateModel(resource, appName) {
        var methods = {};

        // if no api or browser restapi, then return null since we will skip
        if (!resource.api || resource.adapters.browser !== 'restapi') {
            return null;
        }

        // loop through API routes and create method objects for the template
        _.each(resource.api, function (urlMappings, httpMethod) {
            _.each(urlMappings, function (methodName, url) {
                methods[methodName] = {
                    httpMethod: httpMethod,
                    url: url
                };
            });
        });

        return {
            resourceName:   resource.name,
            appName:        appName,
            serviceName:    pancakes.utils.getCamelCase(resource.name + '.service'),
            modelName:      pancakes.utils.getPascalCase(resource.name),
            methods:        methods
        };
    }
});


// return a singleton instance of this transformer
module.exports = new ApiClientTransformer();




// not needed in template unless we want to use models (i.e. Post instead of postService)
/*

// This is commented out for now, but if we want to expose models instead or
// in addition to services use this in the template

 angular.module('{{=it.appName}}').factory('{{=it.modelName}}', [
 '{{=it.serviceName}}',
 function ({{=it.serviceName}}) {

 var {{=it.modelName}} = function (data) {
 this.data = data;
 };

 angular.extend({{=it.modelName}}, {{=it.serviceName}});

 {{=it.modelName}}.prototype.save = function () {
 return this.data && this.data._id ?
 {{=it.serviceName}}.update(this.data) :
 {{=it.serviceName}}.create(this.data);
 };
 }
 ]);
*/