/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var async = require('async');
    var cmis = require('cmis');
    var http = require('http');
    var url = require('url');
    var fs = require('fs');
    
    function removeTrailingSlash(path) {
        return path.charAt(path.length - 1) === '/' ? path.substring(0, path.length - 1) : path;
    }

    grunt.registerTask('cmiscopy', 'copy files and folders to and from CMS', function(specificPath, action) {
        // derive action
        var isUpload = false;
        if(action){
            if(action === 'upload'){
                isUpload = true;
            } else {
                grunt.log.error('action', action, 'is not supported');
                return false;
            }
        } 

        var done = this.async();
        var options = this.options();
        var cmisRootPath = removeTrailingSlash(options.cmisRoot);
        var localRootPath = removeTrailingSlash(options.localRoot);
        if (specificPath) {
            specificPath = removeTrailingSlash(specificPath);
            cmisRootPath = cmisRootPath + '/' + specificPath;
            localRootPath = localRootPath + '/' + specificPath;
        }

        var session = cmis.createSession(options.url);
        session.setCredentials(options.username, options.password);
        session.loadRepositories().ok(function() {

            session.getObjectByPath(cmisRootPath).ok(function(collection) {
                if (collection.objects == null) {
                    // if collection is empty - it must be a file
                    processSingleFile();
                } else {
                    // its a folder
                    processFolder(cmisRootPath, collection, function(err) {
                        done(err == null);
                    });
                }

            }).notOk(function(err) {
                grunt.log.error();
                grunt.log.error('content not found:', cmisRootPath);
                done(false);
            }).error(function(err) {
                grunt.log.error();
                grunt.log.error('failed to retrieve object:', cmisRootPath);
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


        function processSingleFile(){
            // get parent path and file name
            var lastSlashIndex = cmisRootPath.lastIndexOf('/');
            var fileName = cmisRootPath.slice(lastSlashIndex + 1);
            cmisRootPath = cmisRootPath.slice(0, lastSlashIndex);
            localRootPath = localRootPath.slice(0, localRootPath.lastIndexOf('/'));

            session.getObjectByPath(cmisRootPath).ok(function(collection) {
                // find file object in collection
                var fileProps;
                collection.objects.forEach(function(entry) {
                    if (entry.object.properties["cmis:name"].value === fileName) {
                        fileProps = entry.object.properties;
                    }
                });
                if (fileProps) {
                    processFile(cmisRootPath, fileProps, function(err) {
                        done(err == null);
                    });
                } else {
                    // file not found
                    grunt.log.error();
                    grunt.log.error('Content not found:', cmisRootPath);
                    done(false);
                }
            });
        }


        // create function to run with async.parallel()
        function createTask(parentPath, nodeProps) {
            return function(callback) {
                if (nodeProps["cmis:baseTypeId"].value === 'cmis:folder') {
                    // get collection
                    session.getObject(nodeProps['cmis:objectId'].value).ok(function(collection) {
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

            var fileDir = path.slice(cmisRootPath.length + 1);
            if (fileDir) {
                fileDir = localRootPath + '/' + fileDir;
            } else {
                fileDir = localRootPath;
            }

            if(isUpload){
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
            session.setContentStream(objectId, contentBuffer, overwriteFlag, mimeType).ok(function() {
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

            var URL = session.getContentStreamURL(fileProps['cmis:objectId'].value);

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
    });
};

function removeTrailingSlash(path) {
    return path.charAt(path.length - 1) === '/' ? path.substring(0, path.length - 1) : path;
}

