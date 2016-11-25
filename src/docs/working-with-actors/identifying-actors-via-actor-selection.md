---
layout: docs.hbs
title: Identifying Actors via Actor Selection
---
# Identifying Actors via Actor Selection
As described in Actor References, Paths and Addresses, each actor has a unique logical path, which is obtained by following the chain of actors from child to parent until reaching the root of the actor system, and it has a physical path, which may differ if the supervision chain includes any remote supervisors. These paths are used by the system to look up actors, e.g. when a remote message is received and the recipient is searched, but they are also useful more directly: actors may look up other actors by specifying absolute or relative paths—logical or physical—and receive back an `ActorSelection` with the result:

```csharp
// will look up this absolute path
Context.ActorSelection("/user/serviceA/actor");

// will look up sibling beneath same supervisor
Context.ActorSelection("../joe");
```
> **Note**<br>
It is always preferable to communicate with other Actors using their `IActorRef` instead of relying upon `ActorSelection`. Exceptions are: sending messages using the At-Least-Once Delivery facility, initiating first contact with a remote system. In all other cases `ActorRefs` can be provided during Actor creation or initialization, passing them from parent to child or introducing Actors by sending their `ActorRefs` to other Actors within messages.

The supplied path is parsed as a `System.URI`, which basically means that it is split on `/` into path elements. If the path starts with /, it is absolute and the look-up starts at the root guardian (which is the parent of `"/user"`); otherwise it starts at the current actor. If a path element equals `..`, the look-up will take a step “up" towards the supervisor of the currently traversed actor, otherwise it will step “down" to the named child. It should be noted that the `..` in actor paths here always means the logical structure, i.e. the supervisor.

The path elements of an actor selection may contain wildcard patterns allowing for broadcasting of messages to that section:

```csharp
// will look all children to serviceB with names starting with worker
Context.ActorSelection("/user/serviceB/worker*");

// will look up all siblings beneath same supervisor
Context.ActorSelection("../*");
```
Messages can be sent via the `ActorSelection` and the path of the `ActorSelection`is looked up when delivering each message. If the selection does not match any actors the message will be dropped.

To acquire an `IActorRef` for an `ActorSelection` you need to send a message to the selection and use the `Sender` reference of the reply from the actor. There is a built-in `Identify` message that all Actors will understand and automatically reply to with a `ActorIdentity` message containing the `IActorRef`. This message is handled specially by the actors which are traversed in the sense that if a concrete name lookup fails (i.e. a non-wildcard path element does not correspond to a live actor) then a negative result is generated. Please note that this does not mean that delivery of that reply is guaranteed, it still is a normal message.

```csharp
public class Follower : ReceiveActor
{
    private readonly IActorRef _probe;
    private string identifyId = "1";
    private IActorRef _another;

    public Follower(IActorRef probe)
    {
        _probe = probe;

        var selection = Context.ActorSelection("/user/another");
        selection.Tell(new Identify(identifyId), Self);

        Receive<ActorIdentity>(identity =>
        {
            if (identity.MessageId.Equals(identifyId))
            {
                var subject = identity.Subject;

                if (subject == null)
                {
                    Context.Stop(Self);
                }
                else
                {
                    _another = subject;
                    Context.Watch(_another);
                    _probe.Tell(subject, Self);
                }
            }
        });

        Receive<Terminated>(t =>
        {
            if (t.ActorRef.Equals(_another))
            {
                Context.Stop(Self);
            }
        });
    }
}
```

You can also acquire an `IActorRef` for an `ActorSelection` with the `ResolveOne` method of the `ActorSelection`. It returns a Task of the matching `IActorRef` if such an actor exists. It is completed with failure `akka.actor.ActorNotFound` if no such actor exists or the identification didn't complete within the supplied timeout.

Remote actor addresses may also be looked up, if *remoting* is enabled:

```csharp
Context.ActorSelection("akka.tcp://app@otherhost:1234/user/serviceB");
```