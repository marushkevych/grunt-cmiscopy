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

module.exports = function(cmisSession, options) {
    return {
        streamFile: function(fileDir, fileName, fileProps, callback, isUpload){
            if(isUpload){
                this.uploadFile(fileDir, fileName, fileProps, callback);
            }else{
                this.downloadFile(fileDir, fileName, fileProps, callback);
            }
        },
        
        uploadFile: function(fileDir, fileName, fileProps, callback) {
            var filepath = fileDir + '/' + fileName;

            var objectId = fileProps['cmis:objectId'].value;
            var contentBuffer = grunt.file.read(filepath, {encoding: null});
            var overwriteFlag = true;
            var mimeType = fileProps['cmis:contentStreamMimeType'].value;
            cmisSession.setContentStream(objectId, contentBuffer, overwriteFlag, mimeType).ok(function() {
                grunt.log.ok("uploaded", mimeType, filepath);
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
        },

        downloadFile: function(fileDir, fileName, fileProps, callback) {
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
                        grunt.log.ok('downloaded', fileProps['cmis:contentStreamMimeType'].value, filePath);
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
    };
};



