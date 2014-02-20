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
    return {
        uploadFile: function(fileDir, fileName, objectId, mimeType, callback) {
            var filepath = fileDir + '/' + fileName;

            var contentBuffer;
            try{
                contentBuffer = grunt.file.read(filepath, {encoding: null});
            }catch(error){
                grunt.log.error('unable to read file', filepath);
                // ignore this error and continue wiht next file
                callback();
                return;
            }
            
            var overwriteFlag = true;
            cmisSession.setContentStream(objectId, contentBuffer, overwriteFlag, mimeType).ok(function() {
                grunt.log.ok("uploaded", filepath);
                callback();
            }).notOk(function(err) {
                callback(err);
            }).error(function(err) {
                callback(err);
            });
        },

        downloadFile: function(fileDir, fileName, objectId, mimeType, callback) {
            var filePath = fileDir + '/' + fileName;

            grunt.file.mkdir(fileDir);
            var file = fs.createWriteStream(filePath);

            var URL = cmisSession.getContentStreamURL(objectId);

            var requestOptions = url.parse(URL);
            requestOptions.auth = options.username + ':' + options.password;
            http.get(requestOptions, function(response) {
                if (response.statusCode !== 200) {
                    grunt.log.error('Download failed', response.statusCode, filePath)
                    callback();
                } else {
                    response.pipe(file);
                    response.on('end', function() {
                        grunt.log.ok('downloaded', filePath);
                        callback(null);
                    });
                    response.on('error', function() {
                        callback('error streaming file ' + filePath);
                    });
                }
            }).on('error', function(e) {
                callback(e.message);
            });
        }
    };
};



