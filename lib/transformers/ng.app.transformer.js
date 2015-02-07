/**
 * Author: Jeff Whelpley
 * Date: 4/15/14
 *
 * This transformer will the app definition and the schema definitions
 */
var _ = require('lodash');

/**
 * Pull together the template model and generate the template
 * @param flapjack
 * @param options
 * @returns {Q}
 */
function transform(flapjack, options) {
    var filePath = options.filePath;
    var appName = this.getAppName(filePath, options.appName);
    var appInfo = this.pancakes.cook(flapjack, null);
    var validations = this.getSchemaValidations(appInfo, null);
    var schema = this.stringify(validations);

    return this.template({
        appName:    this.getAppModuleName(options.prefix, appName),
        deps:       appInfo.clientDependencies || [],
        initLoad:   appInfo.clientLoadOnInit,
        schema:     schema,
        pageHelper: appName === 'common' ? options.pageHelper.clientRegistrations : null
    });
}

/**
 * Get the stringified version of the schem
 * @param appInfo
 * @param resources
 * @returns {*}
 */
function getSchemaValidations(appInfo, resources) {
    if (!appInfo.includeSchemas) { return null; }

    // if resources not passed in, then get from pancakes
    resources = resources || this.pancakes.cook('resources', null);

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
}

/**
 * Stringify the validations object
 * @param validations
 * @returns {*}
 */
function stringify(validations) {
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
}

// expose functions
module.exports = {
    transform: transform,
    getSchemaValidations: getSchemaValidations,
    stringify: stringify
};
