var cmisCopyFactory = require('../js/CmisCopyFactory');
var grunt = require('grunt');
var CmisRequestMock = require('./CmisRequestMock');


describe("CmisCopyTask", function(){
    
    var options = {
        url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
        cmisRoot: '/cmis/root/',
        localRoot: 'local/root/',
        username: 'adminusername',
        password: 'adminpassword'        
    };
    
    describe("initialization", function(){
        
        it("should remove trailing slash from configured paths", function(){
            var cmisCopyTask = cmisCopyFactory(null, null, grunt, options, null, null);

            expect(cmisCopyTask.cmisPath).toBe('/cmis/root');
            expect(cmisCopyTask.localPath).toBe('local/root');
        });

        it("should append path provided as first cmd line arg", function(){
            var cmisCopyTask = cmisCopyFactory(null, null, grunt, options, "pages/member/", null);

            expect(cmisCopyTask.cmisPath).toBe('/cmis/root/pages/member');
            expect(cmisCopyTask.localPath).toBe('local/root/pages/member');
        });

        it("with no action shoud use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(null, null, grunt, options, null, null);

            expect(cmisCopyTask.action).toBe('download');
        });

        it("with 'upload' action should use 'upload'", function(){
            var cmisCopyTask = cmisCopyFactory(null, null, grunt, options, null, 'upload');

            expect(cmisCopyTask.action).toBe('upload');
        });

        it("with 'download' action should use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(null, null, grunt, options, null, 'download');

            expect(cmisCopyTask.action).toBe('download');
        });
        
        it("with invalid action should result in error", function(){
            expect(function(){cmisCopyFactory(null, null, grunt, options, null, 'foo');}).toThrow(new Error("Invalid action: foo"));
        });
    });
    
    describe("runTask", function(){
        var done = jasmine.createSpy('done');
        var testFileCmisProps = {
            'cmis:name': {value: 'test.html'},
            'cmis:objectId': {value: '12345'}
        };
        var otherFileCmisProps = {
            'cmis:name': {value: 'other.html'}
        };

        
        // mock cmisSession object
        var cmisSession = {
            loadRepositories: jasmine.createSpy('loadRepositories').andReturn(new CmisRequestMock(true)),
            
            setCredentials: jasmine.createSpy('setCredentials'),
            
            setGlobalHandlers: jasmine.createSpy('setGlobalHandlers'),
            
            getObjectByPath: jasmine.createSpy('getObjectByPath').andCallFake(function(path) {
                if(path === '/cmis/root/pages/test.html') 
                {
                    // if file - retirn empty object
                    return new CmisRequestMock(true, {});
                }
                
                if(path === '/cmis/root/pages') 
                {
                    // if folder return folder object
                    return new CmisRequestMock(true, {
                        objects: [
                            {
                                object: {
                                    properties:testFileCmisProps
                                }
                            },
                            {
                                object: {
                                    properties:otherFileCmisProps
                                }
                            }
                        ]
                    });
                }
                // path not found
                return new CmisRequestMock(false);
            }),
            
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn('url/for/cmis/root/pages/test.html')
        };
        
        it('should authenticate session', function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, grunt, options, 'pages/foo.html', null);

            cmisCopyTask.runTask(done);
            
            expect(cmisSession.setCredentials).toHaveBeenCalledWith('adminusername', 'adminpassword');
        });
        
        it('should download single file', function(){
            var fileUtils = {
                downloadFile: jasmine.createSpy('downloadFile').andCallFake(function(fileDir, fileName, fileProps, callback){
                    callback(null); 
                })
            };
            
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtils, grunt, options, 'pages/test.html', null);

            cmisCopyTask.runTask(done);
            
            expect(fileUtils.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
            expect(fileUtils.downloadFile.calls.length).toEqual(1);
            
            // expect success
            expect(done).toHaveBeenCalledWith(true);
        });
    });
    
});

