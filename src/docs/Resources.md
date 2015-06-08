---
layout: docs.hbs
title: Resources
active_selector: resources
---
## Akka.NET Bootcamp
[Akka.NET Bootcamp]({{site.bootcamp_url}}) is a free, self-directed learning course brought to you by the folks at [Petabridge](https://petabridge.com). Over the three units of this bootcamp you will learn how to create fully-functional, real-world programs using Akka.NET actors and many other parts of the core Akka.NET framework.

[**Start Bootcamp here.**]({{site.bootcamp_url}})

## Blog posts
* [Starting Akka.NET](http://blog.jaywayco.co.uk/starting-akka-net/) - James Conway shares his experience starting Akka.NET and why his company looked to it.
* [What is an Actor?](https://petabridge.com/blog/akkadotnet-what-is-an-actor/) - Conceptual overview of the basics of actor & actor systems.
* [An Actor Model Example with Akka.NET](http://blog.geist.no/an-actor-model-example-with-akka-net/) - intro to the actor model and Netflix-esque example
* [Akka.NET Concurrency Control](http://rogeralsing.com/2014/11/10/akka-net-concurrency-control/) - an example of making lock-free bank account transactions with Akka.NET
* [How actors recover from failure](https://petabridge.com/blog/how-actors-recover-from-failure-hierarchy-and-supervision/) - Discussion of [supervision](http://getakka.net/docs/concepts/supervision), actor hierarchies, and building resilient systems with the error kernel pattern.
* [When should I use `ActorSelection`?](https://petabridge.com/blog/when-should-I-use-actor-selection/) - a discussion of when to use `ActorSelection`s vs. `IActorRef`s and intro to a few best practices.

## Videos
#### Introductory topic videos
* [Above the Clouds: Introducing Akka](https://www.youtube.com/watch?v=UY3fuHebRMI) - Geared towards Akka in Java.  Gives an overview of the Actor model
* [Up, Up, and Out: Scaling Software with Akka](https://www.youtube.com/watch?v=GBvtE61Wrto) - Introduction to Akka
* [The Actor Model in F# and Akka.Net](https://www.youtube.com/watch?v=RiWXo_5CAvg) - Intro to Akka and the F# API.
* [Building Reactive Applications with Akka](https://www.youtube.com/watch?v=6Cb1wSVRI-Q) - Jonas Bonér (creator of original Akka project) explains the Reactive Model and Akka.
* [Distributed Programming Using Akka.NET Framework (in Polish)](https://www.youtube.com/watch?v=_6vDp2-VCjc)
* [Intro to Akka.NET (in Swedish)](https://www.youtube.com/watch?v=Ta6qLA9OsjE)
* [Streaming ETL w/ Akka.NET](https://vimeo.com/123452527) - [Andrew Skotzko](https://twitter.com/askotzko) introduces Akka.NET & how to approach streaming ETL.

#### Advanced topic videos
* [Akka.NET Internals: How Akka.Remote Connections Work](https://www.youtube.com/watch?v=6c1gVLyYcMM)

## Podcasts
* [.NET Rocks! (May 2015)](http://dotnetrocks.com/default.aspx?showNum=1134) — [Aaron Stannard](https://twitter.com/aaronontheweb) introduces Akka.NET v1.0
* [Hanselminutes (April 2015)](http://hanselminutes.com/472/inside-the-akkanet-open-source-project-and-the-actor-model-with-aaron-stannard) — Good overview of concepts in Akka.NET and high-level discussion with [Aaron Stannard](https://twitter.com/aaronontheweb).
* [.NET Rocks! (November 2014)](http://www.dotnetrocks.com/default.aspx?showNum=1058) — Overview of the project discussed w/ [Roger Alsing](https://twitter.com/rogeralsing).

## Code samples / Demos
* [Using Akka.Cluster to build a webcrawler](https://github.com/petabridge/akkadotnet-code-samples/tree/master/Cluster.WebCrawler)