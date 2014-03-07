/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */
'use strict';
var cmis = require('cmis');
var grunt = require('grunt');
var actions = require('./Actions');
var createFileProcessor = require('./FilePorcessor');
var createLegacyFileProcessor = require('./FilePorcessorLegacyApi');

function removeTrailingSlash(path) {
    return path.charAt(path.length - 1) === '/' ? path.substring(0, path.length - 1) : path;
}

function removeLeadingSlash(path) {
    return path.charAt(0) === '/' ? path.substring(1) : path;
}

function trimSlashes(path){
    return removeTrailingSlash(removeLeadingSlash(path));
}

module.exports = function(options, pathArg, actionArg) {
    var cmisSession = cmis.createSession(options.url);
    var cmisPath = removeTrailingSlash(options.cmisRoot);
    var localPath = removeTrailingSlash(options.localRoot);
    var action = actions.download; // default action

    // apply pathArg
    if (pathArg) {
        pathArg = trimSlashes(pathArg);
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
    
    /**
     * @param callback - to be called with error or with no parameters if successful
     */
    function runTask(callback){
        
        // set global (default) error handlers
        function defaultErrorHandler(err){
            grunt.log.error();
            grunt.log.error(err);
            callback(err);               
        }
        cmisSession.setGlobalHandlers(defaultErrorHandler, defaultErrorHandler);
        
        grunt.log.ok('Connecting to', options.url);
        cmisSession.loadRepositories().ok(function() {
            if(action === actions.list){
                grunt.log.ok('Listing contents of', cmisPath);
                grunt.log.write('Gatherting info...');
            }else{
                grunt.log.ok('Detecting changes...');
            }
            
            cmisSession.getObjectByPath(cmisPath).ok(function(object) {
                var fileProcessor;
                if(object.succinctProperties){
                    // current CMIS
                    fileProcessor = createFileProcessor(cmisSession, options, cmisPath, localPath, action);
                } else {
                    // legacy CMIS
                    fileProcessor = createLegacyFileProcessor(cmisSession, options, cmisPath, localPath, action);
                }
                
                fileProcessor.process(object, function(err){
                    if(err){
                        grunt.log.error();
                        grunt.log.error(err);     
                        callback(err);
                        return;
                    }
                    
                    if(action === actions.list){
                        console.log();
                        fileProcessor.documents.sort().forEach(function(doc){
                            console.log(removeLeadingSlash(doc));
                        });
                    }
                    callback();
                });
                
            }).notOk(function(responce) {
                var status = responce.statusCode? responce.statusCode : "";
                var message = 'failed to get content: '+ status + " " + cmisPath;
                
                grunt.log.error();
                grunt.log.error(message);
                callback(responce);
            }).error(function(err) {
                grunt.log.error();
                grunt.log.error('failed to retrieve object:', cmisPath);
                callback(err);
            });
        });
    }


    return {
        runTask: runTask,
        
        // expose for testing
        cmisPath: cmisPath,
        localPath: localPath,
        action: action
    };
};

