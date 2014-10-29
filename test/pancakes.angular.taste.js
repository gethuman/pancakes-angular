/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 2/10/14
 *
 * This is a wrapper for all libs needed for testing
 */
var _               = require('lodash');
var taste           = require('taste');
var path            = require('path');
var pancakes        = require('pancakes');
var jshint          = require('jshint').JSHINT;
var prettyjson      = require('prettyjson');
var fs              = require('fs');
var dot             = require('dot');

var pancakesAngularTaste = _.extend({}, taste);

// universally set strip to false for dot templates (i.e. respect whitespace)
dot.templateSettings.strip = false;

pancakes.init({
    preload:        ['utils'],
    rootDir:        __dirname + '/fixtures',
    require:        require,
    container:      'webserver',
    clientPlugin:   function () {},
    serverPlugin:   function () {},
    pluginOptions: {
        prefix:         'gh',
        clientType:     'ng',
        ngType:         'factory',
        transformer:    'basic',
        appName:        'common'
    },
    adapterMap:     {}
});

/**
 * eval code with a mock angular object
 * @param code
 * @param isRaw
 */
pancakesAngularTaste.validateCode = function validateCode(code, isRaw) {
    var success = isRaw ?
        jshint('var blah = ' + code + ';') :
        jshint(code);

    if (!success) {
        console.log('\n\nerror with the following generated code:\n\n' + code + '\n');
        console.log('JSHINT ERRORS\n' + prettyjson.render(jshint.errors));
    }

    return success;
};

/**
 * Get a dot template
 * @param name
 * @returns {*}
 */
pancakesAngularTaste.getTemplate = function getTemplate(name) {
    var filePath = __dirname + '/../lib/transformers/ng.' + name + '.template';
    var file = fs.readFileSync(path.normalize(filePath));
    return dot.template(file);
};

// expose the pancakes angular taste object
module.exports = pancakesAngularTaste;




