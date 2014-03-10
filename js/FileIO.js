/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */
var http = require('http');
var url = require('url');
var fs = require('fs');
var grunt = require('grunt');
var crypto = require('crypto');
var BufferWriter = require('./BufferStreams').BufferWriter;
var BufferReader = require('./BufferStreams').BufferReader;

/**
 * Factory method creates FileIO object.
 * 
 * TODO: Error handling - Translate http Status Codes:
 * invalidArgument              400
 * objectNotFound               404
 * permissionDenied             403
 * notSupported                 405
 * runtime                      500
 * constraint                   409
 * filterNotValid               400
 * streamNotSupported           403
 * storage                      500
 * contentAlreadyExists         409
 * versioning                   409
 * updateConflict               409
 * nameConstraintViolation      409
 * 
 * 
 * @param cmisSession
 * @param options - options object provided in task config
 * @returns {
 *      uploadFile: function(localDir, fileName, objectId, mimeType, callback),
 *      downloadFile: function(localDir, fileName, objectId, mimeType, callback)
 * }
 * 
 */
exports.create = function(cmisSession, options) {

    function getRemoteData(objectId, callback) {
        var URL = cmisSession.getContentStreamURL(objectId);

        var requestOptions = url.parse(URL);
        requestOptions.auth = options.username + ':' + options.password;
        http.get(requestOptions, function(response) {
            callback(null, response);
        }).on('error', function(e) {
            callback(e.message);
        });
    }

    function compare(remoteDataStream, localDataStream, callback) {
        getCheckSum(remoteDataStream, function(err, remoteCheckSum) {
            if (err) {
                callback(err);
                return;
            }

            getCheckSum(localDataStream, function(err1, localCheckSum) {
                if (err1) {
                    callback(err1);
                    return;
                }
                callback(null, localCheckSum === remoteCheckSum);
            });

        });
    }


    function getCheckSum(stream, callback) {
        var hash = crypto.createHash('sha1');
        hash.setEncoding('hex');

        stream.pipe(hash, {end: false});
        stream.on('end', function() {
            hash.end();
            var checkSum = hash.read();

            callback(null, checkSum);
        });
        stream.on('error', function(error) {
            callback('error streaming file ' + error);
        });
    }

    function doUpload(filepath, objectId, data, mimeType, callback) {
        var overwriteFlag = true;
        cmisSession.setContentStream(objectId, data, overwriteFlag, mimeType).ok(function() {
            grunt.log.ok("uploaded", filepath);
            callback();
        });
    }

    return {
        uploadFile: function(localDir, fileName, objectId, mimeType, callback) {
            var filepath = localDir + '/' + fileName;

            fs.readFile(filepath, function(err, data) {

                if (err) {
                    grunt.log.error('unable to read file', filepath);
                    // ignore this error and continue wiht next file
                    callback();
                    return;
                }


                getRemoteData(objectId, function(err, response) {
                    if (err == null && response.statusCode === 200) {
                        // check if content is the same
                        compare(response, new BufferReader(data), function(err, isSame) {
                            if (err || !isSame) {
                                doUpload(filepath, objectId, data, mimeType, callback);
                            }
                            else
                            {
                                // dont upload
                                callback();
                            }
                        });

                    } else {
                        // if failed to get remote data - just upload
                        doUpload(filepath, objectId, data, mimeType, callback);
                    }

                });

            });
        },
        downloadFile: function(localDir, fileName, objectId, mimeType, callback) {
            var filePath = localDir + '/' + fileName;

            grunt.file.mkdir(localDir);

            getRemoteData(objectId, function(err, response) {
                if (err) {
                    callback(err);
                    return;
                }
                if (response.statusCode !== 200) {
                    grunt.log.error('Download failed', response.statusCode, filePath);
                    callback();
                } else {


                    // check if local file is the same as remote
                    fs.readFile(filePath, function(err, data) {

                        if (err) {
                            // file doesnt exist - just download remote
                            var writer = fs.createWriteStream(filePath);
                            response.pipe(writer, {end: false});
                            response.on('end', function() {
                                writer.end(function(){
                                    grunt.log.ok('downloaded', filePath);
                                    callback(null);
                                });
                            });
                            response.on('error', function(error) {
                                callback('error downloading file ' + error);
                            });
                            
                            return;
                        }
                        
                        // file exists - check if its different
                        var bufferWriter = new BufferWriter();
                        response.pipe(bufferWriter);
                        
                        compare(response, new BufferReader(data), function(err, isSame) {
                            // this will be called when response stream is exhausted by compare()

                            if (err || isSame) {
                                callback(err);
                                return;
                            }

                            // if not the same - write buffer to a file 
                            fs.writeFile(filePath, bufferWriter.buffer, function(err) {
                                if(err){
                                    callback('error writing file ' + filePath + ' ' + err);
                                    return;
                                }
                                grunt.log.ok('downloaded', filePath);
                                callback(null);
                            });

                        });


                    });

                }
            });

        }
    };
};





