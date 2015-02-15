var S = require('string');
var marked = require('./marked');
var hljs = require('highlight.js');
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    highlight: function (code, lang) {
        try {
            var highlighted = hljs.highlight(lang,code,true).value;
            return highlighted;
        } catch (err) {            
            var highlighted2 = hljs.highlightAuto(code).value;
            return highlighted2;
        }
    },
    langPrefix: 'hljs lang-',
    tableCss: "table table-bordered",
    imgCss: "img-responsive",
    blockQuoteCallback: function (blockquote) {
        var warning = S(blockquote).toLowerCase().startsWith("<blockquote>\n<p><strong>warning");
        var note = S(blockquote).toLowerCase().startsWith("<blockquote>\n<p><strong>note");
        blockquote = blockquote.replace('&lt;br/&gt;', '<br/>').replace('</blockquote>', '</div>');
        if (warning) {
            blockquote = blockquote.replace('<blockquote>', '<div class="alert alert-warning">');
        }
        if (note) {
            blockquote = blockquote.replace('<blockquote>', '<div class="alert alert-default">');
        }
        return blockquote;
    },
    codespanCallback: function (codespan) {
        return codespan;
    }
});

function render(body) {
    return marked(body);
}
module.exports = render;