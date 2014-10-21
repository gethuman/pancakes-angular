/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Server side Angular filters are simply added to the model
 */
var _           = require('lodash');
var fs          = require('fs');
var pancakes    = require('pancakes');
var filters;

/**
 * Add filters to the model. This is called by web.route.handler.js processWebRequest().
 *
 * @param model
 * @param appName
 */
function addFiltersToModel(model, appName) {
    var rootDir = pancakes.getRootDir();
    var apps = ['common', appName];

    // if filters don't exist in memory yet, get them
    if (!filters) {
        filters = {};
        _.each(apps, function (app) {
            var filtersDir = rootDir + '/app/' + app + '/filters';
            if (fs.existsSync(filtersDir)) {
                _.each(fs.readdirSync(filtersDir), function (fileName) {
                    var filterName = pancakes.utils.getCamelCase(fileName);
                    filters[filterName] = pancakes.cook('app/' + app + '/filters/' + fileName, null);
                });
            }
        });
    }

    _.extend(model, filters);
}

// expose functions
module.exports = {
    addFiltersToModel: addFiltersToModel
};
