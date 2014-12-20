var fs = require('fs');
var proxyquire = require('proxyquire');
var versionRegistry = require('../js/VersionRegistry');
var httpStub = require('./stubs').httpStub;
var CmisFileProperties = require('../js/CmisFileProperties');
var FileIO = proxyquire('../js/FileIO', {
    'http': httpStub
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

describe("FileUtils.downloadFile()", function() {
    var cmisSession;
    var fileIO;
    
    beforeEach(function() {
        cmisSession = {
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("http://cmis.alfresco.com/cmisbrowser/documentid")
        };
        fileIO = FileIO.create(cmisSession, options);

        spyOn(httpStub, 'get').andCallThrough();
        httpStub.reset();
        versionRegistry.setVersion("nodeId", "1.2");
    });

    afterEach(function() {
        // both downloadFile() and uploadFile() should download file to check if content is changed

        expect(cmisSession.getContentStreamURL).toHaveBeenCalledWith('testId');
        expect(cmisSession.getContentStreamURL.calls.length).toEqual(1);

        // should download file only once
        expect(httpStub.get).toHaveBeenCalled();
        expect(httpStub.get.calls.length).toEqual(1);
        expect(httpStub.get.mostRecentCall.args[0].href).toBe('http://cmis.alfresco.com/cmisbrowser/documentid');
        expect(httpStub.get.mostRecentCall.args[0].auth).toBe('adminusername:adminpassword');
    });

    it("should download file and track version if file doesnt exist locally", function(done) {
        versionRegistry.setVersion("nodeId", null);
        fileIO.downloadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("new file");
            expect(versionRegistry.hasVersion("nodeId", "1.3")).toBeTruthy();
            done();
        });
        if(fs.existsSync('tmp/test.txt')){
            fs.unlinkSync('tmp/test.txt');
        }
        expect(fs.existsSync('tmp/test.txt')).toBeFalsy();

        // trigger server response
        httpStub.resolve("new file", 200);
    });

    it("should overwrite file and track version if exist locally but contents is different", function(done) {
        fileIO.downloadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("new content");
            expect(versionRegistry.hasVersion("nodeId", "1.3")).toBeTruthy();
            done();
        });

        fs.writeFileSync('tmp/test.txt', "old content");
        expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");

        // trigger server response
        httpStub.resolve("new content", 200);
    });

    it("should not overwrite file if file content is the same, but should track version", function(done) {
        var mtime;
        fileIO.downloadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            // file should not have been modified
            expect(fs.statSync('tmp/test.txt').mtime.getTime()).toBe(mtime);
            expect(versionRegistry.hasVersion("nodeId", "1.3")).toBeTruthy();
            done();
        });

        fs.writeFileSync('tmp/test.txt', "same content");
        expect(fs.readFileSync('tmp/test.txt').toString()).toBe("same content");
        mtime = fs.statSync('tmp/test.txt').mtime.getTime();

        // trigger server response
        setTimeout(function() {
            httpStub.resolve("same content", 200);
        }, 1000);
    });

    it("should ignore if http status is not 200, should not change version in registry", function(done) {
        fileIO.downloadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBeFalsy();
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");
            expect(versionRegistry.hasVersion("nodeId", "1.2")).toBeTruthy();
            // TODO test st out - error message
            done();
        });

        fs.writeFileSync('tmp/test.txt', "old content");
        expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");

        httpStub.resolve("some problem", 409);
    });

    it("should fail if http request fails with error", function(done) {
        fileIO.downloadFile('tmp', cmisFileProperties, function(err) {
            expect(err).toBe("some error");
            // should note change version in registry
            expect(versionRegistry.hasVersion("nodeId", "1.2")).toBeTruthy();
            // TODO test st out - error message
            done();
        });

        httpStub.reject("some error");
    });



});

