module.exports = function(grunt) {
    var output = "web/";
    var source = "src/"
    var layouts = source + 'layouts';
    var assets = source + 'assets';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['akka.net',output,'src/wiki'],
        gitclone: {
            your_target: {
                options: {
                    branch : 'dev',
                    repository : 'https://github.com/akkadotnet/akka.net.git',
                    depth:1
                }
            }
        },

        copy: {
            assets : {
                files: [
                    {
                        expand: true,
                        cwd   : 'akka.net/documentation',
                        src   : ['**/*.*'],
                        dest  : source
                    },
                    {
                        expand: true,
                        cwd   : source,
                        src   : ['**/*.*','!**/*.hbs','!**/*.md'],
                        dest  : output
                    },

                ]
            }
        },
        replace: {
          example: {
            src: ['src/**/*.md'], 
            overwrite: true,  
            replacements: [{
              from: 'layout: wiki',                   // string replacement 
              to: 'layout: wiki.hbs'
            },
            {
              from: "'$'",                   // string replacement 
              to: '"$"'
            }]
            },
        },
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
        }
    });
    
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('assemble');

    grunt.registerTask('default', ['clean','gitclone','copy','replace','assemble']);
};

