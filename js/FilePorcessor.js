var actions = require('./Actions');
var async = require('async');
var grunt = require('grunt');
var FileIO = require('./FileIO');
var VersionRegistry = require('./VersionRegistry');
var cmisFilePropertiesFactory = require('./CmisFileProperties');

module.exports = function(cmisSession, options, cmisPath, localPath, action) {
    var fileIO = FileIO.create(cmisSession, options);
    var registry = VersionRegistry.getRegistry('cmisregistry.json');
    var documents = [];
    
    /**
     * Process cmis object. It could be file or folder.
     * If folder, process all children files and folders recursively, in parallel. 
     * 
     * @argument {Object} object CMIS object
     * @argument {Function} callback to be called on completion. 
     *      If cuccess, call with no arguments.
     *      If error, pass error as an argument.
     */
    function process(object, callback) {
        if (object.succinctProperties['cmis:baseTypeId'] === 'cmis:document') {
            processSingleFile(object, callback);
        } else {
            processFolder(object, callback);
        }
    }

    return {
        process: process,
        documents: documents
    };
    
    
    function processSingleFile(object, callback) {
        // get parent path and file name
        var fileName = object.succinctProperties['cmis:name'];
        var lastSlashIndex = cmisPath.lastIndexOf('/' + fileName);
        cmisPath = cmisPath.slice(0, lastSlashIndex);
        localPath = localPath.slice(0, localPath.lastIndexOf('/' + fileName));

        processFile(cmisPath, object, callback);
    }

    // create function to run with async.parallel()
    function createTask(parentPath, object) {
        return function(callback) {
            if (object.succinctProperties["cmis:baseTypeId"] === 'cmis:folder') {
                processFolder(object, callback);
            } else {
                processFile(parentPath, object, callback);
            }
        };
    }

    function processFolder(object, callback) {
        
        cmisSession.getChildren(object.succinctProperties['cmis:objectId']).ok(function(children) {
                var tasks = [];
                children.objects.forEach(function(entry) {
                        tasks.push(createTask(object.succinctProperties['cmis:path'], entry.object));
                });

                async.parallel(tasks, function(err, results) {
                    callback(err);
                });
        });        
        
    }

    function processFile(path, object, callback) {
        var fileName = object.succinctProperties["cmis:name"];
        var objectId = object.succinctProperties["cmis:objectId"];
        var mimeType = object.succinctProperties["cmis:contentStreamMimeType"];
        
        var nodeId =  object.succinctProperties["alfcmis:nodeRef"];
        var version = object.succinctProperties["cmis:versionLabel"];
        
        var cmisFileProperties = cmisFilePropertiesFactory(object);
        
            
        var fileDir = path.slice(cmisPath.length + 1);
        var localDir;
        if (fileDir) {
            localDir = localPath + '/' + fileDir;
        } else {
            localDir = localPath;
        }

        if (action === actions.upload) {
            
            // dont upload if version doesnt match
//            if(version !== registry[nodeId]){
//                grunt.log.error().error("Can't upload", fileDir + '/' + fileName, "file is out of sync. Please download latest version.");
//                callback();
//            }else{
            
                fileIO.uploadFile(localDir, cmisFileProperties, callback);
//                fileIO.uploadFile(localDir, fileName, objectId, mimeType, function(err){
//                    // update version registry on success
//                    if(err){
//                        callback(err);
//                    }else{
//                        // get new version
//                        cmisSession.getObject(nodeId).ok(function(updatedObject) {
//                            registry[nodeId] = updatedObject.succinctProperties["cmis:versionLabel"];
//                            callback();
//                        }).notOk(function(response) {
//                            var status = response.statusCode ? response.statusCode : "";
//                            var error = response.error ? response.error : "";
//                            callback('failed to get content: ' + status + " " + cmisPath + "\n" + error);
//                        });
//                    }
//                });
//            }
            
        } else if (action === actions.download){
            fileIO.downloadFile(localDir, cmisFileProperties, callback);
//            fileIO.downloadFile(localDir, fileName, objectId, mimeType, function(err){
//                // update version registry on success
//                if(err){
//                    callback(err);
//                }else{
//                    registry[nodeId] = version;
//                    callback();
//                }
//            });
        } else {
            // log progress
            grunt.log.write('.');
            
            documents.push(fileDir + '/' + fileName);
            callback();
        }
    }    

};


