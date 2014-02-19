var actions = require('./Actions');
var async = require('async');

module.exports = function(cmisSession, fileUtils, cmisPath, localPath, action) {

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


