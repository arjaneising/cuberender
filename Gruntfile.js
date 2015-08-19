module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),


    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> / <%= grunt.template.today("yyyy-mm-dd") %> / License: MIT */\n'
      },
      build: {
        src: 'src/script/cuberender.js',
        dest: 'dist/cuberender.min.js'
      }
    },


    sass: {
      dev: {
        options: {
          style: 'expanded'
        },
        files: {
          'tmp/cuberender.css': 'src/style/cuberender.sass'
        }
      },
      build: {
        options: {
          style: 'expanded'
        },
        files: {
          'tmp/cuberender.css': 'src/style/cuberender.sass'
        }
      }
    },




    autoprefixer: {
      options: {
        browsers: ['last 10 versions', 'ie 10']
      },
      build: {
        src: 'tmp/cuberender.css',
        dest: 'dist/cuberender.css'
      },
    },


  });


  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-autoprefixer');

  // Tasks
  grunt.registerTask('dev', ['uglify:build', 'sass:dev', 'autoprefixer:build']);
  grunt.registerTask('build', ['uglify:build', 'sass:build', 'autoprefixer:build']);
  grunt.registerTask('default', ['build']);

};