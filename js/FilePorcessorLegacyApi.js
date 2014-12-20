var actions = require('./Actions');
var async = require('async');
var grunt = require('grunt');
var FileIO = require('./FileIO');

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
            var fileProps;
            collection.objects.forEach(function(entry) {
                //console.log('comparing ', entry.object.properties["cmis:name"].value, 'with', fileName)
                if (entry.object.properties["cmis:name"].value === fileName) {
                    fileProps = entry.object.properties;
                }
            });
            if (fileProps) {
                // if type is foler - it must be an empty folder
                if(fileProps["cmis:baseTypeId"].value === 'cmis:folder'){
                    callback();
                    return;
                }
                
                processFile(cmisPath, fileProps, callback);
            } else {
                // file not found
                callback('File not found:', cmisPath + '/' + fileName);
            }
        });
    }

    // create function to run with async.parallel()
    function createTask(parentPath, nodeProps) {
        return function(callback) {
            if (nodeProps["cmis:baseTypeId"].value === 'cmis:folder') {
                // get collection
                cmisSession.getObject(nodeProps['cmis:objectId'].value).ok(function(collection) {
                    // check if collection is empty
                    if(collection.objects == null){
                        callback();
                        return;
                    }
                    
                    processFolder(nodeProps['cmis:path'].value, collection, callback);
                });
            } else {
                processFile(parentPath, nodeProps, callback);
            }
        };
    }


    function processFolder(path, collection, callback) {
        var tasks = [];
        collection.objects.forEach(function(entry) {
            tasks.push(createTask(path, entry.object.properties));
        });

        async.parallel(tasks, function(err, results) {
            callback(err);
        });
    }

    function processFile(path, fileProps, callback) {
        var fileName = fileProps["cmis:name"].value;
        var objectId = fileProps["cmis:objectId"].value;
        var mimeType = fileProps["cmis:contentStreamMimeType"].value;
        
//        var version = fileProps["cmis:versionLabel"].value;
//        var nodeId = fileProps["alfcmis:nodeRef"].value;
//        
//        var registry = require('./VersionRegistry').getRegistry('cmisregistry.json');
        

        var fileDir = path.slice(cmisPath.length + 1);
        var localDir;
        if (fileDir) {
            localDir = localPath + '/' + fileDir;
        } else {
            localDir = localPath;
        }

        if (action === actions.upload) {
            fileIO.uploadFile(localDir, fileName, objectId, mimeType, callback);
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
            fileIO.downloadFile(localDir, fileName, objectId, mimeType, callback);
        } else {
            // log progress
            grunt.log.write('.');
            
            documents.push(fileDir + '/' + fileName);
            callback();
        }
    }    
    
    return {
        process: process,
        documents: documents
    };

};


