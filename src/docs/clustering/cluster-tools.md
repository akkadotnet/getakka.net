---
layout: docs.hbs
title: Akka.Cluster.Tools module
---
# Akka.Cluster.Tools module

[Akka.Cluster.Tools]() is a set of extensions over core [Akka.Cluster](./cluster-overview) module, that provide some additional ready functionalities like:

- Possibility to create cluster-wide singleton actors.
- Cluster-wide, topi-based publish/subscribe mechanism.
- Communication with cluster from actor systems not being part of it or being part of another cluster.

We'll cover each of these in separate sections.
