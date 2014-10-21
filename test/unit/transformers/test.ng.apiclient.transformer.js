/**
 * Author: Jeff Whelpley
 * Date: 10/18/14
 *
 *
 */
var name        = 'transformers/ng.apiclient.transformer';
var taste       = require('../../taste');
var transformer = taste.target(name);

describe('UNIT ' + name, function () {
    var appName = 'testApp';

    describe('getTemplateModel()', function () {
        it('should null if no api', function () {
            var resource = { name: 'blah' };
            var actual = transformer.getTemplateModel(resource, appName);
            taste.expect(actual).to.be.null;
        });

        it('should return a model from a given resource', function () {
            var resource = {
                name: 'post',
                adapters: { browser: 'restapi' },
                api: {
                    GET: {
                        '/posts':       'find',
                        '/posts/{_id}': 'findById'
                    },
                    POST: {
                        '/posts':       'create'
                    },
                    PUT: {
                        '/posts/{_id}': 'update'
                    },
                    DELETE: {
                        '/posts/{_id}': 'remove'
                    }
                }
            };
            var expected = {
                appName: appName,
                resourceName: resource.name,
                serviceName: 'postService',
                modelName: 'Post',
                methods: {
                    find: { httpMethod: 'GET', url: '/posts' },
                    findById: { httpMethod: 'GET', url: '/posts/{_id}' },
                    create: { httpMethod: 'POST', url: '/posts' },
                    update: { httpMethod: 'PUT', url: '/posts/{_id}' },
                    remove: { httpMethod: 'DELETE', url: '/posts/{_id}' }
                }
            };

            var actual = transformer.getTemplateModel(resource, appName);
            actual.should.deep.equal(expected);
        });
    });

    describe('transform()', function () {
        var model = {
            appName: appName,
            resourceName: 'post',
            serviceName: 'postService',
            modelName: 'Post',
            methods: {
                find: { httpMethod: 'GET', url: '/posts' },
                create: { httpMethod: 'POST', url: '/posts' }
            }
        };

        var code = transformer.template(model);
        taste.validateCode(code).should.equal(true);
    });
});