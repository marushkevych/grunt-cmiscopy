var cmisCopyFactory = require('../js/CmisCopyFactory');
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

    var cmisSession;

    beforeEach(function(){
        cmisSession = {
            loadRepositories: jasmine.createSpy('loadRepositories').andReturn(new CmisRequestMock().resolve()),

            setCredentials: jasmine.createSpy('setCredentials'),

            setGlobalHandlers: jasmine.createSpy('setGlobalHandlers'),

            getObjectByPath: jasmine.createSpy('getObjectByPath').andCallFake(function(path) {

                if(path === '/cmis/root'){
                    return new CmisRequestMock().resolve({
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
                    return new CmisRequestMock().resolve({
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
                    return new CmisRequestMock().resolve({
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
                    return new CmisRequestMock().resolve({});
                }

                // path not found
                return new CmisRequestMock().reject();
            }),

            getObject: jasmine.createSpy('getObject').andCallFake(function(objectId) {

                if(objectId === 'pages12345') 
                {
                    // if folder return folder object
                    return new CmisRequestMock().resolve({
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
                    return new CmisRequestMock().resolve({
                        objects: [
                            {
                                object: {
                                    properties:fileInSubfolderProps
                                }
                            }
                        ]
                    });
                }
                return new CmisRequestMock().reject();
            })

        };
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
        
        
        it('should download single file, when path to file is provided', function(done){
            
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/test.html', null);

            cmisCopyTask.runTask(function(res){
                // expect success
                expect(res).toBe(true);
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile.calls.length).toEqual(1);
                done();
            });
            
        });
        
        it('should fail if file or folder doesnt exist', function(done){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/foo', null);
            cmisCopyTask.runTask(function(res){
                // expect failure
                expect(res).toBe(false);
                expect(fileUtilsMock.downloadFile).not.toHaveBeenCalled();
                done();
            });
            
        });
        
        it('should download all files in folder and subfolders when path to folder is provided', function(done){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages');
            cmisCopyTask.runTask(function(value){
                // expect success
                expect(value).toBe(true);
                
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', otherFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile.calls.length).toEqual(3);
                done();
            });
            
        });
        
        it('should upload all files in folder and subfolders when path to folder is provided', function(done){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages', 'u');
            cmisCopyTask.runTask(function(value){
                // expect success
                expect(value).toBe(true);
                expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', otherFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
                expect(fileUtilsMock.uploadFile.calls.length).toEqual(3);
                done();
            });
            
            
        });
        
        it('should download all files in all folders and subfolders when no path is provided', function(done){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options);
            cmisCopyTask.runTask(function(value){
                expect(value).toBe(true);
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root', 'index.html', indexFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', testFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', otherFileCmisProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile.calls.length).toEqual(4);
                done();
            });
        });
        
        it('should download all files in subfolder when path to subfolder is provided', function(done){
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/subFolder');
            cmisCopyTask.runTask(function(value){
                // expect success
                expect(value).toBe(true);
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', fileInSubfolderProps, jasmine.any(Function));
                expect(fileUtilsMock.downloadFile.calls.length).toEqual(1);
                done();
            });
        });
        
    });
    
});

