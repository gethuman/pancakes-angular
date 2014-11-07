/**
 * Author: Jeff Whelpley
 * Date: 11/7/14
 *
 *
 */
angular.module('pancakesAngular').factory('serviceHelper', function (ajax) {

    /**
     * Generate a service method
     * @param method
     * @returns {Function}
     */
    function genServiceMethod(method) {
        return function (req) {
            return ajax.send(method.url, method.httpMethod, req, method.resourceName);
        };
    }

    /**
     * Generate a service based on a set of methods
     * @param methods
     */
    function genService(methods) {
        var service = {};

        for (var methodName in methods) {
            if (methods.hasOwnProperty(methodName)) {
                service[methodName] = genServiceMethod(methods[methodName]);
            }
        }

        return service;
    }

    //function genModelMethod(methodName, serviceMethod) {
    //    return function (req) {
    //
    //        // in the future we may
    //
    //        return serviceMethod(req);
    //    };
    //}

    /**
     * Generate a model off the service
     */
    function genModel(service) {
        var model = function (data) {
            this.data = data;
        };

        model.prototype.save = function () {
            return (this.data && this.data._id) ?
                service.update({ data: this.data }) :
                service.create({ data: this.data });
        };

        angular.extend(model, service);

        //for (var methodName in service) {
        //    if (service.hasOwnProperty(methodName)) {
        //        model[methodName] = genModelMethod(methodName, service[methodName]);
        //    }
        //}

        return model;
    }

    // expose functions
    return {
        genServiceMethod: genServiceMethod,
        genService: genService,
        genModel: genModel
    };
});
