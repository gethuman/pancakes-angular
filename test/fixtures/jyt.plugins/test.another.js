/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 10/28/14
 *
 * Basic star icons
 */
module.exports = function (span) {

    function starIcon(fieldName, emptyStarLessThan) {
        var fullStarGreaterThan = emptyStarLessThan - 1;
        return span({
            'class': 'icon-star',
            'ng-class': "{'icon-star':" + fieldName + "<" + emptyStarLessThan + "," +
            " 'icon-star-2':" + fieldName + ">" + fullStarGreaterThan + "}"
        });
    }

    return function starIcons(fieldName) {
        return [
            starIcon(fieldName, 1),
            starIcon(fieldName, 2),
            starIcon(fieldName, 3),
            starIcon(fieldName, 4),
            starIcon(fieldName, 5)
        ];
    };
};
