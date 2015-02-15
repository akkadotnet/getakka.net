module.exports = function(grunt) {
    var output = "web/";
    var source = "src/"
    var layouts = source + 'layouts';
    var assets = source + 'assets';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['akka.net',output,'src/wiki'],
        gitclone: {
            "akka.net": {
                options: {
                    branch : 'dev',
                    repository : 'https://github.com/akkadotnet/akka.net.git',
                    depth:1
                }
            }
        },

        copy: {
            "documentation" : {
                files: [ 
                    {
                        expand: true,
                        cwd   : 'akka.net/documentation',
                        src   : ['**/*.*'],
                        dest  : source
                    },
                ]
            },
            "assets" : {
                files: [
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
          "template names": {
            src: ['src/**/*.md'], 
            overwrite: true,  
            replacements: [{
              from: 'layout: wiki',
              to: 'layout: wiki.hbs'
            },
            {
              from: "'$'",
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

            "pages": {
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

    grunt.registerTask('default', [
        'clean',
        'gitclone',         //fetch akka.net
        'copy',             //copy documentation to src, copy resources from src to output
        'replace',          //fix up template names (.hbs)
        'assemble']);       //build pages
};

