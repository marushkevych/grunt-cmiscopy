var fs = require('fs');
var proxyquire =  require('proxyquire');
var httpStub = {
    get: function(options, callback){
        console.log(options)
        this.callback = callback;
        return {
            on: function(event, handler){
                
            }
        };
    },
    resolve: function(result){
        this.callback(result);
    }
};
var FileUtilsFactory = proxyquire('../js/FileUtilsFactory', {
    'http': httpStub
});

var options = {
    url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
    cmisRoot: '/cmis/root/',
    localRoot: 'tmp',
    username: 'adminusername',
    password: 'adminpassword'
};

describe("FileUtils", function() {
    var fileUtils;
    beforeEach(function() {
        var cmisSession = {
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("http://cmis.alfresco.com/cmisbrowser/documentid")
        };
        fileUtils = FileUtilsFactory(cmisSession, options);
        spyOn(httpStub, 'get').andCallThrough();
    });    
    
    describe("download action", function(){
        it("should download file if doesnt exist locally", function(done){
            fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(){
                expect(httpStub.get).toHaveBeenCalled();
                done();
            });
            
            var responcse = fs.createReadStream('spec/test.txt');
            responcse.statusCode = 200;
            httpStub.resolve(responcse);
        });
    });
});

