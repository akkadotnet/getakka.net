module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });
    grunt.loadNpmTasks('assemble');
    grunt.registerTask('default', []);
};