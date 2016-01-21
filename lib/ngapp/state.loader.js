/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 4/16/14
 *
 * Load given set of states into the UI router $stateProvider
 */
angular.module('pancakesAngular').provider('stateLoader', function () {

    var stateCounter = 0;

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
                    data: route.data,
                    onEnter: ['$rootScope', 'modals', function ($rootScope, modals) {
                        $rootScope.stateData = route.data || {};
                        $rootScope.modals = modals;
                        $rootScope.pageLoadTimestamp = (new Date()).getTime();
                    }],
                    views: {
                        '': {
                            controller:     getPascalCase(route.name + 'Ctrl'),
                            templateUrl:    'templates/' + route.name
                        }
                    }
                };
                if (route.data) {
                    stateConfig.data = route.data;
                }
                if (route.ads) {
                    stateConfig.data = stateConfig.data || {};
                    stateConfig.data.ads = route.ads;
                }

                //TODO: need to have better way of not including sideview

                if (!isMobile) {
                    stateConfig.views.sideview = {
                        controller:     getPascalCase(appName + '.sideview.' + sideview + '.ctrl'),
                        templateUrl:    'templates/' + appName + '.sideview.' + sideview
                    };
                }

                // need to make sure state names, so add a number if nothing else
                if (stateNames[stateName]) {
                    stateName += stateCounter;
                    stateCounter++;
                }
                stateNames[stateName] = true;

                // add state to the UI Router
                try {
                    $stateProvider.state(stateName, stateConfig);
                }
                catch (ex) {
                    /* eslint no-console:0 */
                    console.error(ex);
                }
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
