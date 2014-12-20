/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/grunt-cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var CmisCopy = require('../js/CmisCopy');
    var fs = require('fs');

    grunt.registerTask('cmiscopy', 'copy files and folders to and from CMS', function(specificPath, action) {
        

        var options = this.options();
        
        // output configured local root directory
        if(action === 'localRoot'){
            console.log('localroot: ' + fs.realpathSync(options.localRoot));
            return;
        }
        
        var done = this.async();

        var cmisCopy = CmisCopy.create(options, specificPath, action);

        cmisCopy.runTask(function(err) {
            if (err) {
                grunt.log.error();
                grunt.log.error(err);
            }
            done(err == null);
        });
    });
};