/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */
var async = require('async');
var http = require('http');
var url = require('url');
var fs = require('fs');

function removeTrailingSlash(path) {
    return path.charAt(path.length - 1) === '/' ? path.substring(0, path.length - 1) : path;
}

var actions = {
    d: 'download',
    download: 'download',
    u: 'upload',
    upload: 'upload'
};

module.exports = function(cmisSession, grunt, options, pathArg, actionArg) {
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
    
    function runTask(done){
        cmisSession.setCredentials(options.username, options.password);
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
        }).notOk(function(err) {
            grunt.log.error();
            grunt.log.error(err.error);
            done(false);
        }).error(function(err) {
            grunt.log.error();
            grunt.log.error('failed to load repositories');
            done(false);
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
                grunt.log.error('Content not found:', cmisPath + '/' + fileName);
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
            uploadFile(fileDir, fileName, fileProps, callback);
        } else {
            downloadFile(fileDir, fileName, fileProps, callback);
        }
    }

    function uploadFile(fileDir, fileName, fileProps, callback) {
        var filepath = fileDir + '/' + fileName;

        var objectId = fileProps['cmis:objectId'].value;
        var contentBuffer = grunt.file.read(filepath, {encoding: null});
        var overwriteFlag = true;
        var mimeType = fileProps['cmis:contentStreamMimeType'].value;
        cmisSession.setContentStream(objectId, contentBuffer, overwriteFlag, mimeType).ok(function() {
            console.log("uploaded", mimeType, filepath);
            callback(null);
        }).notOk(function(err) {
            grunt.log.error();
            grunt.log.error(err);
            callback(err);
        }).error(function(err) {
            grunt.log.error();
            grunt.log.error(err);
            callback(err);
        });
    }

    function downloadFile(fileDir, fileName, fileProps, callback) {
        var filePath = fileDir + '/' + fileName;

        grunt.file.mkdir(fileDir);
        var file = fs.createWriteStream(filePath);

        var URL = cmisSession.getContentStreamURL(fileProps['cmis:objectId'].value);

        var requestOptions = url.parse(URL);
        requestOptions.auth = options.username + ':' + options.password;
        http.get(requestOptions, function(response) {
            if (response.statusCode !== 200) {
                grunt.log.error(response.statusCode, filePath);
                callback(response);
            } else {
                response.pipe(file);
                response.on('end', function() {
                    grunt.log.writeln('downloaded', fileProps['cmis:contentStreamMimeType'].value, filePath);
                    callback(null);
                });
                response.on('error', function() {
                    grunt.log.error();
                    grunt.log.error('error streaming file', filePath);
                    callback('error streaming file');
                });
            }
        }).on('error', function(e) {
            grunt.log.error();
            grunt.log.error("Got error: " + e.message);
            callback(e.message);
        });
    }

    return {
        // expose for testing
        cmisPath: cmisPath,
        localPath: localPath,
        action: action,
        
        runTask: runTask
    };
};

