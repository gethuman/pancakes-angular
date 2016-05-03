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
        'class':        null,
        'maxlength':    null,
        'content':      null  // added for meta tags
    };

    var app = angular.module('pancakesAngular');
    var attrPascal, type;

    // function used for each of the generic directives
    function addDirective(directiveName, dashCase, attrName, filterType, isBind, isBindOnce, isFilter) {
        app.directive(directiveName, ['i18n', 'config', function (i18n, config) {

            function setValue(scope, element, attrs, value) {
                value = !isFilter ? value :
                    filterType === 'file' ?
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
                                if (isBindOnce && unwatch) { unwatch(); }
                            }
                        });
                    }

                    // else we are not binding, but we want to do some filtering
                    else if (!isBind && isFilter && filterType !== null) {
                        var fTextVal = (element && element.length && element[0].attributes &&
                            element[0].attributes[dashCase] && element[0].attributes[dashCase].value) || '';

                        // if the value contains {{ it means there is interpolation
                        if (fTextVal.indexOf('{{') >= 0) {
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
                    else {
                        throw new Error('Not bind nor filter in generic addDirective for ' + originalValue);
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
                addDirective('b' + attrPascal, 'b-' + attr, attr, null, true, false, false);
            }

            addDirective('bo' + attrPascal, 'bo-' + attr, attr, null, true, true, false);

            // if file then do f- and bf- for static file
            type = genericDirectives[attr];
            if (type) {
                addDirective('f' + attrPascal, 'f-' + attr, attr, type, false, false, true);
                addDirective('fo' + attrPascal, 'fo-' + attr, attr, type, false, true, true);
                addDirective('bf' + attrPascal, 'bf-' + attr, attr, type, true, false, true);
                addDirective('bfo' + attrPascal, 'bfo-' + attr, attr, type, true, true, true);
            }
        }
    }
})();
