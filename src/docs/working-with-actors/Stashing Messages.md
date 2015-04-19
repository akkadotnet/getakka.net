---
layout: docs.hbs
title: Stashing Messages
---

## Stashing Messages

### What is the Stash?

The Stash is a feature you can enable in your actors so they can temporarily stash away messages they cannot or should not handle at the moment. Another way to see it is that stashing allows you to keep processing messages you can handle while saving for later messages you can't.

Stashes are handled by Akka.NET out of the actor instance just like the mailbox, so if the actor dies while processing a message, the stash is preserved. This feature is usually used together with [Become/Unbecome](Switchable Behaviors), as they fit together very well, but this is not a requirement.

### Stash Types

Akka.NET provides two interfaces for stashing:

* `IWithBoundedStash` - a stash with limited storage
* `IWithUnboundedStash` - a stash with unlimited storage

> **Note:**
> As of Akka.NET 1.0, the Bounded Stash is not fully implemented, and it will behave just like an Unbounded Stash.

### Using the Stash

In order to add a stash to an actor, implement one of the [stash interfaces](#stash-types) in your actor and add the required `Stash` property:

```cs
public class MyActor : ReceiveActor, IWithUnboundedStash
{
    public IStash Stash { get; set; }
}

```

Akka.NET recognizes the interface during actor creation and sets the correct stash in the property.

To use the stash, call the methods on the Stash property:

* `Stash()` - adds the current message to the stash
* `Unstash()` - unstashes the oldest message in the stash and prepends to the mailbox
* `UnstashAll()` - unstashes all messages from the mail box and prepends in the mailbox (it keeps the messages in the same order as received, unstashing older messages before newer)

It is illegal to stash the same message twice. Also, calling any of these methods do not interrupt the current message processing. Usually these methods are called as the last thing you do in your *receive logic*, so that the next step is usually processing the next message.

The example below shows how to implement an actor with a protocol behavior. The protocol works as follows:

1. The actor starts as **idle** and can receive only **open** messages
2. If it receives an **open** message, the actor becomes **open**
3. While the actor is **open**:
  - it can only receive messages to **write** or **close**
  - any other messages are stashed until the connection is closed
4. If a **close** message is received, the actor unstashes any other requests received while **open** and becomes **idle**

> **Note:** This example requires understanding of [BecomeStacked/UnbecomeStacked](Switchable Behaviors).

```cs
public class ActorWithProtocol : UntypedActor, IWithUnboundedStash
{
    public IStash Stash { get; set; }

    protected override void OnReceive(object message)
    {
        // idle
        if (message.Equals("open"))
        {
            // open
            BecomeStacked(m =>
            {
                if (m.Equals("write"))
                {
                    // do the writing
                }
                else if (m.Equals("close"))
                {
                    Stash.UnstashAll();
                    UnbecomeStacked();
                }
                else
                {
                    Stash.Stash();
                }
            });
        }
    }
}
```

#### Other use cases

While the above example is very simple, one can imagine the stashing concept being applied to many scenarios:

* An actor that connects to an external server could stash messages while that server is unavailable and unstash them once it comes back online;
* An actor could stash query requests while it fetches a dataset to produce responses;
* An actor could decide to reduce it's throughput during peak hours by stashing certain messages and unstashing them at specific intervals to process them in batches instead of real time;

### Advanced

There are some APIs on IStash that are considered **internal** but are exposed publicly for some advanced scenarios. These APIs use `Envelope` object which hold is the way Akka.NET holds messages internally.

* `void Prepend(IEnumerable<Envelope> envelopes)`

  Allows you to prepend messages to the stash (`Stash` method always appends them). This may be used if certain message types should be processed before others during unstash.

* `void UnstashAll(Func<Envelope, bool> predicate)`

  This version of UnstashAll allows you to unstash all messages that match a specific predicate. You may filter messages by sender or content.

  Unstash all messages that match a specific predicate.

* `IEnumerable<Envelope> ClearStash()`

  Clears the stash returning all messages that will be discarded.

> **Note:** The internal API may change without notice, but are part of Akka 1.0.
