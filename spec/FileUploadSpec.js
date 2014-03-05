var proxyquire = require('proxyquire');
var CmisRequestMock = require('./stubs').CmisRequestMock;
var httpStub = require('./stubs').httpStub;
var fsStub = {
    readFile: function(path, callback) {
        this.callback = callback;
    },
    resolve: function(content) {
        this.callback(null, content);
    },
    reject: function(reason) {
        this.callback(reason);
    },
    reset: function() {
        this.callback = null;
    }
};

var FileUtilsFactory = proxyquire('../js/FileUtilsFactory', {
    'http': httpStub,
    'fs': fsStub
});

var options = {
    url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
    cmisRoot: '/cmis/root/',
    localRoot: 'tmp',
    username: 'adminusername',
    password: 'adminpassword'
};

describe("FileUtils.uploadFile()", function() {
    var cmisSession;
    var fileUtils;
    var cmisRequest;
    
    beforeEach(function() {
        cmisSession = {
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("http://cmis.alfresco.com/cmisbrowser/documentid")
        };
        fileUtils = FileUtilsFactory(cmisSession, options);

        spyOn(fsStub, 'readFile').andCallThrough();        
        spyOn(httpStub, 'get').andCallThrough();
        httpStub.reset();
        fsStub.reset();
        
        cmisRequest = new CmisRequestMock();
        cmisSession.setContentStream = jasmine.createSpy('setContentStream').andReturn(cmisRequest);

    });
    
    it("should not fail if there was failure reading the file", function(done) {

        fileUtils.uploadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
            expect(err).toBeFalsy();
            expect(cmisSession.setContentStream).not.toHaveBeenCalled();
            // TODO test st out - error message
            done();
        });

        fsStub.reject('an error reading file');

    });    
    
    describe("when able to read local file", function(){
        
        afterEach(function() {
            expect(fsStub.readFile).toHaveBeenCalledWith('tmp/test.txt', jasmine.any(Function));

            expect(cmisSession.getContentStreamURL).toHaveBeenCalledWith('testId');
            expect(cmisSession.getContentStreamURL.calls.length).toEqual(1);

            // should download file only once
            expect(httpStub.get).toHaveBeenCalled();
            expect(httpStub.get.calls.length).toEqual(1);
            expect(httpStub.get.mostRecentCall.args[0].href).toBe('http://cmis.alfresco.com/cmisbrowser/documentid');
            expect(httpStub.get.mostRecentCall.args[0].auth).toBe('adminusername:adminpassword');
        });

        it("should upload file if content is not the same", function(done) {
            fileUtils.uploadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
                expect(err).toBeFalsy();
                expect(cmisSession.setContentStream).toHaveBeenCalledWith('testId', 'new content', true, 'text/plain');
                expect(cmisSession.setContentStream.calls.length).toEqual(1);
                done();
            });
            fsStub.resolve('new content');
            httpStub.resolve("old content", 200);
            
            // need to use setTimeout to let it generate checksum
            // TODO stub checksum generator
            setTimeout(function(){
                cmisRequest.resolve();
            }, 1);
        });



        it("should not upload if content is the same", function(done) {

            fileUtils.uploadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
                expect(err).toBeFalsy();
                expect(cmisSession.setContentStream).not.toHaveBeenCalled();
                done();
            });

            fsStub.resolve('old content');
            httpStub.resolve("old content", 200);
        });
    });
    


});

