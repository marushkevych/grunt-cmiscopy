var cmisSessionMock = require('./cmisSessionMock');
var cmisCopyFactory = require('../js/CmisCopyFactory');
var grunt = require('grunt');


describe("CmisCopyTask", function(){
    
    var options = {
        url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
        cmisRoot: '/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root/',
        localRoot: 'src/webapp/',
        username: 'adminusername',
        password: 'adminpassword'        
    };
    
    describe("initialization", function(){
        
        it("should remove trailing slash from configured paths", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSessionMock, grunt, options, null, null);

            expect(cmisCopyTask.cmisPath).toBe('/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root');
            expect(cmisCopyTask.localPath).toBe('src/webapp');
        });

        it("should append path provided as first cmd line arg", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSessionMock, grunt, options, "pages/member/", null);

            expect(cmisCopyTask.cmisPath).toBe('/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root/pages/member');
            expect(cmisCopyTask.localPath).toBe('src/webapp/pages/member');
        });

        it("with no action shoud use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSessionMock, grunt, options, null, null);

            expect(cmisCopyTask.action).toBe('download');
        });

        it("with 'upload' action should use 'upload'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSessionMock, grunt, options, null, 'upload');

            expect(cmisCopyTask.action).toBe('upload');
        });

        it("with 'download' action should use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSessionMock, grunt, options, null, 'download');

            expect(cmisCopyTask.action).toBe('download');
        });
        
        it("with invalid action should result in error", function(){
            expect(function(){cmisCopyFactory(cmisSessionMock, grunt, options, null, 'foo');}).toThrow(new Error("Invalid action: foo"));
        });
    });
    
    
});

