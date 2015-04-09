# Documentation Guidelines for Contributors

## Guidelines
Here are the guidelines to follow when working on the docs:

### ***Use simple language***.
This is rule #1, 2, and 3.

This is the docs, not an academic white paper. Write to help, not to sound smart. Simplify, simplify, simplify.

### Which APIs to use
Unless you're explicitly documenting something that is unstable, use the [latest stable APIs](http://api.getakka.net/docs/stable/index.html) everywhere, since they will be supported long-term.

If you notice something wrong with an old code sample or doc (such as outdated API usage), please fix it or bring it to the attention of the @akkadotnet/contributors.

### Use diagrams and visuals
Draw diagrams where appropriate. Most programmers are visual learners. They will love you for this.

A good animated GIF is *always* welcome.

### Code samples
Include BOTH F# and C# samples whenever adding code samples. Both languages are first class citizens in Akka.NET. (If you need help with the F#, let the @akkadotnet/fsharpteam know.)

If you find any old Java / Scala code samples in the docs, replace with relevant C# and F# samples.

Use .NET Fiddle for any runnable samples in the docs.

### Formatting
All of the docs are written in Markdown format and are saved to the `src/docs` directory in this repo.

### Examples
Here are some examples that meet this standard:

- [Messages](http://getakka.net/docs/concepts/messages)
- [Location Transparency](http://getakka.net/docs/concepts/location-transparency)
- [Configuration](http://getakka.net/docs/concepts/configuration)
- [Akka.NET Bootcamp units](https://github.com/petabridge/akka-bootcamp)


## Workflow
See the [README](/README.md) for more info on how to preview your local changes.

1. Fork and Clone this repository
2. Apply your modifications to the files inside `src/docs/`.
3. If you've added a new file, update the index file at `src/docs/index.hbs` and link to the new docs in the appropriate section.
4. `Commit` and `Push` your changes back to your Github Fork.
5. Create a pull request from your Fork back to the main repo.
6. Your PR will be reviewed, and most likely immediately merged.
7. We love you forever!



