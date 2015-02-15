module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        assemble: {
            options: {
                layout: "master.hbs",
                flatten: true,
                layoutdir: 'src/layouts',
                helpers: ['helper-gfm.js']
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

