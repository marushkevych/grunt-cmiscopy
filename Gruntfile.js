/*
 * grunt-cmiscopy
 * https://github.com/marushkevych/cmiscopy
 *
 * Copyright (c) 2014 Andrey Marushkevych
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>',
            ],
            options: {
                jshintrc: '.jshintrc',
            },
        },
        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp'],
        },
        
        jasmine_node: {
            projectRoot: ".",
            requirejs: false,
            forceExit: true,
            jUnit: {
                report: false,
                savePath: "./tmp/jasmine/",
                useDotNotation: true,
                consolidate: true
            }
        },
        
        cmiscopy: {
            options: {
                url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
                cmisRoot: '/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root',
                localRoot: 'src/webapp',
                username: 'admin',
                password: 'admin'
            }
        }        

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-jasmine-node');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['jasmine_node']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
