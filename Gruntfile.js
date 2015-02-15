module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main : {
                files: [
                    {
                        expand: true,
                        cwd   :'src/',
                        src   : ['**/*.png','**/*.jpg','**/*.gif','**/*.css','**/*.js','**/*.svg','**/*.ttf','**/*.woff','**/*.eot'],
                        dest  : 'web/'
                    }
                ]
            }
        },
        assemble: {
            options: {
                layout: "master.hbs",
                flatten: false,
                expand: true,
                layoutdir: 'src/layouts',
                helpers: ['helper-gfm.js'],
                assets: 'src/assets' 
            },

            pages: {
                files: [
                    {
                        expand: true, 
                        cwd: 'src/', 
                        src: '*.hbs', 
                        dest: 'web/', 
                        ext: '.html'
                    },
                    {
                        expand: true, 
                        cwd: 'src/', 
                        src: '**/*.md', 
                        dest: 'web/', 
                        ext: '.html'
                    }
                ]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('assemble');

    grunt.registerTask('default', ['assemble','copy']);
};

