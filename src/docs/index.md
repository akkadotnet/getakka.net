---
layout: docs.hbs
title: Akka.NET Documentation
---

## Akka.NET API Docs
- [1.0 Stable API](http://api.getakka.net/docs/stable/index.html)

## Akka.NET Framework
### Introduction
- [What is Akka?](What is Akka)
- [Why Akka?](Why Akka)
- [Getting Started](Getting started)
- [The Obligatory Hello World](The Obligatory Hello World)
- Use-case and Deployment Scenarios
	- [Console](deployment-scenarios/Console)
	- [ASP.NET](deployment-scenarios/ASP NET)
	- [Windows Service](deployment-scenarios/Windows Service)
	- [Azure PaaS Worker Role](deployment-scenarios/Azure PaaS Worker Role)
- [Examples of use-cases for Akka](Examples of use cases for Akka)

## Akka.NET Concepts
- [Terminology, Concepts](concepts/terminology)
- [Actor Systems](concepts/actorsystem)
- [What is an Actor?](concepts/actors)
- [What is a Message?](concepts/messages)
    - [Immutability](concepts/messages#messages-are-immutable)
- [Supervision and Monitoring](concepts/supervision)
- [Actor References, Paths and Addresses](concepts/addressing)
- [Location Transparency](concepts/location-transparency)
- [Message Delivery Reliability](concepts/message-delivery-reliability)
- [Configuration](concepts/configuration)
    - [HOCON](concepts/hocon)

### Working with Actors
- [Creating your first Actor](working-with-actors/creating-actors)
- [Defining an Actor class](working-with-actors/defining-an-actor)
- [What's in an Actor](working-with-actors/whats-in-an-actor)
- [Creating actors with Props](working-with-actors/creating-actors-with-props)
- [Handling Messages](working-with-actors/handling-messages)
- [Sending Messages](working-with-actors/sending-messages)
- [Actor lifecycle](working-with-actors/Actor lifecycle)
- [Dispatchers](working-with-actors/Dispatchers)
- [Mailboxes](working-with-actors/Mailbox)
- [Switchable Behaviors](working-with-actors/Switchable Behaviors)
- [Stashing Messages](working-with-actors/Stashing Messages)
- [Stopping Actors](working-with-actors/stopping-actors)

### Actors
- [Working with actors](Working with actors)
- [F# API](FSharp API)
- [ReceiveActors](ReceiveActor)
- [Finite State Machines](FSM)
- [Persistence](Persistence)
- [Fault Tolerance](Fault tolerance)
- [Props](Props)
- [Receive timeout](Receive timeout)
- [Dependency injection](Dependency injection)
- [Routers](working-with-actors/Routers)

### Akka.Remote
- [Akka.Remote Overview](remoting/)
    - [Use Cases](remoting/#use-cases)
    - [Enabling Akka.Remote](remoting/#enabling-akka-remote)
    - [Remote Addressing](remoting/#addresses-transports-endpoints-and-associations)
    - [Connecting Remote Systems](remoting/#how-to-form-associations-between-remote-systems)
- [Transports](remoting/transports)
    - [Built-in Transports](remoting/transports#akka-remote-s-built-in-transports)
    - [Custom Transports](remoting/transports#using-custom-transports)
    - [Running Multiple Transports Simultaneously](remoting/transports#running-multiple-transports-simultaneously)
- [Remote Messaging](remoting/messaging)
    - [Serialization](remoting/messaging#serialization)
    - [RemoteActorRefs](remoting/messaging#-remoteactorref-and-location-transparency)
- [Deploying Actors Remotely](remoting/deployment)
    - [When to Use Remote Deployment](remoting/deployment#when-to-use-remote-deployment)
- [Detecting & Handling Network Failures (DeathWatch)](remoting/deathwatch)
- [Network Security](remoting/security)

### Akka.Cluster
- [Akka.Cluster Overview](clustering/cluster-overview)
    - [What is a Cluster?](clustering/cluster-overview#what-is-a-cluster-)
    - [Benefits](clustering/cluster-overview#benefits-of-akka-cluster)
    - [Use Cases](clustering/cluster-overview#use-cases)
    - [Terminology](clustering/cluster-overview#key-terms)
    - [Enabling Akka.Cluster](clustering/cluster-overview#enabling-akka-cluster)
    - [Cluster Gossip](clustering/cluster-overview#cluster-gossip)
    - [Nodes](clustering/cluster-overview#nodes)
    - [How a Cluster Forms](clustering/cluster-overview#how-a-cluster-forms)
- [Cluster Routing](clustering/cluster-routing)
    - [How Routers Use Cluster Gossip](clustering/cluster-routing#how-routers-use-cluster-gossip)
    - [Cluster Routing Strategies](clustering/cluster-routing#cluster-routing-strategies)
    - [Types of Clustered Routers](clustering/cluster-routing#types-of-clustered-routers)
    - [Clustered Router Configuration](clustering/cluster-routing#cluster-router-config)
- [Cluster Configuration](clustering/cluster-configuration)
    - [Critical Configuration Flags](clustering/cluster-configuration#critical-configuration-options)
    - [Specifying Minimum Cluster Sizes](clustering/cluster-configuration#specifying-minimum-cluster-sizes)
- [Accessing the Cluster `ActorSystem` Extension](clustering/cluster-extension)
    - [Getting a Reference to the `Cluster`](clustering/cluster-extension#getting-a-reference-to-the-cluster-)
    - [Working With Cluster Gossip](clustering/cluster-extension#working-with-cluster-gossip)
    - [Cluster Gossip Event Types](clustering/cluster-extension#cluster-gossip-event-types)
    - [Getting Cluster State](clustering/cluster-extension#getting-cluster-state)
- [Akka.Cluster.Tools module](clustering/cluster-tools)
    - [Creating cluster singleton actors](clustering/cluster-singleton)
    - [Cluster distributed publish/subscribe](clustering/distributed-publish-subscribe)
    - [Communication with cluster without joining to it](clustering/cluster-client)
- [Akka.Cluster.Sharding module](clustering/cluster-sharding)

### Networking
- [Serialization](Serialization)
- [Akka I/O](IO)

### Utilities
- [EventBus](EventBus)
- [Logging](Logging)
  - [Using Serilog](Serilog)
- [Scheduler](Scheduler)
- [Circuit Breaker](CircuitBreaker)

### Testing
- [Using the MultiNode Testkit for Testing Distributed ActorSystems](testing/multinode-testkit)

### Information for Akka Developers
- [Building and Distributing Akka.NET](Building and Distributing Akka)
- [Getting Access to Nightly Akka.NET Builds](akka-developers/nightly-builds)
- [Approving Public API Changes](akka-developers/public-api-changes)
- [Contributor guidelines](Contributor guidelines)
- [Documentation Guidelines](Documentation guidelines)
- [Team](Team)

### Project Information
- [Licenses](Licenses)
- [Sponsors](Sponsors)
- [Project](Project)

### Additional Information
- [Frequently Asked Questions](FAQ)
- [Online resources](Resources)
- [Books](Books)
