module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        assemble: {
            options: {
                layout: "src/layouts/master.hbs",
                flatten: true
            },
            pages: {
                files: {
                    'web/': ['src/*.hbs'],
                    'web/wiki/': ['src/wiki/*.md'],
                }
            }
        }
    });
    grunt.loadNpmTasks('assemble');
    grunt.registerTask('default', ['assemble']);
};