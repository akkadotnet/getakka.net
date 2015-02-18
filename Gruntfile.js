module.exports = function(grunt) {
    var output = "web/";
    var source = "src/"
    var layouts = source + 'layouts';
    var assets = source + 'assets';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        open : {
          dev : {
            path: 'http://127.0.0.1:8080/'
          }
        },
        'http-server': {
            'dev': {
                root: "web",
                port: 8080,
                host: "0.0.0.0",
                cache: 0,
                showDir : true,
                autoIndex: true,
                // server default file extension
                ext: "html",
                // run in parallel with other tasks
                runInBackground: false
            }
        },
        clean: ['akka.net',output,'src/wiki'],
        gitclone: {
            "akka.net": { //clone akka.net repository
                options: {
                    branch : 'dev',
                    repository : 'https://github.com/akkadotnet/akka.net.git',
                    depth:1
                }
            }
        },

        copy: {
            "documentation" : { //copy documentation and assets from akka.net repo to our source folder
                files: [
                    {
                        expand: true,
                        cwd   : 'akka.net/documentation',
                        src   : ['**/*.*'],
                        dest  : source
                    },
                ]
            },
            "assets" : { //copy assets from source to output folder
                files: [
                    {
                        expand: true,
                        cwd   : source,
                        src   : ['**/*.*','!**/*.hbs','!**/*.md','!**/.htm'],
                        dest  : output
                    },

                ]
            }
        },
        replace: { //fix template names, that is, add .hbs extension
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
                layout: "wiki.hbs",
                flatten: false,
                expand: true,
                layoutdir: layouts,
                helpers: ['helper-gfm.js'],
                assets: assets
            },

            "pages": { //build all pages, hbs and markdown
                files: [
                    {
                        expand: true,
                        cwd: source,
                        src: ['*.hbs','pages/*.hbs','**/*.md','help/**/*.htm'],
                        dest: output,
                        ext: '.html'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-http-server');
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
        'assemble',         //build pages
        'open',
        'http-server'       //start server
        ]);
};
