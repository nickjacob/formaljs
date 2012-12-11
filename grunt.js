// GruntFile
//  build configuration for the project
//  @author nbjacob

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: '<json:formal.json>',
    meta: {
      banner: '//------------------------------------------------------\n'+
        '// <%= pkg.title || pkg.name %> - v<%= pkg.version %> @ ' +
        '<%= grunt.template.today("dd-mm-yy") %>\n' +
        '<%= pkg.homepage ? "// "+ pkg.homepage + "\n" : "" %>' +
        '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;\n//------------------------------------------------------\n'+
        ';(function __formal__(window,undefined){\n"use strict";\n' + 
        'var __VERSION__ = __VERSION__ || "<%= pkg.version %>";\n' + 
        '$ = window.$ || window.jQuery || window.jq_shim;',
      footer: "})(window);"
    },

    concat: {
      dist: {
        src: ['<banner:meta.banner>',['src/formal.core.js','src/formal.timeline.js', 'src/formal.wrappers.js','src/formal.main.js'],'<banner:meta.footer>'],
        dest: 'dist/formal.js',
        footer: '<banner:meta.footer>'
      },
    },

    min: {
      dist: {
        src: ['<config:concat.dist.dest>'],
        dest: 'dist/formal.min.js',
        footer: '<banner:meta.footer>'
      }
    },

    uglify: {},

    jshint: {
      options: {
        browser: true
      }
    },


  });

  grunt.registerTask('default','concat min');

};
