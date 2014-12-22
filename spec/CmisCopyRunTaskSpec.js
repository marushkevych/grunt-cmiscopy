var CmisRequestMock = require('./stubs').CmisRequestMock;
var proxyquire = require('proxyquire');

// inject cmisSessionStub
var cmisSession = {
    setGlobalHandlers: function(){}
};

// VersionRegistry stub
var versionRegistryStub = {};


var CmisCopy = proxyquire('../js/CmisCopy', {
    'cmis': {
        createSession: function(){
            return cmisSession;
        }
    },
    './FilePorcessor': function(){
        return {
            process: function(objectId, callback){
                callback();
            },
            documents: []
        };
    },
    './VersionRegistry': versionRegistryStub
});

describe("CmisCopy.runTask()", function() {
    

    var options = {
        url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
        cmisRoot: '/cmis/root/',
        localRoot: 'local/root/',
        username: 'adminusername',
        password: 'adminpassword'
    };
    
    var testFileCmisProps = {
        succinctProperties: {
            'cmis:name': 'test.html',
            'cmis:objectId': 'testId',
            'cmis:baseTypeId': "cmis:document",
            'cmis:contentStreamMimeType': "text/html"
        }
    };    
    
    var loadRepositoriesRequest;
    var getObjectByPathRequest;
    
    beforeEach(function() {
        loadRepositoriesRequest = new CmisRequestMock();
        getObjectByPathRequest = new CmisRequestMock();

        cmisSession.setCredentials = jasmine.createSpy('setCredentials');
        cmisSession.loadRepositories = jasmine.createSpy('loadRepositories').andReturn(loadRepositoriesRequest);
        cmisSession.getObjectByPath = jasmine.createSpy('getObjectByPath').andReturn(getObjectByPathRequest);
        
        versionRegistryStub.save = jasmine.createSpy('save');
    });
    
    afterEach(function() {
        expect(cmisSession.setCredentials).toHaveBeenCalledWith('adminusername', 'adminpassword');
    });    

    it("should save version registry once, on successful 'download' action", function(done) {
        var cmisCopyTask = CmisCopy.create(options, null, 'd');
        cmisCopyTask.runTask(function(err){
            expect(err).toBeFalsy();
            expect(versionRegistryStub.save).toHaveBeenCalled();
            expect(versionRegistryStub.save.calls.length).toEqual(1);
            done();
        });
        
        loadRepositoriesRequest.resolve();
        getObjectByPathRequest.resolve(testFileCmisProps);
    });
    
    it("should save version registry once, on successful 'upload' action", function(done) {
        var cmisCopyTask = CmisCopy.create(options, null, 'u');
        cmisCopyTask.runTask(function(err){
            expect(err).toBeFalsy();
            expect(versionRegistryStub.save).toHaveBeenCalled();
            expect(versionRegistryStub.save.calls.length).toEqual(1);
            done();
        });
        
        loadRepositoriesRequest.resolve();
        getObjectByPathRequest.resolve(testFileCmisProps);
    });

    it("should not save version registry, on 'list' action", function(done) {
        var cmisCopyTask = CmisCopy.create(options, null, 'l');
        cmisCopyTask.runTask(function(err){
            expect(err).toBeFalsy();
            expect(versionRegistryStub.save).not.toHaveBeenCalled();
            done();
        });
        
        loadRepositoriesRequest.resolve();
        getObjectByPathRequest.resolve(testFileCmisProps);
    });

});

