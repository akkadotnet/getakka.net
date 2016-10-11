---
layout: docs.hbs
title: Akka cluster client
---
# Akka cluster client

Cluster client is a feature, which allows actors from actor system not being part of the target cluster to communicate with actors inside that cluster. To do so, it needs to know an initial contact point, known as `ClusterReceptionist`. Client will monitor the connection and reestablish it if necessary - it will work even when original contact went down, as at this point it doesn't need to use it.

> Remember that Cluster client relies on Akka.Remote and Distributed Publish/Subscribe and all of their limitations also applies here. Also don't use cluster client to communicate between actors inside the same cluster, as it's not a suitable tool for this job, see. [Distributed Publish/Subscribe](clustering/distributed-publish-subscribe).

Receptionist is supposed to be started on all cluster nodes (or those with specific role) using `ClusterClientReceptionist` before cluster client connection attempt. In order to make an actor visible outside the cluster it should be registered inside receptionist first. From the client perspective it can be accessed using `ClusterClient.Send`, `ClusterClient.SendToAll` and `ClusterClient.Publish` messages, which work accordingly to their Distributed Publish/Subscribe counterparts.

Example:

```csharp
// inside the Cluster
var receptionist = ClusterClientReceptionist.Get(system);
receptionist.RegisterService(actorRef);

// outside the cluster
system.Settings.InjectTopLevelFallback(ClusterClientReceptionist.DefaultConfig());
var settings = ClusterClientSettings.Create(system);
var client = system.ActorOf(ClusterClient.Props(settings));

client.Tell(new ClusterClient.Send("/user/service-path", new MyMessage()));
```

Cluster side can be configured by specifying following set of HOCON keys (using `akka.cluster.client.receptionist` as default root):

- `name` - name of the receptionist actor.
- `role` - used in case, when actor receptionist should be limited to specific cluster role.
- `number-of-contacts` - after connecting to the receptionist, client will receive list of additional contacts (usefull in dynamic cluster scenarios). Maximal number of those will be limited to value set by this key (3 by default).
- `response-tunnel-receive-timeout` - actor that tunnels replies to client in case of inactivity will be turned down after this time.

Client side can be configured with set of HOCON keys (using `akka.cluster.client` as default root):

- `initial-contacts` - list of absolute actor paths used to connect to receptionist actors.
- `establishing-get-contacts-interval` - interval, at which client will try to reestablish connection with one of the cluster receptionists.
- `refresh-contacts-interval` - list of new cluster contacts will be refreshed using this interval.
- `heartbeat-interval` - how often failure detection heartbeats should be sent.
- `acceptable-heartbeat-pause` - this value combined with `heartbeat-interval` will specify total interval from heartbeat message emit to receive before marking connection failure.
- `buffer-size` - maximal size of the buffer used to by client to preserve messages sent between connection reestablishing pauses. Set 0 to turn it off.
