/**
 * Author: Jeff Whelpley
 * Date: 10/18/14
 *
 *
 */
describe('UNIT tpl.helper', function () {

    beforeEach(module('pancakesAngular'));

    describe('setDefaults()', function () {
        it('should return wo changes if no defaults', inject(function (tplHelper) {
            var scope = { foo: 'choo' };
            var defaults = null;
            var expected = JSON.parse(JSON.stringify(scope));
            tplHelper.setDefaults(scope, defaults);
            scope.should.deep.equal(expected);
        }));
    });
});

/*
 it('should override a version and test the new version is injected',function(){    // module() takes functions or strings (module aliases)    module(function($provide){      $provide.value('version','overridden');// override version here    });    inject(function(version){      expect(version).toEqual('overridden');    });  });
* */
