/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/28/14
 *
 * Star icons that are editable
 */
module.exports = function (span) {

    function editableStarIcon(fieldName, savedField, saveFn, emptyStarLessThan) {
        var fullStarGreaterThan = emptyStarLessThan - 1;
        return span({
            'class': 'icon-star',
            'ng-class': "{'icon-star':" + fieldName + "<" + emptyStarLessThan + "," +
            " 'icon-star-2':" + fieldName + ">" + fullStarGreaterThan + "}",
            'ng-mouseover': fieldName + '=' + emptyStarLessThan,
            'ng-mouseleave': fieldName + '=' + savedField,
            'gh-tap': saveFn + '(' + emptyStarLessThan + ')'
        });
    }

    return function editableStarIcons(fieldName, savedField, saveFn) {
        return [
            editableStarIcon(fieldName, savedField, saveFn, 1),
            editableStarIcon(fieldName, savedField, saveFn, 2),
            editableStarIcon(fieldName, savedField, saveFn, 3),
            editableStarIcon(fieldName, savedField, saveFn, 4),
            editableStarIcon(fieldName, savedField, saveFn, 5)
        ];
    };
};
