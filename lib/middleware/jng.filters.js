/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/21/14
 *
 * Server side Angular filters are simply added to the model
 */
var _       = require('lodash');
var fs      = require('fs');
var utils   = require('./jng.utils');
var filters = {};

/**
 * Add filters to the model. This is called by web.route.handler.js processWebRequest().
 *
 * @param model
 * @param appName
 */
function addFiltersToModel(model, appName) {
    var rootDir = this.pancakes.getRootDir();
    var apps = ['common', appName];
    var me = this;

    // if filters don't exist in memory yet for given app, get them
    if (!filters[appName]) {
        filters[appName] = {};
        _.each(apps, function (app) {
            var filtersDir = rootDir + '/app/' + app + '/filters';
            var exists = utils.doesFileExist(filtersDir);

            if (exists) {
                _.each(fs.readdirSync(filtersDir), function (fileName) {
                    var filterName = me.pancakes.utils.getCamelCase(fileName);
                    filters[appName][filterName] = me.pancakes.cook('app/' + app + '/filters/' + fileName, null);
                });
            }
        });
    }

    _.extend(model, filters[appName]);
}

// expose functions
module.exports = {
    addFiltersToModel: addFiltersToModel
};
