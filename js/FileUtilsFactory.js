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
var BufferWriter = require('./BufferWriter');

/**
 * Factory method creates FileUtils object.
 * 
 * TODO: Error handling - Translate Return Codes:
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
module.exports = function(cmisSession, options) {

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

    function compare(data, filePath, callback) {
        getCheckSum(data, function(err, remoteCheckSum) {
            if (err) {
                callback(err);
                return;
            }
            
            getCheckSum(fs.createReadStream(filePath), function(err1, localCheckSum) {
                if (err1) {
                    // ignore if failed to get file CheckSum, just assume they are not the same
                    callback(null, false);
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

                var overwriteFlag = true;
                cmisSession.setContentStream(objectId, data, overwriteFlag, mimeType).ok(function() {
                    grunt.log.ok("uploaded", filepath);
                    callback();
                }).notOk(function(err) {
                    callback(err);
                }).error(function(err) {
                    callback(err);
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
                    
                    var bufferWriter =  new BufferWriter();
                    response.pipe(bufferWriter);
                    
                    compare(response, filePath, function(err, isSame) {
                        // this will be called when response stream is exhausted

                        if (err || isSame) {
                            callback(err);
                            return;
                        }
                        
                        // if not the same - write buffer to a file 
                        var writer = fs.createWriteStream(filePath);
                        writer.write(bufferWriter.buffer, function(){
                            grunt.log.ok('downloaded', filePath);
                            callback(null);
                        });
                        
                        writer.on('error', function(error){
                            callback('error writing file ' + filePath + ' ' + error);
                        });
                    });


                }
            });

        }
    };
};





