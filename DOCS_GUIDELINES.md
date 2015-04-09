# Documentation Guidelines for Contributors

## Fork and Clone this repository
Then apply your modifications to the files inside `src/docs/`.

`Commit` and `Push` your changes back to your Github Fork and create a pull request to the main repo.

See the [README](/README.md) for more info on how to preview your local changes.

Here are the guidelines to follow when working on the docs:

- ***Use simple language***. This is the docs, not an academic white paper.
- Use the [latest stable APIs](http://api.getakka.net/docs/stable/index.html) everywhere, since they will be supported long-term.
- Draw diagrams where appropriate. Most programmers are visual learners. They will love you for this.
- If you find any old Java / Scala code samples, replace with relevant C# AND F# samples.
- Include BOTH F# and C# samples - if you need help with the F#, let @akkadotnet/fsharpteam know.
- Use .NET Fiddle for any runnable samples in the docs.
- All of the docs are written in Markdown format and are saved to the `src/docs` directory in this repo.

Some good examples of this standard are:

- [Messages](http://getakka.net/docs/concepts/messages)
- [Location Transparency](http://getakka.net/docs/concepts/location-transparency)
- [Configuration](http://getakka.net/docs/concepts/configuration)
