---
layout: docs.hbs
title: Extension Ideas
---
# Extension ideas

Akka.NET provides a great number of areas, where you can work on interesting problems and ideas. Here you can find some of them. You can add one by yourself by editing this page. You can also discuss them on Akka.NET [gitter chat](https://gitter.im/akkadotnet/akka.net).

##### Akka cluster discovery

Effort: Big

Currently Akka.NET cluster initialization assumes, that all of the members willing to join the cluster will know at least one of its members already. The idea here is to create a pluggable extension, that will allow to share that information using external services like [ZooKeeper](https://zookeeper.apache.org/) or [Consul](https://www.consul.io/). It could also be integrated with Akka.Persistence, giving support for all existing persistent backends for free.

##### Split brain resolver

Effort: Medium/Big

One of the common problems is maintaining cluster integrity in case of network failures. Its often known as [Split brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) scenario. As Akka.NET allows programmatically decide how to deal with such problems, it could also provide an automated way of dealing with such issues, based on some of the well known strategies used in cases like that.

##### HOCON plugin for Visual Studio

Effort: Medium/Big

[HOCON](https://github.com/typesafehub/config/blob/master/HOCON.md) is Akka.NET configuration format. Idea here is to make it cooperate nicely with Visual Studio.

##### Actor's web socket integration

Effort: Small/Medium/Big - depending on chosen solution

Akka.NET actors can be integrated with web socket protocols on multiple levels - starting from high level integration with existing solutions such as SignalR down to low level implementation of web socket protocol based on Akka.IO bridge between actors and OS sockets.

##### Backend plugins for Akka.Persistence

Effort: Small/Medium

Currently Akka.Persistence supports number of different backends, starting from SQL databases, through Document-oriented, up to big distributed ones like Cassandra or Azure Tables. With small effort you can integrate it with any datastore of your choice i.e. Redis or RavenDB.

##### Serialization plugins

Effort: Small

Akka.NET offers pluggable layer of messages serialization. You could easily integrate it with any serializer library of your choice.

##### Project templates

Effort: Small

Idea here is to prepare Visual Studio project templates for Akka.NET, to make it easy to prepared for scenarios such as Azure/AWS cloud deployments, ASP.NET integration, and so on.
