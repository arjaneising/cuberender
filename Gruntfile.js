module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),


    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
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
          'dist/cuberender.css': 'src/style/cuberender.sass'
        }
      },
      build: {
        options: {
          style: 'compressed'
        },
        files: {
          'dist/cuberender.css': 'src/style/cuberender.sass'
        }
      }
    }


  });


  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');

  // Tasks
  grunt.registerTask('dev', ['uglify:build', 'sass:dev']);
  grunt.registerTask('build', ['uglify:build', 'sass:build']);
  grunt.registerTask('default', ['build']);

};