var fs = require('fs');
var grunt = require('grunt');
var resumer = require('resumer');
var proxyquire = require('proxyquire');
var httpStub = {
    get: function(options, callback) {
        this.callback = callback;
        return {
            on: function(event, handler) {
                httpStub[event] = handler;
            }
        };
    },
    resolve: function(content, statusCode) {
        // stream content
        var stream = resumer().queue(content).end();
        stream.statusCode = statusCode;
        this.callback(stream);
    },
    reject: function(reason){
        // call 'error' even handler
        this.error({message: reason});
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
    describe("download action", function() {

        var fileUtils;
        beforeEach(function() {
            var cmisSession = {
                getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("http://cmis.alfresco.com/cmisbrowser/documentid")
            };
            fileUtils = FileUtilsFactory(cmisSession, options);
            spyOn(httpStub, 'get').andCallThrough();
        });

        afterEach(function() {
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

            grunt.file.delete('tmp/test.txt');
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
            }, 1000)
        });

        it("should ignore if http status is not 200", function(done) {
            fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
                expect(err).toBeFalsy();
                expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");
                done();
            });

            fs.writeFileSync('tmp/test.txt', "old content");
            expect(fs.readFileSync('tmp/test.txt').toString()).toBe("old content");

            httpStub.resolve("some problem", 409);
        });
        
        it("should fail if http request fails with error", function(done){
            fileUtils.downloadFile('tmp', 'test.txt', 'testId', 'text/plain', function(err) {
                expect(err).toBe("some error");
                done();
            });

            httpStub.reject("some error");            
        });
        
    });
});

