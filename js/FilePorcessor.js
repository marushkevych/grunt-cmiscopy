var actions = require('./Actions');
var async = require('async');
var grunt = require('grunt');
var FileIO = require('./FileIO');
var VersionRegistry = require('./VersionRegistry');

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
        
            
        var fileDir = path.slice(cmisPath.length + 1);
        var localDir;
        if (fileDir) {
            localDir = localPath + '/' + fileDir;
        } else {
            localDir = localPath;
        }

        if (action === actions.upload) {
            
            // TODO dont upload if version doesnt match
            // on successful upload get new version and save
            fileIO.uploadFile(localDir, fileName, objectId, mimeType, callback);
            
        } else if (action === actions.download){
            fileIO.downloadFile(localDir, fileName, objectId, mimeType, function(err){
                // update version registry on success
                if(err){
                    callback(err);
                }else{
                    registry[nodeId] = version;
                    callback();
                }
            });
        } else {
            // log progress
            grunt.log.write('.');
            
            documents.push(fileDir + '/' + fileName);
            callback();
        }
    }    

};


