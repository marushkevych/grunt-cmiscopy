var proxyquire = require('proxyquire');
var CmisRequestMock = require('./stubs').CmisRequestMock;
var httpStub = require('./stubs').httpStub;
var fsStub = require('./stubs').fsStub;
var CmisFileProperties = require('../js/CmisFileProperties');
var versionRegistry = require('../js/VersionRegistry');

var FileIO = proxyquire('../js/FileIO', {
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

var cmisFileProperties = CmisFileProperties({
    succinctProperties: {
        "cmis:name": "test.txt",
        "cmis:objectId": 'testId',
        "cmis:contentStreamMimeType": 'text/plain',
        "cmis:versionLabel": "1.3",
        "alfcmis:nodeRef": 'nodeId'
    }
});


describe("FileUtils.uploadFile()", function() {
    var cmisSession;
    var fileIO;
    var cmisRequest;
    var refreshVersionCmisRequest = new CmisRequestMock();

    beforeEach(function() {
        cmisRequest = new CmisRequestMock();
        cmisSession = {
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("http://cmis.alfresco.com/cmisbrowser/documentid"),
            setContentStream: jasmine.createSpy('setContentStream').andReturn(cmisRequest),
            getObject: jasmine.createSpy('getObject').andReturn(refreshVersionCmisRequest)
        };
        
        fileIO = FileIO.create(cmisSession, options);

        spyOn(fsStub, 'readFile').andCallThrough();        
        spyOn(httpStub, 'get').andCallThrough();
        httpStub.reset();
        fsStub.reset();
        
        versionRegistry.setVersion("nodeId", "1.3");
    });
    
    it("should not fail if there was failure reading the file", function(done) {

        fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            expect(cmisSession.setContentStream).not.toHaveBeenCalled();
            // TODO test st out - error message
            done();
        });

        fsStub.reject('an error reading file');

    });    
    
    it("should not upload if versions dont match", function(done) {
        versionRegistry.setVersion("nodeId", "1.2");
        fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            expect(fsStub.readFile).not.toHaveBeenCalled();
            expect(httpStub.get).not.toHaveBeenCalled();
            expect(cmisSession.setContentStream).not.toHaveBeenCalled();
            done();
        });

    });
    
    it("should not upload if local version does not exist", function(done) {
        versionRegistry.setVersion("nodeId", null);
        fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            expect(fsStub.readFile).not.toHaveBeenCalled();
            expect(httpStub.get).not.toHaveBeenCalled();
            expect(cmisSession.setContentStream).not.toHaveBeenCalled();
            done();
        });

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

        it("should upload file and track new version if content is not the same", function(done) {

            
            fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
                expect(err).toBeFalsy();
                expect(cmisSession.setContentStream).toHaveBeenCalledWith('testId', 'new content', true, 'text/plain');
                expect(cmisSession.setContentStream.calls.length).toEqual(1);
                expect(versionRegistry.hasVersion("nodeId", "1.4")).toBeTruthy();
                done();
            });
            fsStub.resolve('new content');
            httpStub.resolve("old content", 200);
            
            // need to use setTimeout to let it generate checksum
            // TODO stub checksum generator
            setTimeout(function(){
                cmisRequest.resolve();
                refreshVersionCmisRequest.resolve({succinctProperties: {"cmis:versionLabel": "1.4" }});
            }, 100);
        });



        it("should not upload if content is the same", function(done) {

            fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
                expect(err).toBeFalsy();
                expect(cmisSession.setContentStream).not.toHaveBeenCalled();
                done();
            });

            fsStub.resolve('old content');
            httpStub.resolve("old content", 200);
        });

        it("should upload file and track new version when failed to get remote content with an error", function(done){
            fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
                expect(err).toBeFalsy();
                expect(cmisSession.setContentStream).toHaveBeenCalledWith('testId', 'old content', true, 'text/plain');
                expect(cmisSession.setContentStream.calls.length).toEqual(1);
                expect(versionRegistry.hasVersion("nodeId", "1.4")).toBeTruthy();
                done();
            });
            fsStub.resolve('old content');
            httpStub.reject("some error");
            
            cmisRequest.resolve();
            refreshVersionCmisRequest.resolve({succinctProperties: {"cmis:versionLabel": "1.4" }});
        });
        
        it("should upload file and track new version when failed to get remote content with non 200 status code", function(done){
            fileIO.uploadFile('tmp', cmisFileProperties, function(err) {
                expect(err).toBeFalsy();
                expect(cmisSession.setContentStream).toHaveBeenCalledWith('testId', 'old content', true, 'text/plain');
                expect(cmisSession.setContentStream.calls.length).toEqual(1);
                expect(versionRegistry.hasVersion("nodeId", "1.4")).toBeTruthy();
                done();
            });
            fsStub.resolve('old content');
            httpStub.resolve('some problem', 409);
            
            
            cmisRequest.resolve();
            refreshVersionCmisRequest.resolve({succinctProperties: {"cmis:versionLabel": "1.4" }});
        });
    });
    


});

