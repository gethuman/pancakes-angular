/**
 * Author: Jeff Whelpley
 * Date: 4/22/14
 *
 * Change the HTML page settings
 */
angular.module('pancakesAngular').factory('pageSettings', function ($window, $rootElement) {

    /**
     * Set the page title and description
     * @param title
     * @param description
     */
    function updateHead(title, description) {
        description = (description || '').replace(/"/g, '');
        $window.document.title = title;
        var metaDesc = angular.element($rootElement.find('meta[name=description]')[0]);
        metaDesc.attr('content', description);
    }

    /**
     * Update the class name used to key off all styles on the page
     * @param pageName
     */
    function updatePageStyle(pageName) {
        var pageCssId = 'gh-' + pageName.replace('.', '-');
        var elem = $rootElement.find('.maincontent');

        if (elem && elem.length) {
            elem = angular.element(elem[0]);
            elem.attr('id', pageCssId);
        }
    }

    // expose functions
    return {
        updateHead: updateHead,
        updatePageStyle: updatePageStyle
    };
});

