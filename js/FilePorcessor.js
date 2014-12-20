var actions = require('./Actions');
var async = require('async');
var grunt = require('grunt');
var FileIO = require('./FileIO');
var cmisFilePropertiesFactory = require('./CmisFileProperties');

module.exports = function(cmisSession, options, cmisPath, localPath, action) {
    var fileIO = FileIO.create(cmisSession, options);
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
        var cmisFileProperties = cmisFilePropertiesFactory(object);
        if (cmisFileProperties.isDocument()) {
            processSingleFile(cmisFileProperties, callback);
        } else {
            processFolder(cmisFileProperties, callback);
        }
    }

    return {
        process: process,
        documents: documents
    };
    
    
    function processSingleFile(cmisFileProperties, callback) {
        // get parent path and file name
        var fileName = cmisFileProperties.getName();
        var lastSlashIndex = cmisPath.lastIndexOf('/' + fileName);
        cmisPath = cmisPath.slice(0, lastSlashIndex);
        localPath = localPath.slice(0, localPath.lastIndexOf('/' + fileName));

        processFile(cmisPath, cmisFileProperties, callback);
    }

    // create function to run with async.parallel()
    function createTask(parentPath, cmisFileProperties) {
        return function(callback) {
            if (cmisFileProperties.isFolder()) {
                processFolder(cmisFileProperties, callback);
            } else {
                processFile(parentPath, cmisFileProperties, callback);
            }
        };
    }

    function processFolder(cmisFileProperties, callback) {
        
        cmisSession.getChildren(cmisFileProperties.getObjectId()).ok(function(children) {
                var tasks = [];
                children.objects.forEach(function(entry) {
                        tasks.push(createTask( cmisFileProperties.getPath(), cmisFilePropertiesFactory(entry.object) ));
                });

                async.parallel(tasks, function(err, results) {
                    callback(err);
                });
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
        } else if (action === actions.download){
            fileIO.downloadFile(localDir, cmisFileProperties, callback);
        } else {
            // log progress
            grunt.log.write('.');
            
            documents.push(fileDir + '/' + cmisFileProperties.getName());
            callback();
        }
    }    

};


