---
layout: docs.hbs
title: Creating your first Actor
---
# Creating your first Actor

>**Note**<br/>
Since Akka.NET enforces parental supervision every actor is supervised and (potentially) the supervisor of its children, it is advisable that you familiarize yourself with [Actor Systems](Actor Systems) and [Supervision and Monitoring](Supervision) and it may also help to read [Actor References, Paths and Addresses](Addressing).

## Defining an Actor class
Actors in C# are implemented by extending the `ReceiveActor` class and configuring what messages to receive using the `Receive<TMessage>` method.

Here is an example:

```csharp
using Akka;
using Akka.Actor;
using Akka.Event;

public class MyActor: ReceiveActor
{
  LoggingAdapter log = Logging.GetLogger(Context);

  public MyActor()
  {
    Receive<string>(message => {
      log.Info("Received String message: {0}", message);
      Sender.Tell(message);
    });
    Receive<SomeMessage(message => {...});
  }
}
```

## The Inbox
When writing code outside of actors which shall communicate with actors, the ask pattern can be a solution (see below), but there are two thing it cannot do: receiving multiple replies (e.g. by subscribing an `ActorRef` to a notification service) and watching other actors’ lifecycle. For these purposes there is the Inbox class:

```csharp
var target = system.ActorOf(Props.Empty);
var inbox = Inbox.Create(system);

inbox.Send(target, "hello");

try
{
    inbox.Receive(TimeSpan.FromSeconds(1)).Equals("world");
}
catch (TimeoutException)
{
    // timeout
}
```

The send method wraps a normal tell and supplies the internal actor’s reference as the sender. This allows the reply to be received on the last line. Watching an actor is quite simple as well:

```csharp
using System.Diagnostics;
...
var inbox = Inbox.Create(system);
inbox.Watch(target);
target.Tell(PoisonPill.Instance, ActorRefs.NoSender);

try
{
    Debug.Assert(inbox.Receive(TimeSpan.FromSeconds(1)) is Terminated);
}
catch (TimeoutException)
{
    // timeout
}
```

## F#

TODO