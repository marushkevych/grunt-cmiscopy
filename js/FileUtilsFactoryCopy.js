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
 *      uploadFile: function(fileDir, fileName, objectId, mimeType, callback),
 *      downloadFile: function(fileDir, fileName, objectId, mimeType, callback)
 * }
 * 
 */
module.exports = function(cmisSession, options) {
    
    function compare(stream1, stream2, callback){
        getCheckSum(stream1, function(err1, checkSum1){
            if(err1) {
                callback(err1);
                return;
            }
            getCheckSum(stream2, function(err2, checkSum2){
                if(err2) {
                    callback(err2);
                    return;
                }
                
                callback(null, checkSum1 === checkSum2);
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
            console.log(checkSum);
            callback(null, checkSum);
        });
        stream.on('error', function(error) {
            callback('error streaming file ' + error);
        });
    }
    
    return {
        uploadFile: function(fileDir, fileName, objectId, mimeType, callback) {
            var filepath = fileDir + '/' + fileName;
//            var contentBuffer;
//            
//            try{
//                contentBuffer = grunt.file.read(filepath, {encoding: null});
//            }catch(error){
//                grunt.log.error('unable to read file', filepath);
//                // ignore this error and continue wiht next file
//                callback();
//                return;
//            }
            
            
            // read file and update
            fs.readFile(filepath, function(err, data){
                
                if(err){
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

        downloadFile: function(fileDir, fileName, objectId, mimeType, callback) {
            var filePath = fileDir + '/' + fileName;

            grunt.file.mkdir(fileDir);

            var URL = cmisSession.getContentStreamURL(objectId);

            var requestOptions = url.parse(URL);
            requestOptions.auth = options.username + ':' + options.password;
            http.get(requestOptions, function(response) {
                if (response.statusCode !== 200) {
                    grunt.log.error('Download failed', response.statusCode, filePath);
                    callback();
                } else {
                    
                    // compare file contents and if not the same - download
                    compare(response, fs.createReadStream(filePath), function(err, isSame){
                        if(err){
                            callback(err);
                            return;
                        }
                        if(!isSame){
                            console.log('not same', filePath);
                            callback(null);
                            
                            response.pipe(fs.createWriteStream(filePath));
                            
                            response.on('end', function() {
                                grunt.log.ok('downloaded', filePath);
                                callback(null);
                            });
                            response.on('error', function() {
                                callback('error streaming file ' + filePath);
                            });
                            
                        } else {
                            console.log('no change', filePath);
                            callback(null);
                        }
                    });
                    


                    
                }
            }).on('error', function(e) {
                callback(e.message);
            });
        }
    };
};



