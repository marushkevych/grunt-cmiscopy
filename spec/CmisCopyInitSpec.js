var proxyquire = require('proxyquire');

// inject cmisSessionStub
var cmisSession = {};
var CmisCopy = proxyquire('../js/CmisCopy', {
    'cmis': {
        createSession: function(){
            return cmisSession;
        }
    }
});

describe("CmisCopyTask initialization", function() {

    var options = {
        url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
        cmisRoot: '/cmis/root/',
        localRoot: 'local/root/',
        username: 'adminusername',
        password: 'adminpassword'
    };

    cmisSession.setCredentials = jasmine.createSpy('setCredentials');
    
    afterEach(function() {
        expect(cmisSession.setCredentials).toHaveBeenCalledWith('adminusername', 'adminpassword');
    });    

    it("should remove trailing slash from configured paths", function() {
        var cmisCopyTask = CmisCopy.create(options, null, null);

        expect(cmisCopyTask.cmisPath).toBe('/cmis/root');
        expect(cmisCopyTask.localPath).toBe('local/root');
    });

    it("should append path provided as first cmd line arg", function() {
        var cmisCopyTask = CmisCopy.create(options, "pages/member", null);

        expect(cmisCopyTask.cmisPath).toBe('/cmis/root/pages/member');
        expect(cmisCopyTask.localPath).toBe('local/root/pages/member');
    });
    
    it("should remove trailing slash from the path provided as first cmd line arg", function() {
        var cmisCopyTask = CmisCopy.create(options, "pages/member/", null);

        expect(cmisCopyTask.cmisPath).toBe('/cmis/root/pages/member');
        expect(cmisCopyTask.localPath).toBe('local/root/pages/member');
    });
    
    it("should remove leading slash from the path provided as first cmd line arg", function() {
        var cmisCopyTask = CmisCopy.create(options, "/pages/member/", null);

        expect(cmisCopyTask.cmisPath).toBe('/cmis/root/pages/member');
        expect(cmisCopyTask.localPath).toBe('local/root/pages/member');
    });

    it("with no action shoud use 'download'", function() {
        var cmisCopyTask = CmisCopy.create(options, null, null);
        expect(cmisCopyTask.action).toBe('download');
    });

    it("with 'upload' action should use 'upload'", function() {
        var cmisCopyTask = CmisCopy.create(options, null, 'upload');
        expect(cmisCopyTask.action).toBe('upload');
    });

    it("with 'u' action should use 'upload'", function() {
        var cmisCopyTask = CmisCopy.create(options, null, 'u');
        expect(cmisCopyTask.action).toBe('upload');
    });

    it("with 'download' action should use 'download'", function() {
        var cmisCopyTask = CmisCopy.create(options, null, 'download');
        expect(cmisCopyTask.action).toBe('download');
    });

    it("with 'd' action should use 'download'", function() {
        var cmisCopyTask = CmisCopy.create(options, null, 'd');
        expect(cmisCopyTask.action).toBe('download');
    });

    it("with invalid action should result in error", function() {
        expect(function() {
            CmisCopy.create(options, null, 'foo');
        }).toThrow(new Error("Invalid action: foo"));
    });


});

