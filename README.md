# Getting started

## Contributing to the docs
We welcome contributions from anyone! Contributions to the docs can be done in two ways:

1. Fork and Clone this repository, and send your changes in via pull request. [*Read and follow the docs guidelines here*](DOCS_GUIDELINES.md).
2. You can use the `Edit on GitHub` link on each page of [the live docs](http://getakka.net/docs), this will take you to an edit mode version of the page here on GitHub. If you don't have commit rights for this repo, Github will allow you to make an ad hoc pull request right there.

## Deployment
The [live site](http://GetAkka.NET) will be built & redeployed whenever a change is made to the master branch of this repository.

This usually takes a few minutes, as we use a free build server.

## Local usage / development
### Install Node.JS
Follow the instructions on [this page](https://github.com/joyent/node/wiki/Installation) to install Node.

### Make sure `grunt-cli` is installed
```
> npm install -g grunt-cli
```

### Fork, then clone this repository.
```
> git clone https://github.com/<your name here>/getakka.net.git getakkanet
> cd getakkanet
```

### Install the packages
```
> npm install -d
```

### Build the site
```
# from within your local fork of the repo
> grunt
```

Once the site is generated, a browser will be opened, displaying the result.

### Live reloads
When running the site locally, the grunt script will be watching the `/src/` folder for changes.

If any changes are detected, this will trigger a regeneration of the content and your browser will be live reloaded.

### Making CSS/style changes
Our custom styling is all done via [SCSS](http://sass-lang.com/documentation/file.SASS_REFERENCE.html).

Edit the appropriate "underscored" file in the `/_scss`. These SCSS files then get compiled automatically by `grunt-contrib-compass` into the `screen.css` file, which is then copied by grunt into `/web`.

### Adding data for use in templates
To add sitewide data that can be used in any template/page, you can add it to `src/_data/site.yml` and it will then be accessible via [Handlebars](handlebarsjs.com) in all templates. For example, `site.yml` defines `url`, which is then accessed in the templates like so: `{{site.url}}`.

For more details / advanced usage, read the docs on [`options.data`](http://assemble.io/docs/options-data.html).

### Markdown compatibility
We use Marked.JS for markdown rendering. Thus, any editor based on this will give you the best preview/edit experience, such as [Atom](https://atom.io) or [StackEdit](https://stackedit.io/).

## Tools used
This site is built with [Assemble.io](http://assemble.io) static site generator, which uses the following tools to do its work:

- [Node.JS](https://nodejs.org/) to power everything
- [Handlebars](handlebarsjs.com) as the templating engine
- [Grunt](http://gruntjs.com/) for build/task automation