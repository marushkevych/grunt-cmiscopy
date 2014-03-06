var fs = require('fs');
var proxyquire = require('proxyquire');
var httpStub = require('./stubs').httpStub;
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

describe("FileUtils.downloadFile()", function() {
    var cmisSession;
    var fileUtils;
    
    beforeEach(function() {
        cmisSession = {
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("http://cmis.alfresco.com/cmisbrowser/documentid")
        };
        fileUtils = FileUtilsFactory(cmisSession, options);

        spyOn(httpStub, 'get').andCallThrough();
        httpStub.reset();
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

    it("should download file if doesnt exist locally", function(done) {
        fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
            expect(err).toBeFalsy();
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("new file");
            done();
        });
        if(fs.existsSync('tmp/test.txt')){
            fs.unlinkSync('tmp/test.txt');
        }
        expect(fs.existsSync('tmp/test.txt')).toBeFalsy();

        // trigger server response
        httpStub.resolve("new file", 200);
    });

    it("should overwrite file if exist locally but contents is different", function(done) {
        fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
            expect(err).toBeFalsy();
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("new content");
            done();
        });

        fs.writeFileSync('tmp/test.txt', "old content");
        expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");

        // trigger server response
        httpStub.resolve("new content", 200);
    });

    it("should not overwrite file if file content is the same", function(done) {
        var mtime;
        fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
            expect(err).toBeFalsy();
            // file should not have been modified
            expect(fs.statSync('tmp/test.txt').mtime.getTime()).toBe(mtime);
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

    it("should ignore if http status is not 200", function(done) {
        fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
            expect(err).toBeFalsy();
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");
            // TODO test st out - error message
            done();
        });

        fs.writeFileSync('tmp/test.txt', "old content");
        expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");

        httpStub.resolve("some problem", 409);
    });

    it("should fail if http request fails with error", function(done) {
        fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
            expect(err).toBe("some error");
            // TODO test st out - error message
            done();
        });

        httpStub.reject("some error");
    });



});

