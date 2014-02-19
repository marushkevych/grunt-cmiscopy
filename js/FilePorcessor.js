var actions = require('./Actions');
var async = require('async');

module.exports = function(cmisSession, fileUtils, cmisPath, localPath, action) {

    function process(object, callback) {
        if (object.succinctProperties['cmis:baseTypeId'] === 'cmis:document') {
            processSingleFile(object, callback);
        } else {
            processFolder(cmisPath, object, callback);
        }
    }
    
    

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
                processFolder(object.succinctProperties['cmis:path'], object, callback);
            } else {
                processFile(parentPath, object, callback);
            }
        };
    }


    function processFolder(path, object, callback) {
        
        cmisSession.getChildren(object.succinctProperties['cmis:objectId']).ok(function(children) {
            var tasks = [];
            children.objects.forEach(function(entry) {
                tasks.push(createTask(path, entry.object));
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

        var fileDir = path.slice(cmisPath.length + 1);
        if (fileDir) {
            fileDir = localPath + '/' + fileDir;
        } else {
            fileDir = localPath;
        }

        if (action === actions.upload) {
            fileUtils.uploadFile(fileDir, fileName, objectId, mimeType, callback);
        } else {
            fileUtils.downloadFile(fileDir, fileName, objectId, mimeType, callback);
        }
    }    
    
    return {process: process};

};


