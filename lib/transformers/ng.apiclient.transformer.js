/**
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This transformer used to generate an API client for angular which means a local service and model
 * classes. This does not generate any aggregation services (use ng.aggregator.transformer for that)
 */
var _ = require('lodash');

/**
 * Do the transformation
 * @param flapjack
 * @param options
 * @returns {*}
 */
function transform(flapjack, options) {
    var moduleName = options.moduleName;
    var filePath = options.filePath;
    var appName = this.getAppName(filePath, options.appName);
    var resource = this.pancakes.cook(moduleName, { flapjack: flapjack });
    var templateModel = this.getTemplateModel(options.prefix, resource, appName);
    return templateModel ? this.template(templateModel) : null;
}

/**
 * Get the template model for an API Client
 * @param prefix
 * @param resource
 * @param appName
 * @returns {*}
 */
function getTemplateModel(prefix, resource, appName) {
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
        appName:        this.getAppModuleName(prefix, appName),
        serviceName:    this.pancakes.utils.getCamelCase(resource.name + '.service'),
        modelName:      this.pancakes.utils.getPascalCase(resource.name),
        methods:        JSON.stringify(methods)
    };
}

// expose functions
module.exports = {
    transform: transform,
    getTemplateModel: getTemplateModel
};
