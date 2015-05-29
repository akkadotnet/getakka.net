---
layout: docs.hbs
title: Akka.NET Nightly Builds
---

# Nightly & Developer Builds
If you're interested in working on the Akka.NET project or just want to try out the very latest Akka.NET edge releases, you can subscribe to the project's [Nuget](http://www.nuget.org/) feed.

## Nightly NuGet Feed URL
Below is the URL for the Akka.NET and [Helios](http://helios-io.github.io/) NuGet feeds.

> **http://petabridge-ci.cloudapp.net/guestAuth/app/nuget/v1/FeedService.svc/**

To consume this NuGet feed in Visual Studio, [follow the steps outlined in the NuGet documentation for adding a package source to NuGet](http://docs.nuget.org/create/hosting-your-own-nuget-feeds).

Once you've done that you can use the Package Manager in Visual Studio and consume the latest packages:

![Consume pre-release nightly Akka.NET builds from Nuget](../images/akka-developers/nightly-builds.png)

> Make sure you allow for *pre-release* builds - otherwise you won't see the nightly builds!

## Build Frequency and Details

The nightly builds are generated nightly at midnight UTC if there have been modifications to the `dev` branch of Akka.NET since the previous build.