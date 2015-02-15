module.exports = function(grunt) {
    var output = "web/";
    var source = "src/"
    var layouts = source + 'layouts';
    var assets = source + 'assets';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        assemble: {
            options: {
                layout: "master.hbs",
                flatten: false,
                expand: true,
                layoutdir: layouts,
                helpers: ['helper-gfm.js'],
                assets: assets 
            },

            pages: {
                files: [
                    {
                        expand: true, 
                        cwd: source, 
                        src: ['*.hbs','pages/*.hbs','**/*.md'], 
                        dest: output, 
                        ext: '.html'
                    }
                ]
            }
        },
        clean: [output],

        copy: {
            main : {
                files: [
                    {
                        expand: true,
                        cwd   : source,
                        src   : ['**/*.*','!**/*.hbs','!**/*.md'],
                        dest  : output
                    }
                ]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('assemble');

    grunt.registerTask('default', ['clean','copy','assemble']);
};

