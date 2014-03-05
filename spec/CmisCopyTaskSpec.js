var cmisCopyFactory = require('../js/CmisCopyFactory');
var CmisRequestMock = require('./stubs').CmisRequestMock;


describe("CmisCopyTask with current CMIS API", function() {

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

    var rootFolderCmisProps = {
        succinctProperties: {
            'cmis:name': 'root',
            'cmis:objectId': 'rootId',
            'cmis:baseTypeId': "cmis:folder",
            'cmis:path': '/cmis/root'
        }
    };
    
    var pagesFolderCmisProps = {
        succinctProperties: {
            'cmis:name': 'pages',
            'cmis:objectId': 'pagesId',
            'cmis:baseTypeId': "cmis:folder",
            'cmis:path': '/cmis/root/pages'
        }
    };
    var indexFileCmisProps = {
        succinctProperties: {
            'cmis:name': 'index.html',
            'cmis:objectId': 'indexId',
            'cmis:baseTypeId': "cmis:document",
            'cmis:contentStreamMimeType': "text/html"
        }
    };
    var testFileCmisProps = {
        succinctProperties: {
            'cmis:name': 'test.html',
            'cmis:objectId': 'testId',
            'cmis:baseTypeId': "cmis:document",
            'cmis:contentStreamMimeType': "text/html"
        }
    };
    var otherFileCmisProps = {
        succinctProperties: {
            'cmis:name': 'other.html',
            'cmis:objectId': 'otherId',
            'cmis:baseTypeId':  "cmis:document",
            'cmis:contentStreamMimeType': "text/html"
        }
    };
    var subFolderCmisProps = {
        succinctProperties: {
            'cmis:name':'subFolder',
            'cmis:objectId': 'subFolderId',
            'cmis:baseTypeId': "cmis:folder",
            'cmis:path': '/cmis/root/pages/subFolder'
        }
    };
    var fileInSubfolderProps = {
        succinctProperties: {
            'cmis:name': 'fileInSubfolder.html',
            'cmis:objectId': 'fileInSubfolderId',
            'cmis:baseTypeId': "cmis:document",
            'cmis:contentStreamMimeType': "text/html"
        }
    };
    
    var rootChildren = { 
        objects:[
            {object: pagesFolderCmisProps},
            {object: indexFileCmisProps},
        ]
    };
    
    var pagesChildren = { 
        objects:[
            {object: testFileCmisProps},
            {object: otherFileCmisProps},
            {object: subFolderCmisProps},
        ]
    };
    var subFolderChildren = { 
        objects:[
            {object: fileInSubfolderProps}
        ]
    };

    var cmisSession;

    beforeEach(function() {
        cmisSession = {
            loadRepositories: jasmine.createSpy('loadRepositories').andReturn(new CmisRequestMock().resolve()),
            setCredentials: jasmine.createSpy('setCredentials'),
            setGlobalHandlers: jasmine.createSpy('setGlobalHandlers')
        };
    });


    describe("runTask", function() {

        var fileUtilsMock;
        var done;

        beforeEach(function() {
            done = jasmine.createSpy('done');

            fileUtilsMock = {
                downloadFile: jasmine.createSpy('downloadFile').andCallFake(function(fileDir, fileName, objectId, mimType, callback) {
                    callback(null);
                }),
                uploadFile: jasmine.createSpy('uploadFile').andCallFake(function(fileDir, fileName, objectId, mimType, callback) {
                    callback(null);
                })
            };
        });


        it('should download single file, when path to file is provided', function(done) {
            
            cmisSession.getObjectByPath = jasmine.createSpy('getObjectByPath').andCallFake(function(path) {
                expect(path).toBe('/cmis/root/pages/test.html');
                return new CmisRequestMock().resolve(testFileCmisProps);
            });

            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/test.html', null);

            cmisCopyTask.runTask(function(res) {
                // expect success
                expect(res).toBe(true);
                expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', 'testId', 'text/html', jasmine.any(Function));
                expect(fileUtilsMock.downloadFile.calls.length).toEqual(1);
                done();
            });
        });

        it('should fail if file or folder doesnt exist', function(done) {
            cmisSession.getObjectByPath = jasmine.createSpy('getObjectByPath').andCallFake(function(path) {
                expect(path).toBe('/cmis/root/pages/foo');
                return new CmisRequestMock().reject();
            });
            
            var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/foo', null);
            cmisCopyTask.runTask(function(res) {
                // expect failure
                expect(res).toBe(false);
                expect(fileUtilsMock.downloadFile).not.toHaveBeenCalled();
                done();
            });
        });
        
        describe('should process folders recursively', function(){
            
            beforeEach(function(){
                
                cmisSession.getObjectByPath = jasmine.createSpy('getObjectByPath').andCallFake(function(path) {
                    if(path === '/cmis/root')
                        return new CmisRequestMock().resolve(rootFolderCmisProps);
                        
                    if(path === '/cmis/root/pages')
                        return new CmisRequestMock().resolve(pagesFolderCmisProps);

                    if(path === '/cmis/root/pages/subFolder')
                        return new CmisRequestMock().resolve(subFolderCmisProps);
                    
                    return new CmisRequestMock().reject();
                });       

                cmisSession.getChildren = jasmine.createSpy('getChildren').andCallFake(function(objectId) {
                    if(objectId === 'rootId')
                        return new CmisRequestMock().resolve(rootChildren);
                    
                    if(objectId === 'pagesId')
                        return new CmisRequestMock().resolve(pagesChildren);

                    if(objectId === 'subFolderId')
                        return new CmisRequestMock().resolve(subFolderChildren);

                    return new CmisRequestMock().reject();
                });          

                cmisSession.getObject = jasmine.createSpy('getObject').andCallFake(function(objectId) {
                    if(objectId === 'testId')
                        return new CmisRequestMock().resolve(testFileCmisProps);

                    if(objectId === 'otherId')
                        return new CmisRequestMock().resolve(otherFileCmisProps);

                    if(objectId === 'fileInSubfolderId')
                        return new CmisRequestMock().resolve(fileInSubfolderProps);

                    return new CmisRequestMock().reject();
                });            
            });
            
            it('should download all files in folder and subfolders when path to folder is provided', function(done){


                var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages');
                cmisCopyTask.runTask(function(value){
                    // expect success
                    expect(value).toBe(true);

                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', 'testId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', 'otherId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolderId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile.calls.length).toEqual(3);
                    done();
                });

            });        
            
            it('should upload all files in folder and subfolders when path to folder is provided', function(done){
                var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages', 'u');
                cmisCopyTask.runTask(function(value){
                    // expect success
                    expect(value).toBe(true);
                    expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', 'testId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', 'otherId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.uploadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolderId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.uploadFile.calls.length).toEqual(3);
                    done();
                });
            });            
            
            it('should download all files in all folders and subfolders when no path is provided', function(done){
                var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options);
                cmisCopyTask.runTask(function(value){
                    expect(value).toBe(true);
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root', 'index.html', 'indexId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', 'testId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', 'otherId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolderId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile.calls.length).toEqual(4);
                    done();
                });
            });            
            
            it('should download all files in subfolder when path to subfolder is provided', function(done){
                var cmisCopyTask = cmisCopyFactory(cmisSession, fileUtilsMock, options, 'pages/subFolder');
                cmisCopyTask.runTask(function(value){
                    // expect success
                    expect(value).toBe(true);
                    expect(fileUtilsMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolderId', 'text/html', jasmine.any(Function));
                    expect(fileUtilsMock.downloadFile.calls.length).toEqual(1);
                    done();
                });
            });            
            
        });
        

    });

});

