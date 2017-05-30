---
layout: docs.hbs
title: Initialization patterns
---
# Initialization patterns

The rich lifecycle hooks of `Actors` provide a useful toolkit to implement various initialization patterns. During the lifetime of an `IActorRef`, an actor can potentially go through several restarts, where the old instance is replaced by a fresh one, invisibly to the outside observer who only sees the `IActorRef`.

One may think about the new instances as "incarnations". Initialization might be necessary for every incarnation of an actor, but sometimes one needs initialization to happen only at the birth of the first instance when the `IActorRef` is created. The following sections provide patterns for different initialization needs.

## Initialization via constructor
Using the constructor for initialization has various benefits. First of all, it makes it possible to use readonly fields to store any state that does not change during the life of the actor instance, making the implementation of the actor more robust. The constructor is invoked for every incarnation of the actor, therefore the internals of the actor can always assume that proper initialization happened. This is also the drawback of this approach, as there are cases when one would like to avoid reinitializing internals on restart. For example, it is often useful to preserve child actors across restarts. The following section provides a pattern for this case.

## Initialization via PreStart
The method `PreStart()` of an actor is only called once directly during the initialization of the first instance, that is, at creation of its ActorRef. In the case of restarts, `PreStart()` is called from `PostRestart()`, therefore if not overridden, `PreStart()` is called on every incarnation. However, overriding `PostRestart()` one can disable this behavior, and ensure that there is only one call to `PreStart()`.

One useful usage of this pattern is to disable creation of new `ActorRefs` for children during restarts. This can be achieved by overriding `PreRestart()`:

```csharp
protected override void PreStart()
{
    // Initialize children here
}

// Overriding postRestart to disable the call to preStart() after restarts
protected override void PostRestart(Exception reason)
{ 
}

// The default implementation of PreRestart() stops all the children
// of the actor. To opt-out from stopping the children, we
// have to override PreRestart()
protected override void PreRestart(Exception reason, object message)
{
    // Keep the call to PostStop(), but no stopping of children
    PostStop();
}
```
Please note, that the child actors are *still restarted*, but no new `IActorRef` is created. One can recursively apply the same principles for the children, ensuring that their `PreStart()` method is called only at the creation of their refs.

For more information see [What Restarting Means](../concepts/Supervision#what-restarting-means).

### Initialization via message passing

There are cases when it is impossible to pass all the information needed for actor initialization in the constructor, for example in the presence of circular dependencies. In this case the actor should listen for an initialization message, and use `Become()` or a finite state-machine state transition to encode the initialized and uninitialized states of the actor.
```csharp
public class Service : UntypedActor
{
    private string _initializeMe;

    protected override void OnReceive(object message)
    {
        if (message.Equals("init"))
        {
            _initializeMe = "Up and running";

            Become(m =>
            {
                if (m.Equals("U OK?"))
                {
                    Sender.Tell(_initializeMe, Self);
                }
            });
        }
    }
}
```
If the actor may receive messages before it has been initialized, a useful tool can be the `Stash` to save messages until the initialization finishes, and replaying them after the actor became initialized.

> **Warning** This pattern should be used with care, and applied only when none of the patterns above are applicable. One of the potential issues is that messages might be lost when sent to remote actors. Also, publishing an `IActorRef` in an uninitialized state might lead to the condition that it receives a user message before the initialization has been done.
