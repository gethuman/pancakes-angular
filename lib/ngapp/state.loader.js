/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/16/14
 *
 * Load given set of states into the UI router $stateProvider
 */
angular.module('pancakesAngular').provider('stateLoader', function () {

    /**
     * Helper function to get pascal case of a route name
     * @param val
     * @returns {string}
     */
    function getPascalCase(val) {
        var parts = val.split('.');
        var newVal = '';

        for (var i = 0; i < parts.length; i++) {
            newVal += parts[i].substring(0, 1).toUpperCase() + parts[i].substring(1);
        }

        return newVal;
    }

    /**
     * This is the route loader for angular where we take the input route config data
     * and load it into the UI Router
     *
     * @param $stateProvider
     * @param appName
     * @param routes
     * @param resolves
     * @param isMobile
     */
    this.loadStates = function loadStates($stateProvider, appName, routes, resolves, isMobile) {
        var stateNames = {};
        console.log('Loading states');
        angular.forEach(routes, function (route) {
            angular.forEach(route.urls, function (url, idx) {
                var sideview = route.sideview || 'default';
                var initialModel = resolves[route.name] || function () { return {}; };
                var stateName = (route.name + (idx === 0 ? '' : '--' + idx)).replace(/\./g, '-');
                var stateConfig = {
                    url: url,
                    resolve: {
                        initialModel: initialModel,
                        loadedUser: ['activeUser', function (activeUser) {
                            return activeUser.init();
                        }]
                    },
                    onEnter: ['$rootScope', function ($rootScope) {
                        $rootScope.stateData = route.data || {};
                        $rootScope.pageLoadTimestamp = (new Date()).getTime();
                    }],
                    views: {
                        '': {
                            controller:     getPascalCase(route.name + 'Ctrl'),
                            templateUrl:    'templates/' + route.name
                        }
                    }
                };
                if ( route.data ) {
                    stateConfig.data = route.data;
                }
                if ( route.ads ) {
                    stateConfig.data = stateConfig.data || {};
                    stateConfig.data.ads = route.ads;
                }

                if (!isMobile) {
                    stateConfig.views.sideview = {
                        controller:     getPascalCase(appName + '.sideview.' + sideview + '.ctrl'),
                        templateUrl:    'templates/' + appName + '.sideview.' + sideview
                    };
                }

                // need to make sure state names are unique so just add a timestamp if nothing else
                if (stateNames[stateName]) { stateName += (new Date()).getTime(); }
                stateNames[stateName] = true;

                // add state to the UI Router
                $stateProvider.state(stateName, stateConfig);
            });
        });
    };

    /**
     * This doesn't do anything because we are hijacking the provider angular type
     * so we can get this functionality into the config
     * @returns {{}}
     */
    this.$get = function () { return { getPascalCase: getPascalCase }; };
});
