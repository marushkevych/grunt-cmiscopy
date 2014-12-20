var actions = require('./Actions');
var async = require('async');
var grunt = require('grunt');
var FileIO = require('./FileIO');
var cmisFilePropertiesFactory = require('./CmisFileProperties');
var _ = require('underscore');

module.exports = function(cmisSession, options, cmisPath, localPath, action) {
    var fileIO = FileIO.create(cmisSession, options);
    var documents = [];

    function process(object, callback) {
        if (object.objects == null) {
            // if collection is empty - it must be a file
            processSingleFile(callback);
        } else {
            // its a folder
            processFolder(cmisPath, object, callback);
        }
    }
    
    

    function processSingleFile(callback) {
        // get parent path and file name
        var lastSlashIndex = cmisPath.lastIndexOf('/');
        var fileName = cmisPath.slice(lastSlashIndex + 1);
        cmisPath = cmisPath.slice(0, lastSlashIndex);
        localPath = localPath.slice(0, localPath.lastIndexOf('/'));

        cmisSession.getObjectByPath(cmisPath).ok(function(collection) {
            // find file object in collection
            var match = _.find(collection.objects, function(entry){
                return entry.object.properties["cmis:name"].value === fileName;
            });
            
            if (match) {
                var cmisFileProperties = cmisFilePropertiesFactory(match);
                // if type is foler - it must be an empty folder
                if(cmisFileProperties.isFolder()){
                    callback();
                    return;
                }
                
                processFile(cmisPath, cmisFileProperties, callback);
            } else {
                // file not found
                callback('File not found:', cmisPath + '/' + fileName);
            }
        });
    }

    // create function to run with async.parallel()
    function createTask(parentPath, cmisFileProperties) {
        return function(callback) {
            if (cmisFileProperties.isFolder()) {
                // get collection
                cmisSession.getObject(cmisFileProperties.getObjectId()).ok(function(collection) {
                    // check if collection is empty
                    if(collection.objects == null){
                        callback();
                        return;
                    }
                    
                    processFolder(cmisFileProperties.getPath(), collection, callback);
                });
            } else {
                processFile(parentPath, cmisFileProperties, callback);
            }
        };
    }


    function processFolder(path, collection, callback) {
        var tasks = [];
        collection.objects.forEach(function(entry) {
            tasks.push(createTask(path, cmisFilePropertiesFactory(entry)));
        });

        async.parallel(tasks, function(err, results) {
            callback(err);
        });
    }

    function processFile(path, cmisFileProperties, callback) {

        var fileDir = path.slice(cmisPath.length + 1);
        var localDir;
        if (fileDir) {
            localDir = localPath + '/' + fileDir;
        } else {
            localDir = localPath;
        }

        if (action === actions.upload) {
            fileIO.uploadFile(localDir, cmisFileProperties, callback);
//            fileIO.uploadFile(localDir, fileName, objectId, mimeType, function(err){
//                // update version registry on success
//                if(err){
//                    callback(err);
//                }else{
//                    // get new version
//                    cmisSession.getObject(objectId).ok(function(updatedObject) {
//                        console.log(updatedObject)
//                        //registry[nodeId] = updatedObject.succinctProperties["cmis:versionLabel"];
//                        callback();
//                    }).notOk(function(response) {
//                        var status = response.statusCode ? response.statusCode : "";
//                        var error = response.error ? response.error : "";
//                        callback('failed to get content: ' + status + " " + cmisPath + "\n" + error);
//                    });
//                }
//            });
            
        } else if (action === actions.download){
//            registry[nodeId] = version;
            fileIO.downloadFile(localDir, cmisFileProperties, callback);
        } else {
            // log progress
            grunt.log.write('.');
            
            documents.push(fileDir + '/' + cmisFileProperties.getName());
            callback();
        }
    }    
    
    return {
        process: process,
        documents: documents
    };

};


