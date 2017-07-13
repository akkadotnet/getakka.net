---
layout: docs.hbs
title: Stopping Akka.NET Actors
---
# Stopping Akka.NET Actors

*Quoted from [How to Stop an Actor... the Right Way](https://petabridge.com/blog/how-to-stop-an-actor-akkadotnet/)*


## Ways to Stop An Actor
There are four ways to stop an actor:

1. [`Stop()` the actor](#the-default-stop-an-actor): stops the actor immediately after it finishes processing the current message.
2. [`Kill` the actor](#noisy-on-purpose-kill-the-actor): this throws an `ActorKilledException` which will be logged and handled. The actor will stop immediately after it finishes processing the current message.
3. [Send the actor a `PoisonPill`](#graceful-shutdown-sending-an-actor-a-poisonpill-): the actor will finish processing the messages currently in its mailbox, and then `Stop`.
4. [Gracefully stop the actor](#shutdown-with-confirmation-gracefulstop-): stop an actor and get confirmation that the shutdown has completed.

Let's review each option in detail.

## The Default: `Stop()` an Actor
This is the go-to method to stop an actor, and should be your default approach.

#### What Happens When I `Stop()` an Actor?
This is the sequence of events when you `Stop()` an actor:

1. Actor receives the `Stop` message and suspends the actor's `Mailbox`.
3. Actor tells all its children to `Stop`. `Stop` messages propagate down the hierarchy below the actor.
4. Actor waits for all children to stop.
5. Actor calls `PostStop` lifecycle hook method for resource cleanup.
3. Actor shuts down.

The point of this sequence is to make sure that an actor—and any hierarchy beneath it—have a clean shut down.

#### How Do I Use `Stop()`?
You `Stop()` an actor via the `ActorContext`, like this:

```csharp
// targetActorRef dies immediately after
// it's finished processing current message
Context.Stop(targetActorRef);
```

#### When Do I Use `Stop()` vs. My Other Options?
`Stop()` is your go-to method and should be your default approach.

*Use `Stop` unless you have a specific reason to use `PoisonPill` or `Kill`.*

## Graceful Shutdown: Sending an Actor a `PoisonPill`
`PoisonPill` shuts down the actor AFTER it finishes processing the messages in its mailbox.

#### What Happens When I Send an Actor a `PoisonPill`?
Like `Stop`, `PoisonPill` message is an auto-received, system-level message. But the actor handles a `PoisonPill` in a different manner than `Stop`. Rather than being handled immediately, the actor treats a `PoisonPill` like an ordinary message. The `PoisonPill` goes to the back of the actor's mailbox.

The actor then processes the messages that are ahead of the PoisonPill in the mailbox. [Once it reaches the PoisonPill, the actor tells itself to Stop](https://github.com/akkadotnet/akka.net/blob/dev/src/core/Akka/Actor/ActorCell.DefaultMessages.cs#L275) and the sequence above will begin.

#### How Do I Use `PoisonPill`?
You send an actor a `PoisonPill` like this:

```csharp
// targetActorRef dies once it processes
// all messages currently in mailbox
targetActorRef.Tell(PoisonPill.Instance);
```

#### When Do I Use `PoisonPill` vs. My Other Options?
You should use `PoisonPill` when you want the actor to process its mailbox before shutting down. There are many times this may come up, but they are use-case dependent.

## Noisy on Purpose: `Kill` the Actor
`Kill` will cause an actor to be `Stop`ped by its supervisor. In the process, the supervisor will log the `ActorKilledException`.

#### What Happens When I `Kill` an Actor?
1. [The actor throws](https://github.com/akkadotnet/akka.net/blob/dev/src/core/Akka/Actor/ActorCell.DefaultMessages.cs#L376) an [`ActorKilledException`](https://github.com/akkadotnet/akka.net/blob/dev/src/core/Akka/Actor/Exceptions.cs#L134). The actor's supervisor logs this message.
    - Note: This suspends the actor mailbox from processing further user messages.
2. The actor's supervisor [handles the `ActorKilledException` and issues a `Stop` directive.](https://github.com/akkadotnet/akka.net/blob/dev/src/core/Akka/Actor/SupervisorStrategy.cs#L85)
3. The actor will stop per the `Stop` sequence outlined above.

#### How Do I Use `Kill`?
You `Kill` an actor like this:

```csharp
// targetActorRef dies immediately once it's finished
// processing current message, by throwing an ActorKilledException
// which is logged and handled by supervisor of targetActorRef
targetActorRef.Tell(Kill.Instance);
```

#### When Do I Use `Kill` vs. My Other Options?
When you want it to show in your logs that the actor was killed. This is pretty uncommon, but it does come up.

## Shutdown With Confirmation: `GracefulStop`
There is a fourth way to shut down an actor: `GracefulStop`. This convenience method wraps the methods above.

Sometimes you want to stop an actor and have your caller get confirmation that the target `IActorRef` has been stopped. For this, you can use [the `GracefulStop` extension method](https://github.com/akkadotnet/akka.net/blob/dev/src/core/Akka/Actor/GracefulStopSupport.cs#L35).

#### What Happens When I Send an Actor a `GracefulStop`?
By default, the actor will be sent a `PoisionPill` and will return your caller a `Task<bool>` which will complete within the timeout you specify.

There is also an [overload you can use to swap in a different message for `PoisonPill`](https://github.com/akkadotnet/akka.net/blob/dev/src/core/Akka/Actor/GracefulStopSupport.cs#L42) (e.g. `Stop` instead of `PoisonPill`).

#### How Do I Use `GracefulStop`?
You `GracefulStop` an actor like this:

```csharp
// targetActorRef is sent a PoisonPill by default
// and returns a task whose result confirms shutdown within 5 seconds
var shutdown = targetActorRef.GracefulStop(TimeSpan.FromSeconds(5));
```

## Additional Resources
- [How to Stop an Actor... the Right Way](https://petabridge.com/blog/how-to-stop-an-actor-akkadotnet/)

### Related Documentation
- [Working With Actors - Stopping an Actor](../Working with actors#stopping-actors)
