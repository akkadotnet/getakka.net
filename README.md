#Getting started

## Local usage

### Install Node.JS

Follow the instructions on this page https://github.com/joyent/node/wiki/Installation

### Clone the repository.
```
> git clone https://github.com/akkadotnet/getakka.net.git getakkanet
> cd getakkanet
```

### Make sure `grunt-cli` is installed
```
> npm install -g grunt-cli
```


### Install the package
```
> npm install -d
```

### Build the site
```
> grunt
```

Once the site is generated, a browser will be opened, displaying the result.

### Live reloads
When running the site locally, the grunt script will be watching the `/src/` folder for changes.
If any change is detected, this will trigger a regeneration of the content and your browser will be live reloaded.

## Deploying changes to the live site

The live site http://GetAkka.NET will be redeployed whenever a change is made to this repository.
This can take a few minutes as we use a free build server.

## Making style changes
Edit the appropriate file in `/_scss`. The SCSS files then get compiled automatically by `grunt-contrib-compass` into the `screen.css` file.

## Contributing to the documentation

Contributions to the wiki documentation can be done in a few different ways;

Fork and Clone this repository, then apply your modifications to the files inside `src/wiki/`.
`Commit` and `Push` your changes back to your Github Fork and create a pull request.
See `Local usage` for more info on how to preview your local changes.

Or.
You can use the `Edit on Github` link on each Wikipage on the live site, this will take you to an edit mode version of the page here on github.
If you do not have commit rights for this repository, Github will allow you to do an ad hoc pull request right there.


## Markdown compatibility

We use Marked.JS for markdown rendering.
Thus, any editor based on this will give you the best preview/edit experience, such as https://atom.io/ or https://stackedit.io/.
