---
layout: docs.hbs
title: Akka cluster singleton
---
# Cluster singleton actors

This feature has been created for cases, when for some reason you need to guarantee that exactly one instance of an actor will be present running in the cluster. In order to use them, you'll need to use `ClusterSingletonManager`, which is able to manage actor singleton instance across either all cluster nodes or those having a specific role.

Actor instance is always spawned on the oldest node, which is often one of seed nodes - reason behind this is that the oldest nodes are most likely not to be subject of cluster node churn caused by nodes joining/leaving under varying system usage pressure. In case when the oldest node will be removed from the cluster, `ClusterSingletonManager` will recreate an actor on another one from supplied `Props`. Be aware, that during during hand-over process no actor singleton may exist in the cluster.

Example:

```csharp
system.ActorOf(ClusterSingletonManager.Props(
    singletonProps: Props.Create<MySingletonActor>(),         // Props used to create actor singleton
    terminationMessage: PoisonPill.Instance,                  // message used to stop actor gracefully
    settings: ClusterSingletonManagerSettings.Create(system)),// cluster singleton manager settings
    name: "manager");                                         // singleton manager name
```

Actor singleton manager settings by default are located under `akka.cluster.singleton` HOCON section, and contain followings options:

- `singleton-name` - name of a singleton actor.
- `role` - cluster role specified in case, when you want to limit actor's singleton context to a nodes having particular role.
- `hand-over-retry-interval` - in case of graceful shutdown, new oldest node sends hand over request to a leaving node. This request is retried in specified interval until node confirms it or is removed from the cluster.

You can communicate with cluster singleton actors by using `ClusterSingletonProxy`. It will automatically keep track of the actor's current location, update it if necessary and buffer all messages during the handover process. In case of overflow, buffer will start dropping oldest messages. It's size can be configured using `akka.cluster.singleton-proxy.buffer-size` key, and disabled by setting that value on 0. Other configuration options:

- `singleton-name` - name of cluster singleton actor specified in `akka.cluster.singleton.singleton-name`.
- `role` - serves similar purpose to `akka.cluster.singleton.role`.
- `singleton-identification-interval` - interval at which proxy will try to resolve actor singleton ref.

Example:

```csharp
system.ActorOf(ClusterSingletonProxy.Props(
    singletonManagerPath: "/user/manager",                  // corresponding singleton manager name
    settings: ClusterSingletonProxySettings.Create(system)),// singleton proxy settings
    name: "managerProxy");                                  // name of proxy actor
```

There are few remarks to take into account:

- Singleton actors can become performance bottlenecks of your application.
- There may be a period of singleton inactivity during an actor handover process between nodes.
- In case of **Split Brain** scenarios, there is a potential risk, that partitioned cluster will spawn more than one actor instance due to network partition.
