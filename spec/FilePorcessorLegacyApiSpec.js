var CmisRequestMock = require('./stubs').CmisRequestMock;
var proxyquire = require('proxyquire');

// inject fileIO and cmisSession stubs
var cmisSession = {};
var fileIOMock = {};
var FilePorcessorLegacyApi = proxyquire('../js/FilePorcessorLegacyApi', {
    './FileIO': {
        create: function() {
            return fileIOMock;
        }
    }
});

var CmisCopy = proxyquire('../js/CmisCopy', {
    './FilePorcessorLegacyApi': FilePorcessorLegacyApi,
    'cmis': {
        createSession: function() {
            return cmisSession;
        }
    }
});


describe("CmisCopyTask with legacy CMIS API", function() {

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
    //
    // /cmis/root/pages/emptyFolder

    var pagesFolderCmisProps = {
        'cmis:name': {'value': 'pages'},
        'cmis:objectId': {'value': 'pages12345'},
        'cmis:baseTypeId': {'value': "cmis:folder"},
        'cmis:path': {'value': '/cmis/root/pages'}
    };
    var indexFileCmisProps = {
        'cmis:name': {'value': 'index.html'},
        'cmis:objectId': {'value': 'index12345'},
        'cmis:baseTypeId': {'value': "cmis:document"},
        'cmis:contentStreamMimeType': {'value': "text/html"}
    };
    var testFileCmisProps = {
        'cmis:name': {'value': 'test.html'},
        'cmis:objectId': {'value': '12345'},
        'cmis:baseTypeId': {'value': "cmis:document"},
        'cmis:contentStreamMimeType': {'value': "text/html"}
    };
    var otherFileCmisProps = {
        'cmis:name': {'value': 'other.html'},
        'cmis:objectId': {'value': '678910'},
        'cmis:baseTypeId': {'value': "cmis:document"},
        'cmis:contentStreamMimeType': {'value': "text/html"}
    };
    var subFolderCmisProps = {
        'cmis:name': {'value': 'subFolder'},
        'cmis:objectId': {'value': 'subFolder12345'},
        'cmis:baseTypeId': {'value': "cmis:folder"},
        'cmis:path': {'value': '/cmis/root/pages/subFolder'}
    };
    var fileInSubfolderProps = {
        'cmis:name': {'value': 'fileInSubfolder.html'},
        'cmis:objectId': {'value': 'fileInSubfolder12345'},
        'cmis:baseTypeId': {'value': "cmis:document"},
        'cmis:contentStreamMimeType': {'value': "text/html"}
    };

    var emptyFolderCmisProps = {
        'cmis:name': {'value': 'emptyFolder'},
        'cmis:objectId': {'value': 'emptyFolderId'},
        'cmis:baseTypeId': {'value': "cmis:folder"},
        'cmis:path': {'value': '/cmis/root/pages/emptyFolder'}
    };

    var loadRepositoriesRequest;
    beforeEach(function() {
        loadRepositoriesRequest = new CmisRequestMock();
        cmisSession.loadRepositories = jasmine.createSpy('loadRepositories').andReturn(loadRepositoriesRequest);
        cmisSession.setCredentials = jasmine.createSpy('setCredentials');
        cmisSession.setGlobalHandlers = jasmine.createSpy('setGlobalHandlers');
        cmisSession.getObjectByPath = jasmine.createSpy('getObjectByPath').andCallFake(function(path) {

            if (path === '/cmis/root') {
                return new CmisRequestMock().resolve({
                    objects: [
                        {
                            object: {
                                properties: pagesFolderCmisProps
                            }
                        },
                        {
                            object: {
                                properties: indexFileCmisProps
                            }
                        }
                    ]
                });
            }
            if (path === '/cmis/root/pages/emptyFolder') {
                return new CmisRequestMock().resolve({});
            }

            if (path === '/cmis/root/pages')
            {
                // if folder return folder object
                return new CmisRequestMock().resolve({
                    objects: [
                        {
                            object: {
                                properties: testFileCmisProps
                            }
                        },
                        {
                            object: {
                                properties: otherFileCmisProps
                            }
                        },
                        {
                            object: {
                                properties: subFolderCmisProps
                            }
                        },
                        {
                            object: {
                                properties: emptyFolderCmisProps
                            }
                        }
                    ]
                });
            }

            if (path === '/cmis/root/pages/subFolder') {
                return new CmisRequestMock().resolve({
                    objects: [
                        {
                            object: {
                                properties: fileInSubfolderProps
                            }
                        }
                    ]
                });
            }

            if (path === '/cmis/root/pages/test.html')
            {
                // if file - return empty object
                return new CmisRequestMock().resolve({});
            }

            // path not found
            return new CmisRequestMock().reject({statusCode: 404});
        });
        cmisSession.getObject = jasmine.createSpy('getObject').andCallFake(function(objectId) {

            if (objectId === 'pages12345')
            {
                // if folder return folder object
                return new CmisRequestMock().resolve({
                    objects: [
                        {
                            object: {
                                properties: testFileCmisProps
                            }
                        },
                        {
                            object: {
                                properties: otherFileCmisProps
                            }
                        },
                        {
                            object: {
                                properties: subFolderCmisProps
                            }
                        }
                    ]
                });
            }

            if (objectId === 'subFolder12345') {
                return new CmisRequestMock().resolve({
                    objects: [
                        {
                            object: {
                                properties: fileInSubfolderProps
                            }
                        }
                    ]
                });
            }

            if (objectId === 'emptyFolderId') {
                return new CmisRequestMock().resolve({});
            }
            return new CmisRequestMock().reject("failed get object");
        });

    });


    describe("runTask", function() {

        beforeEach(function() {

            fileIOMock.downloadFile = jasmine.createSpy('downloadFile').andCallFake(function(fileDir, fileName, objectId, mimType, callback) {
                callback(null);
            });
            fileIOMock.uploadFile = jasmine.createSpy('uploadFile').andCallFake(function(fileDir, fileName, objectId, mimType, callback) {
                callback(null);
            });
        });


        it('should download single file, when path to file is provided', function(done) {

            var cmisCopyTask = CmisCopy.create(options, 'pages/test.html', null);

            cmisCopyTask.runTask(function(err) {
                // expect success
                expect(err).toBeFalsy();
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', '12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile.calls.length).toEqual(1);
                done();
            });

            loadRepositoriesRequest.resolve();

        });

        it('should fail if file or folder doesnt exist', function(done) {
            var cmisCopyTask = CmisCopy.create(options, 'pages/foo', null);
            cmisCopyTask.runTask(function(err) {
                // expect failure
                expect(err).toBeTruthy();
                expect(fileIOMock.downloadFile).not.toHaveBeenCalled();
                done();
            });

            loadRepositoriesRequest.resolve();
        });

        it('should download all files in folder and subfolders when path to folder is provided', function(done) {
            var cmisCopyTask = CmisCopy.create(options, 'pages');
            cmisCopyTask.runTask(function(err) {
                // expect success
                expect(err).toBeFalsy();

                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', '12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', '678910', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolder12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile.calls.length).toEqual(3);
                done();
            });

            loadRepositoriesRequest.resolve();

        });

        it('should upload all files in folder and subfolders when path to folder is provided', function(done) {
            var cmisCopyTask = CmisCopy.create(options, 'pages', 'u');
            cmisCopyTask.runTask(function(err) {
                // expect success
                expect(err).toBeFalsy();
                expect(fileIOMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', '12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.uploadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', '678910', 'text/html', jasmine.any(Function));
                expect(fileIOMock.uploadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolder12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.uploadFile.calls.length).toEqual(3);
                done();
            });

            loadRepositoriesRequest.resolve();
        });

        it('should download all files in all folders and subfolders when no path is provided', function(done) {
            var cmisCopyTask = CmisCopy.create(options);
            cmisCopyTask.runTask(function(err) {
                expect(err).toBeFalsy();
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root', 'index.html', 'index12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'test.html', '12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages', 'other.html', '678910', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolder12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile.calls.length).toEqual(4);
                done();
            });

            loadRepositoriesRequest.resolve();
        });

        it('should download all files in subfolder when path to subfolder is provided', function(done) {
            var cmisCopyTask = CmisCopy.create(options, 'pages/subFolder');
            cmisCopyTask.runTask(function(err) {
                // expect success
                expect(err).toBeFalsy();
                expect(fileIOMock.downloadFile).toHaveBeenCalledWith('local/root/pages/subFolder', 'fileInSubfolder.html', 'fileInSubfolder12345', 'text/html', jasmine.any(Function));
                expect(fileIOMock.downloadFile.calls.length).toEqual(1);
                done();
            });

            loadRepositoriesRequest.resolve();
        });

        it('should handle empty folder', function(done) {
            var cmisCopyTask = CmisCopy.create(options, 'pages/emptyFolder');
            cmisCopyTask.runTask(function(err) {
                // expect success
                expect(err).toBeFalsy();
                done();
            });

            loadRepositoriesRequest.resolve();
        });

    });

});

