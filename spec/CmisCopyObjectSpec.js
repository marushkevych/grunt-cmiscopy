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
    
   
    // mock cmisSession object with following file structiure:
    // 
    //  /cmis/root/
    //          - index.html
    // 
    //  /cmis/root/pages/
    //              - test.html
    //              - other.html
    //              
    //  /cmis/root/pages/subFolder/
    //                      - fileInSubfolder.html
    
    var pagesFolderCmisProps = {
        'cmis:name': {'value': 'pages'},
        'cmis:objectId': {'value': 'pages12345'},
        'cmis:baseTypeId': {'value': "cmis:folder"},
        'cmis:path':{'value': '/cmis/root/pages'}
    };
    var indexFileCmisProps = {
        'cmis:name': {'value': 'index.html'},
        'cmis:objectId': {'value': 'index12345'},
        'cmis:baseTypeId': {'value': "cmis:document"}
    };
    var testFileCmisProps = {
        'cmis:name': {'value': 'test.html'},
        'cmis:objectId': {'value': '12345'},
        'cmis:baseTypeId': {'value': "cmis:document"}
    };
    var otherFileCmisProps = {
        'cmis:name': {'value': 'other.html'},
        'cmis:objectId': {'value': '678910'},
        'cmis:baseTypeId': {'value': "cmis:document"}
    };
    var subFolderCmisProps = {
        'cmis:name': {'value': 'subFolder'},
        'cmis:objectId': {'value': 'subFolder12345'},
        'cmis:baseTypeId': {'value': "cmis:folder"},
        'cmis:path':{'value': '/cmis/root/pages/subFolder'}
    };
    var fileInSubfolderProps = {
        'cmis:name': {'value': 'fileInSubfolder.html'},
        'cmis:objectId': {'value': 'fileInSubfolder12345'},
        'cmis:baseTypeId': {'value': "cmis:document"}
    };


    var cmisSession = {
        loadRepositories: jasmine.createSpy('loadRepositories').andReturn(new CmisRequestMock(true)),

        setCredentials: jasmine.createSpy('setCredentials'),

        setGlobalHandlers: jasmine.createSpy('setGlobalHandlers'),

        getObjectByPath: jasmine.createSpy('getObjectByPath').andCallFake(function(path) {

            if(path === '/cmis/root'){
                return new CmisRequestMock(true, {
                    objects: [
                        {
                            object: {
                                properties:pagesFolderCmisProps
                            }
                        },
                        {
                            object: {
                                properties:indexFileCmisProps
                            }
                        }
                    ]
                });
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
                        },
                        {
                            object: {
                                properties:subFolderCmisProps
                            }
                        }
                    ]
                });
            }
            
            if(path === '/cmis/root/pages/subFolder'){
                return new CmisRequestMock(true, {
                    objects: [
                        {
                            object: {
                                properties:fileInSubfolderProps
                            }
                        }
                    ]
                });
            }

            if(path === '/cmis/root/pages/test.html') 
            {
                // if file - return empty object
                return new CmisRequestMock(true, {});
            }
            
            // path not found
            return new CmisRequestMock(false);
        }),
        
        getObject: jasmine.createSpy('getObject').andCallFake(function(objectId) {
            
            if(objectId === 'pages12345') 
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
                        },
                        {
                            object: {
                                properties:subFolderCmisProps
                            }
                        }
                    ]
                });
            }
            
            if(objectId === 'subFolder12345'){
                return new CmisRequestMock(true, {
                    objects: [
                        {
                            object: {
                                properties:fileInSubfolderProps
                            }
                        }
                    ]
                });
            }
            return new CmisRequestMock(false);
        })

    };
    
    
    
    describe("initialization", function(){
        
        it("should remove trailing slash from configured paths", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, null, null);

            expect(cmisCopyTask.cmisPath).toBe('/cmis/root');
            expect(cmisCopyTask.localPath).toBe('local/root');
        });

        it("should append path provided as first cmd line arg", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, "pages/member/", null);

            expect(cmisCopyTask.cmisPath).toBe('/cmis/root/pages/member');
            expect(cmisCopyTask.localPath).toBe('local/root/pages/member');
        });

        it("with no action shoud use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, null, null);
            expect(cmisCopyTask.action).toBe('download');
        });

        it("with 'upload' action should use 'upload'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, null, 'upload');
            expect(cmisCopyTask.action).toBe('upload');
        });

        it("with 'u' action should use 'upload'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, null, 'u');
            expect(cmisCopyTask.action).toBe('upload');
        });

        it("with 'download' action should use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, null, 'download');
            expect(cmisCopyTask.action).toBe('download');
        });

        it("with 'd' action should use 'download'", function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, null, options, null, 'd');
            expect(cmisCopyTask.action).toBe('download');
        });
        
        it("with invalid action should result in error", function(){
            expect(function(){cmisCopyFactory(cmisSession, null, options, null, 'foo');}).toThrow(new Error("Invalid action: foo"));
        });
        
        it('should authenticate session', function(){
            cmisCopyFactory(cmisSession, null, options, 'pages/foo.html', null);
            expect(cmisSession.setCredentials).toHaveBeenCalledWith('adminusername', 'adminpassword');
        });
    });
    
    describe("runTask", function(){
        
        var fileUtilsMock;
        var done;
        
        beforeEach(function(){
            done = jasmine.createSpy('done');
            
            fileUtilsMock = {
                downloadFile: jasmine.createSpy('downloadFile').andCallFake(function(fileDir, fileName, fileProps, callback){
                    callback(null); 
                }),
                uploadFile: jasmine.createSpy('uploadFile').andCallFake(function(fileDir, fileName, fileProps, callback){
                    callback(null); 
                })
            };
        });
        
        
        it('should download single file, when path to file is provided', function(){
            
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/test.html', null);

            cmisCopyTask.runTask(done);
            
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile.calls.length).toEqual(1);
            
            // expect success
            expect(done).toHaveBeenCalledWith(true);
        });
        
        it('should fail if file or folder doesnt exist', function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/foo', null);
            cmisCopyTask.runTask(done);
            expect(fileUtilsMock.downloadFile).not.toHaveBeenCalled();
            
            // expect failure
            expect(done).toHaveBeenCalledWith(false);
        });
        
        it('should download all files in folder and subfolders when path to folder is provided', function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages');
            cmisCopyTask.runTask(done);
            
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', otherFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile.calls.length).toEqual(3);
            
            // expect success
            expect(done).toHaveBeenCalledWith(true);
        });
        
        it('should upload all files in folder and subfolders when path to folder is provided', function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages', 'u');
            cmisCopyTask.runTask(done);
            
            expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', otherFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
            expect(fileUtilsMock.uploadFile.calls.length).toEqual(3);
            
            // expect success
            expect(done).toHaveBeenCalledWith(true);
        });
        
        it('should download all files in all folders and subfolders when no path is provided', function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options);
            cmisCopyTask.runTask(done);
            
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root', 'index.html', indexFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', otherFileCmisProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile.calls.length).toEqual(4);
            
            // expect success
            expect(done).toHaveBeenCalledWith(true);
        });
        
        it('should download all files in subfolder when path to subfolder is provided', function(){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/subFolder');
            cmisCopyTask.runTask(done);
            
            expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
            expect(fileUtilsMock.downloadFile.calls.length).toEqual(1);
            
            // expect success
            expect(done).toHaveBeenCalledWith(true);
        });
    });
    
});

