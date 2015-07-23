 /**
 * Author: Jeff Whelpley
 * Date: 4/16/14
 *
 * For angular clients to make ajax calls to server
 */
angular.module('pancakesAngular').factory('ajax', function ($q, $http, eventBus, config, storage, log) {

    /**
     * Send call to the server and get a response
     *
     * @param url
     * @param method
     * @param options
     * @param resourceName
     */
    function send(url, method, options, resourceName) {
        var deferred = $q.defer();
        var key, val, paramArray = [];

        url = config.apiBase + url;
        options = options || {};

        // separate out data if it exists
        var data = options.data;
        delete options.data;

        // attempt to add id to the url if it exists
        if (url.indexOf('{_id}') >= 0) {
            if (options._id) {
                url = url.replace('{_id}', options._id);
                delete options._id;
            }
            else if (data && data._id) {
                url = url.replace('{_id}', data._id);
            }
        }
        else if (method === 'GET' && options._id) {
            url += '/' + options._id;
            delete options._id;
        }

        var showErr = options.showErr !== false;
        delete options.showErr;

        // add params to the URL
        options.lang = options.lang || config.lang;
        for (key in options) {
            if (options.hasOwnProperty(key) && options[key]) {
                val = options[key];
                val = angular.isObject(val) ? JSON.stringify(val) : val;

                paramArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
            }
        }

        // add visitorId to params
        var visitorId = storage.get('visitorId');
        if (visitorId && visitorId !== 'null' && visitorId !== 'undefined') {
            paramArray.push('onBehalfOfVisitorId' + '=' + visitorId);
        }

        // add params to URL
        if (paramArray.length) {
            url += '?' + paramArray.join('&');
        }

        // set up the api options
        var apiOpts = {
            method:     method,
            url:        url
        };

        // if the jwt exists, add it to the request
        var jwt = storage.get('jwt');
        if (jwt && jwt !== 'null') {  // hack fix; someone setting localStorage to 'null'
            apiOpts.headers = {
                Authorization: jwt
            };
        }

        // add data to api options if available
        if (data) {
            apiOpts.data = data;
        }

        // emit events for start and end so realtime services can stop syncing for post
        eventBus.emit(resourceName + '.' + method.toLowerCase() + '.start');

        // finally make the http call
        $http(apiOpts)
            .success(function (respData) {
                deferred.resolve(respData);
            })
            .error(function (err, status, headers, conf) {
                err = err || new Error('Unknown ajax error');

                if (showErr) {
                    eventBus.emit('error.api', err);
                }

                // todo: remove this once have debugged issues
                log.error(err, {
                    apiOpts: apiOpts,
                    status: status,
                    headers: headers,
                    config: conf
                });

                deferred.reject(err);
            })
            .finally(function () {
                eventBus.emit(resourceName + '.' + method.toLowerCase() + '.end');
            });

        return deferred.promise;
    }

    // expose send
    return {
        send: send
    };
});
