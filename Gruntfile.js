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
        copy: {
            "assets" : { // copy assets from source to output folder
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

        clean: {
            all: ['web/*.html']
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
        'clean', // clean out any deleted files
        'copy',  // copy documentation to src, copy resources from src to output
        'assemble',  // build pages
        'open',
        'http-server'  // start server
    ]);
};
