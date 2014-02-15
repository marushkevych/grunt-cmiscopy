/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */
'use strict';

var async = require('async');
var grunt = require('grunt');


function removeTrailingSlash(path) {
    return path.charAt(path.length - 1) === '/' ? path.substring(0, path.length - 1) : path;
}

var actions = {
    d: 'download',
    download: 'download',
    u: 'upload',
    upload: 'upload'
};

module.exports = function(cmisSession, fileUtils, options, pathArg, actionArg) {
    var cmisPath = removeTrailingSlash(options.cmisRoot);
    var localPath = removeTrailingSlash(options.localRoot);
    var action = actions.download; // default action

    // apply pathArg
    if (pathArg) {
        pathArg = removeTrailingSlash(pathArg);
        cmisPath = cmisPath + '/' + pathArg;
        localPath = localPath + '/' + pathArg;
    }

    // normilize action
    if (actionArg) {
        action = actions[actionArg];
        if (action == null) {
            throw new Error("Invalid action: " + actionArg);
        }
    }
    
    cmisSession.setCredentials(options.username, options.password);
    
    
    function runTask(done){
        
        // set global (default) error handlers
        function defaultErrorHandler(err){
            grunt.log.error();
            grunt.log.error(err);
            done(false);               
        }
        cmisSession.setGlobalHandlers(defaultErrorHandler, defaultErrorHandler);
        
        grunt.log.ok('Connecting to', options.url);
        cmisSession.loadRepositories().ok(function() {
            cmisSession.getObjectByPath(cmisPath).ok(function(collection) {
                if (collection.objects == null) {
                    // if collection is empty - it must be a file
                    processSingleFile(done);
                } else {
                    // its a folder
                    processFolder(cmisPath, collection, function(err) {
                        done(err == null);
                    });
                }

            }).notOk(function(err) {
                grunt.log.error();
                grunt.log.error('content not found:', cmisPath);
                done(false);
            }).error(function(err) {
                grunt.log.error();
                grunt.log.error('failed to retrieve object:', cmisPath);
                done(false);
            });
        });
    }


    function processSingleFile(done) {
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
                processFile(cmisPath, fileProps, function(err) {
                    done(err == null);
                });
            } else {
                // file not found
                grunt.log.error();
                grunt.log.error('File not found:', cmisPath + '/' + fileName);
                done(false);
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

        var fileDir = path.slice(cmisPath.length + 1);
        if (fileDir) {
            fileDir = localPath + '/' + fileDir;
        } else {
            fileDir = localPath;
        }

        if (action === actions.upload) {
            fileUtils.uploadFile(fileDir, fileName, fileProps, callback);
        } else {
            fileUtils.downloadFile(fileDir, fileName, fileProps, callback);
        }
    }

    return {
        // expose for testing
        cmisPath: cmisPath,
        localPath: localPath,
        action: action,
        
        runTask: runTask
    };
};

