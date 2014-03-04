/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */
'use strict';

var grunt = require('grunt');
var actions = require('./Actions');

function removeTrailingSlash(path) {
    return path.charAt(path.length - 1) === '/' ? path.substring(0, path.length - 1) : path;
}

function removeLeadingSlash(path) {
    return path.charAt(0) === '/' ? path.substring(1) : path;
}

function trimSlashes(path){
    return removeTrailingSlash(removeLeadingSlash(path));
}

module.exports = function(cmisSession, fileUtils, options, pathArg, actionArg) {
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
    
    
    function runTask(done){
        var fileProcessor;
        
        // set global (default) error handlers
        function defaultErrorHandler(err){
            grunt.log.error();
            grunt.log.error(err);
            done(false);               
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
                if(object.succinctProperties){
                    // current CMIS
                    fileProcessor = require('./FilePorcessor')(cmisSession, fileUtils, cmisPath, localPath, action);
                } else {
                    // legacy CMIS
                    fileProcessor = require('./FilePorcessorLegacyApi')(cmisSession, fileUtils, cmisPath, localPath, action);
                }
                
                fileProcessor.process(object, function(err){
                    if(err){
                        grunt.log.error();
                        grunt.log.error(err);                        
                    }
                    if(action === actions.list){
                        console.log();
                        fileProcessor.documents.sort().forEach(function(doc){
                            console.log(removeLeadingSlash(doc));
                        });
                    }
                    done(err == null);
                });
                
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


    return {
        // expose for testing
        cmisPath: cmisPath,
        localPath: localPath,
        action: action,
        
        runTask: runTask
    };
};

