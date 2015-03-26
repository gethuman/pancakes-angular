/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 9/3/14
 *
 * Utilities for generating directives or helping generate them. This functionality
 * should somewhat line up with the server side implementation that is in
 * pancakes.angular jng.directives.js addGenericDirectives()
 */
(function () {
    var genericDirectives = {
        'src':          'file',
        'title':        'i18n',
        'placeholder':  'i18n',
        'popover':      'i18n',
        'value':        'i18n',
        'alt':          'i18n',
        'text':         'i18n',
        'id':           null,
        'type':         null,
        'class':        null
    };

    var app = angular.module('pancakesAngular');
    var attrPascal, type;

    // function used for each of the generic directives
    function addDirective(directiveName, attrName, filterType, isBind, isBindOnce) {
        app.directive(directiveName, ['i18n', 'config', function (i18n, config) {

            function setValue(scope, element, attrs, value) {
                value = filterType === 'file' ?
                    (config.staticFileRoot + value) :
                    i18n.translate(value, scope);

                attrName === 'text' ?
                    element.text(value) :
                    attrName === 'class' ?
                        attrs.$addClass(value) :
                        attrs.$set(attrName, value, scope);
            }

            return {
                priority: 101,
                link: function linkFn(scope, element, attrs) {
                    var originalValue = attrs[directiveName];

                    // if we are binding to the attribute value
                    if (isBind) {
                        var unwatch = scope.$watch(originalValue, function (value) {
                            if (value !== undefined && value !== null) {
                                setValue(scope, element, attrs, value);

                                // if bind once, we are unwatch after the first time
                                if (isBindOnce && unwatch) { unwatch(); }
                            }
                        });
                    }

                    // else we are not binding, but we want to do some filtering
                    else if (!isBind && filterType !== null) {

                        // if the value contains {{ it means there is interpolation
                        if (originalValue.indexOf('{{') >= 0) {
                            var unobserve = attrs.$observe(directiveName, function (value) {
                                setValue(scope, element, attrs, value);
                                if (isBindOnce && unobserve) { unobserve(); }
                            });
                        }
                        // else we are very simply setting the value
                        else {
                            setValue(scope, element, attrs, originalValue);
                        }
                    }
                }
            };
        }]);
    }

    // loop through all generic directive attributes and add directives
    for (var attr in genericDirectives) {
        if (genericDirectives.hasOwnProperty(attr)) {
            attrPascal = attr.substring(0, 1).toUpperCase() + attr.substring(1);

            // no b-class because just adding class one time
            if (attr !== 'class') {
                addDirective('b' + attrPascal, attr, null, true, false);
            }

            addDirective('bo' + attrPascal, attr, null, true, true);

            // if file then do f- and bf- for static file
            type = genericDirectives[attr];
            if (type) {
                addDirective('f' + attrPascal, attr, type, false, false);
                addDirective('fo' + attrPascal, attr, type, false, true);
                addDirective('bf' + attrPascal, attr, type, true, false);
                addDirective('bfo' + attrPascal, attr, type, true, true);
            }
        }
    }
})();
