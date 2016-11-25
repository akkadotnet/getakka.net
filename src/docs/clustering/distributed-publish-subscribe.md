---
layout: docs.hbs
title: Akka cluster distributed Pub/Sub
---
# Distributed publish/subscribe

While default event bus have some great use cases, it's limiting when it comes to communication outside of actor system's scope. One of the features [Akka.Cluster.Tools](clustering/cluster-tools) offers, is the ability to send message to all of the subscribers without knowing their nodes location.

> At the present moment (<= v1.0.6) this feature doesn't play well with default Akka.NET serializer. Please use alternative serializers like Akka.Serialization.Wire for the time being.

Cluster wide pub/sub can be accessed by it's local representations, so called mediator actors. Whole pattern is based on concept of named topics. In order to subscribe/unsubscribe the topic, send `Subscribe`/`Unsubscribe` messages to a mediator. Those requests are confirmed by sending back `SubscribeAck`/`UnsubscribeAck` replies to subscribed actors. You can publish messages by sending `Publish(topicName, message)` to local mediator.

```csharp
// define subscribing actor
class Subscriber : ReceiveActor
{
    public Subscriber()
    {
        var mediator = DistributedPubSub.Get(Context.System).Mediator;
        mediator.Tell(new Subscribe("topic-name", Self));

        Receive<SubscribeAck>(_ => Become(Subscribed));
    }

    ...
}

// publish message to all actors subscribed to a topic
var mediator = DistributedPubSub.Get(Context.System).Mediator;
mediator.Tell(new Publish("topic-name", new MyMessage()));
```

Except usual `Subscribe`/`Unsubscribe`, you may decide to register/unregister your actors by sending `Put`/`Remove` messages to local pub/sub mediator. Remember that only local actors can be registered this way. How does `Put` differ from `Subscribe`? Instead of registering actor under named topic, it uses current actor's path - it's particularly useful in case, where you have same actors on different nodes performing the same action.

In addition to `Publish` there are few other message types, each one having different characteristic:

- `Send` specifies a message that should be delivered only to one subscriber in target topic. Actor choice is based on specified [RoutingLogic](working-with-actors/Routers#routing-strategies), which is random by default. Additionally with `localAffinity` flag set we may define to prefer sending the messages to subscribers on the same node if possible i.e. for performance reasons.
- `SendToAll` works well, when combined with `Put`-registered actors. It sends the message to all registered actors on all nodes having provided local path. Optional `excludeSelf` flag may be set to exclude actor recipient from actor system used to send this message.

You can get list of all topics registered in local mediator by sending a `GetTopics` request to it. The `CurrentTopics` reply will contain a list of all topics names registered in current actor system.

## Groups

Additionally to topics, pub/sub model can be enhanced by specifying optional group. Group names can be shared by multiple actors on different nodes. Communication using topics with groups is quite similar to routing. Once `Publish` message is send with `sendOneMessageToEachGroup` set, the message will be send to a single actor in each group inside specified topic, using similar routing rules, which applies to `Send` message.
