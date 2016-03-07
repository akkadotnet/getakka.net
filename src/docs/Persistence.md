---
layout: docs.hbs
title: Persistence
---
## Persistence

Akka.Persistence plugin enables stateful actors to persist their internal state so that it can be recovered when an actor is started, restarted after a CLR crash or by a supervisor, or migrated in a cluster. The key concept behind Akka persistence is that only changes to an actor's internal state are persisted but never its current state directly (except for optional snapshots). These changes are only ever appended to storage, nothing is ever mutated, which allows for very high transaction rates and efficient replication. Stateful actors are recovered by replaying stored changes to these actors from which they can rebuild internal state. This can be either the full history of changes or starting from a snapshot which can dramatically reduce recovery times. Akka persistence also provides point-to-point communication with at-least-once message delivery semantics.


### Architecture

Akka.Persistence features are available through new set of actor base classes:

- `ReceivePersistentActor` is a persistent, stateful actor. It is able to persist events to a journal and can react to them in a thread-safe manner. It can be used to implement both command as well as event sourced actors. When a persistent actor is started or restarted, journaled messages are replayed to that actor so that it can recover internal state from these messages.
- `UntypedPersistentActor` - untyped version of ReceivePersistentActor.
- `PersistentView` is a persistent, stateful actor that receives journaled messages that have been written by another persistent actor. A view itself does not journal new messages, instead, it updates internal state only from a persistent actor's replicated message stream. Note: PersistentView is deprecated.
- `AtLeastOnceDeliveryReceiveActor` is an actor which sends messages with at-least-once delivery semantics to destinations, also in case of sender and receiver CLR crashes.
- `AtLeastOnceDeliveryActor` - untyped version of AtLeastOnceDeliveryReceiveActor.
- `AsyncWriteJournal` stores the sequence of messages sent to a persistent actor. An application can control which messages are journaled and which are received by the persistent actor without being journaled. Journal maintains highestSequenceNr that is increased on each message. The storage backend of a journal is pluggable. By default it uses an in-memory message stream and is NOT a persistent storage.
- `SnapshotStore` is used to persist snapshots of either persistent actor's or view's internal state. They can be used to reduce recovery times in case when a lot of events needs to be replayed for specific persistent actor. Storage backend of the snapshot store is pluggable. By default it uses local file system.

### Persistent actors

Unlike the default `ActorBase` class, `PersistentActor` and its derivatives requires the setup of a few more additional members:

- `PersistenceId` is a persistent actor's identifier that doesn't change across different actor incarnations. It's used to retrieve an event stream required by the persistent actor to recover its internal state.
- `ReceiveRecover` is a method invoked during an actor's recovery cycle. Incoming objects may be user-defined events as well as system messages, for example `SnapshotOffer` which is used to deliver latest actor state saved in the snapshot store.
- `ReceiveCommand` is an equivalent of the basic `Receive` method of default Akka.NET actors.

Persistent actors also offer a set of specialized members:

- `Persist` and `PersistAsync` methods can be used to send events to the event journal in order to store them inside. The second argument is a callback invoked when the journal confirms that events have been stored successfully.
- `Defer` and `DeferAsync` are used to perform various operations *after* events will be persisted and their callback handlers will be invoked. Unlike the persist methods, defer won't store an event in persistent storage. Defer methods may NOT be invoked in case when the actor is restarted even though the journal will successfully persist events sent.
- `DeleteMessages` will order attached journal to remove part of its events. It can be either logical deletion - messages are marked as deleted, but are not removed physically from the backend storage - or a physical one, when the messages are removed physically from the journal.
- `LoadSnapshot` will send a request to the snapshot store to resend the current actor's snapshot.
- `SaveSnapshot` will send the current actor's internal state as a snapshot to be saved by the configured snapshot store.
- `DeleteSnapshot` and `DeleteSnapshots` methods may be used to specify snapshots to be removed from the snapshot store in cases where they are no longer needed.
- `OnReplaySuccess` is a virtual method which will be called when the recovery cycle ends successfully.
- `OnReplayFailure` is a virtual method which will be called when the recovery cycle fails unexpectedly from some reason.
- `IsRecovering` property determines if the current actor is performing a recovery cycle at the moment.
- `SnapshotSequenceNr` property may be used to determine the sequence number used for marking persisted events. This value changes in a monotonically increasing manner.

In case a manual recovery cycle initialization is necessary, it may be invoked by sending a `Recover` message to a persistent actor.

A persistent actor receives a (non-persistent) command which is first validated if it can be applied to the current state. Here validation can mean anything from simple inspection of a command message's fields up to a conversation with several external services, for example. If validation succeeds, events are generated from the command, representing the effect of the command. These events are then persisted and, after successful persistence, used to change the actor's state. When the persistent actor needs to be recovered, only the persisted events are replayed of which we know that they can be successfully applied. In other words, events cannot fail when being replayed to a persistent actor, in contrast to commands. Event sourced actors may of course also process commands that do not change application state such as query commands for example.

Akka persistence supports event sourcing with the `ReceivePersistentActor` abstract class. An actor that extends this class uses the persist method to persist and handle events. The behavior of an `ReceivePersistentActor` is defined by implementing `Recover` and `Receive` methods. This is demonstrated in the following example.

```C#
public class Cmd
{
    public Cmd(string data)
    {
        Data = data;
    }

    public string Data { get; }
}

public class Evt
{
    public Evt(string data)
    {
        Data = data;
    }

    public string Data { get; }
}

public class ExampleState
{
    private readonly List<string> _events;

    public ExampleState(List<string> events)
    {
        _events = events;
    }

    public ExampleState() : this(new List<string>())
    {
    }

    public void Update(Evt evt)
    {
        _events.Add(evt.Data);
    }

    public ExampleState Copy()
    {
        return new ExampleState(_events);
    }

    public int Size => _events.Count;
}


public class ExamplePersistentActor : ReceivePersistentActor
{
    private ExampleState _state = new ExampleState();

    public ExamplePersistentActor()
    {
        Recover<Evt>(evt =>
        {
            _state.Update(evt);
        });

        Recover<SnapshotOffer>(snapshot =>
        {
            _state = (ExampleState)snapshot.Snapshot;
        });

        Command<Cmd>(message =>
        {
            string data = message.Data;
            Evt evt1 = new Evt($"{data}-{_state.Size}");
            Evt evt2 = new Evt($"{data}-{_state.Size + 1}");

            var events = new List<Evt> { evt1, evt2 };

            PersistAll(events, evt =>
            {
                _state.Update(evt);
                if (evt == evt2)
                {
                    Context.System.EventStream.Publish(evt);
                }
            });
        });

        Command<string>(msg => msg == "snap", message =>
        {
            SaveSnapshot(_state.Copy());
        });

        Command<string>(msg => msg == "print", message =>
        {
            Console.WriteLine(_state);
        });
    }

    public override string PersistenceId { get; } = "sample-id-1";
}
```
The example defines two data types, Cmd and Evt to represent commands and events, respectively. The state of the `ExamplePersistentActor` is a list of persisted event data contained in `ExampleState`.

The persistent actor's `OnReceiveRecover` method defines how state is updated during recovery by handling `Evt` and `SnapshotOffer` messages. The persistent actor's `OnReceiveCommand` method is a command handler. In this example, a command is handled by generating two events which are then persisted and handled. Events are persisted by calling `Persist` with an event (or a sequence of events) as first argument and an event handler as second argument.

The persist method persists events asynchronously and the event handler is executed for successfully persisted events. Successfully persisted events are internally sent back to the persistent actor as individual messages that trigger event handler executions. An event handler may close over persistent actor state and mutate it. The sender of a persisted event is the sender of the corresponding command. This allows event handlers to reply to the sender of a command (not shown).

The main responsibility of an event handler is changing persistent actor state using event data and notifying others about successful state changes by publishing events.

When persisting events with persist it is guaranteed that the persistent actor will not receive further commands between the persist call and the execution(s) of the associated event handler. This also holds for multiple persist calls in context of a single command. Incoming messages are stashed until the persist is completed.

If persistence of an event fails, `OnPersistFailure` will be invoked (logging the error by default), and the actor will unconditionally be stopped. If persistence of an event is rejected before it is stored, e.g. due to serialization error, `OnPersistRejected` will be invoked (logging a warning by default), and the actor continues with the next message.

> **NOTE:** It's also possible to switch between different command handlers during normal processing and recovery with `Context.Become` and `Context.Unbecome`. To get the actor into the same state after recovery you need to take special care to perform the same state transitions with become and unbecome in the `ReceiveRecover` method as you would have done in the command handler. Note that when using become from `ReceiveRecover` it will still only use the `ReceiveRecover` behavior when replaying the events. When replay is completed it will use the new behavior.

#### Identifiers
A persistent actor must have an identifier that doesn't change across different actor incarnations. The identifier must be defined with the `PersistenceId` method.

```C#
public override string PersistenceId { get; } = "my-stable-persistence-id";
```

#### Recovery
By default, a persistent actor is automatically recovered on start and on restart by replaying journaled messages. New messages sent to a persistent actor during recovery do not interfere with replayed messages. They are cached and received by a persistent actor after recovery phase completes.

> **NOTE:** Accessing the `Sender` for replayed messages will always result in a deadLetters reference, as the original sender is presumed to be long gone. If you indeed have to notify an actor during recovery in the future, store its `ActorPath` explicitly in your persisted events.

##### Recovery customization
Applications may also customise how recovery is performed by returning a customised `Recovery` object in the recovery method of a `ReceivePersistentActor`, for example setting an upper bound to the replay which allows the actor to be replayed to a certain point "in the past" instead to its most up to date state:

```C#
public override Recovery Recovery
{
    get { return new Recovery(new SnapshotSelectionCriteria(457)); }
}
```

Recovery can be disabled by returning `SnapshotSelectionCriteria.None` in the recovery property of a PersistentActor:

```C#
public override Recovery Recovery
{
    get { return new Recovery(SnapshotSelectionCriteria.None); }
}
```

##### Recovery status
A persistent actor can query its own recovery status via the methods

```C#
public bool IsRecovering { get; }
public bool IsRecoveryFinished { get; }
```

Sometimes there is a need for performing additional initialization when the recovery has completed before processing any other message sent to the persistent actor. The persistent actor will receive a special `RecoveryCompleted` message right after recovery and before any other received messages.

```C#
Recover<RecoveryCompleted>(message =>
{
    // perform init after recovery, before any other messages
});

Command<string>(message =>
{
    
});
```

If there is a problem with recovering the state of the actor from the journal, `OnRecoveryFailure` is called (logging the error by default) and the actor will be stopped.

#### Internal stash
The persistent actor has a private stash for internally caching incoming messages during `Recovery` or the `Persist` \ `PersistAll` method persisting events. However You can use inherited stash or create one or more stashes if needed. The internal stash doesn't interfere with these stashes apart from user inherited `UnstashAll` method, which prepends all messages in the inherited stash to the internal stash instead of mailbox. Hence, If the message in the inherited stash need to be handled after the messages in the internal stash, you should call inherited unstash method.

You should be careful to not send more messages to a persistent actor than it can keep up with, otherwise the number of stashed messages will grow. It can be wise to protect against `OutOfMemoryException` by defining a maximum stash capacity in the mailbox configuration:

```hocon
akka.actor.default-mailbox.stash-capacity = 10000
```

Note that the stash capacity is per actor. If you have many persistent actors, e.g. when using cluster sharding, you may need to define a small stash capacity to ensure that the total number of stashed messages in the system don't consume too much memory. Additionally, The persistent actor defines three strategies to handle failure when the internal stash capacity is exceeded. The default overflow strategy is the `ThrowOverflowExceptionStrategy`, which discards the current received message and throws a `StashOverflowException`, causing actor restart if default supervision strategy is used. you can override the `InternalStashOverflowStrategy` property to return `DiscardToDeadLetterStrategy` or `ReplyToStrategy` for any "individual" persistent actor, or define the "default" for all persistent actors by providing FQCN, which must be a subclass of `StashOverflowStrategyConfigurator`, in the persistence configuration:

```hocon
akka.persistence.internal-stash-overflow-strategy = "akka.persistence.ThrowExceptionConfigurator"
```

The `DiscardToDeadLetterStrategy` strategy also has a pre-packaged companion configurator `DiscardConfigurator`.

You can also query default strategy via the Akka persistence extension singleton:
```C#
Context.System.DefaultInternalStashOverflowStrategy
```

> **NOTE:** Note
The bounded mailbox should be avoid in the persistent actor, because it may be discarding the messages come from Storage backends. You can use bounded stash instead of bounded mailbox.

#### Relaxed local consistency requirements and high throughput use-cases

If faced with relaxed local consistency requirements and high throughput demands sometimes `PersistentActor` and its persist may not be enough in terms of consuming incoming Commands at a high rate, because it has to wait until all Events related to a given Command are processed in order to start processing the next Command. While this abstraction is very useful for most cases, sometimes you may be faced with relaxed requirements about consistency – for example you may want to process commands as fast as you can, assuming that the Event will eventually be persisted and handled properly in the background, retroactively reacting to persistence failures if needed.

The `PersistAsync` method provides a tool for implementing high-throughput persistent actors. It will not stash incoming Commands while the Journal is still working on persisting and/or user code is executing event callbacks.

In the below example, the event callbacks may be called "at any time", even after the next Command has been processed. The ordering between events is still guaranteed ("evt-b-1" will be sent after "evt-a-2", which will be sent after "evt-a-1" etc.).

```C#
public class DocumentNestedPersistentActor : ReceivePersistentActor
{
    public override string PersistenceId => "HardCoded";

    public DocumentNestedPersistentActor()
    {
        Action<string> replyToSender = message =>
        {
            Sender.Tell(message, Self);
        };

        Recover<string>(message =>
        {
            // handle recovery here
        });

        Command<string>(message =>
        {
            Sender.Tell(message, Self);

            PersistAsync($"evt-{message}-1", replyToSender);
            PersistAsync($"evt-{message}-2", replyToSender);
        });
    }
}
```

> **NOTE:** In order to implement the pattern known as "command sourcing" simply `PersistAsync` all incoming messages right away and handle them in the callback.

> **WARNING:** The callback will not be invoked if the actor is restarted (or stopped) in between the call to `PersistAsync` and the journal has confirmed the write.

#### Deferring actions until preceding persist handlers have executed
Sometimes when working with `PersistAsync` you may find that it would be nice to define some actions in terms of happens-after the previous `PersistAsync` handlers have been invoked. `PersistentActor` provides an utility method called `DeferAsync`, which works similarly to `PersistAsync` yet does not persist the passed in event. It is recommended to use it for read operations, and actions which do not have corresponding events in your domain model.

Using this method is very similar to the persist family of methods, yet it does not persist the passed in event. It will be kept in memory and used when invoking the handler.

```C#
public class DocumentNestedPersistentActor : ReceivePersistentActor
{
    public override string PersistenceId => "HardCoded";

    public DocumentNestedPersistentActor()
    {
        Action<string> replyToSender = message =>
        {
            Sender.Tell(message, Self);
        };

        Recover<string>(message =>
        {
            // handle recovery here
        });

        Command<string>(message =>
        {
            PersistAsync($"evt-{message}-1", replyToSender);
            PersistAsync($"evt-{message}-2", replyToSender);
            DeferAsync($"evt-{message}-3", replyToSender);
        });
    }
}
```

Notice that the `Sender` is safe to access in the handler callback, and will be pointing to the original sender of the command for which this `DeferAsync` handler was called.

```C#
persistentActor.tell("a");
persistentActor.tell("b");
 
// order of received messages:
// a
// b
// evt-a-1
// evt-a-2
// evt-a-3
// evt-b-1
// evt-b-2
// evt-b-3
```

> **WARNING:** The callback will not be invoked if the actor is restarted (or stopped) in between the call to `DeferAsync` and the journal has processed and confirmed all preceding writes..

#### Nested persist calls

It is possible to call `Persist` and `PersistAsync` inside their respective callback blocks and they will properly retain both the thread safety (including the right value of `Sender`) as well as stashing guarantees.

In general it is encouraged to create command handlers which do not need to resort to nested event persisting, however there are situations where it may be useful. It is important to understand the ordering of callback execution in those situations, as well as their implication on the stashing behaviour (that persist enforces). In the following example two persist calls are issued, and each of them issues another persist inside its callback:
```C#
public class DocumentNestedPersistentActor : ReceivePersistentActor
{
    public override string PersistenceId => "HardCoded";

    public DocumentNestedPersistentActor()
    {
        Action<string> replyToSender = (message) =>
        {
            Sender.Tell(message, Self);
        };

        Command<string>(message =>
        {
            Persist($"{message}-outer-1", innerMessage =>
            {
                Sender.Tell(innerMessage, Self);
                Persist($"{innerMessage}-inner-1", replyToSender);
            });

            Persist($"{message}-outer-2", innerMessage =>
            {
                Sender.Tell(innerMessage, Self);
                Persist($"{innerMessage}-inner-2", replyToSender);
            });
        });
    }
}
```
When sending two commands to this `PersistentActor`, the persist handlers will be executed in the following order:
```C#
persistentActor.tell("a");
persistentActor.tell("b");
 
// order of received messages:
// a
// a-outer-1
// a-outer-2
// a-inner-1
// a-inner-2
// and only then process "b"
// b
// b-outer-1
// b-outer-2
// b-inner-1
// b-inner-2
```
First the "outer layer" of persist calls is issued and their callbacks are applied. After these have successfully completed, the inner callbacks will be invoked (once the events they are persisting have been confirmed to be persisted by the journal). Only after all these handlers have been successfully invoked will the next command be delivered to the persistent Actor. In other words, the stashing of incoming commands that is guaranteed by initially calling `Persist` on the outer layer is extended until all nested persist callbacks have been handled.

It is also possible to nest `PersistAsync` calls, using the same pattern:
```C#
public class DocumentNestedPersistentActor : ReceivePersistentActor
{
    public override string PersistenceId => "HardCoded";

    public DocumentNestedPersistentActor()
    {
        Action<string> replyToSender = (message) =>
        {
            Sender.Tell(message, Self);
        };

        Command<string>(message =>
        {
            PersistAsync($"{message}-outer-1", innerMessage =>
            {
                Sender.Tell(innerMessage, Self);
                PersistAsync($"{innerMessage}-inner-1", replyToSender);
            });

            PersistAsync($"{message}-outer-2", innerMessage =>
            {
                Sender.Tell(innerMessage, Self);
                PersistAsync($"{innerMessage}-inner-2", replyToSender);
            });
        });
    }
}
```
In this case no stashing is happening, yet events are still persisted and callbacks are executed in the expected order:
```C#
persistentActor.tell("a");
persistentActor.tell("b");
 
// order of received messages:
// a
// b
// a-outer-1
// a-outer-2
// b-outer-1
// b-outer-2
// a-inner-1
// a-inner-2
// b-inner-1
// b-inner-2
 
// which can be seen as the following causal relationship:
// a -> a-outer-1 -> a-outer-2 -> a-inner-1 -> a-inner-2
// b -> b-outer-1 -> b-outer-2 -> b-inner-1 -> b-inner-2
```
While it is possible to nest mixed persist and `PersistAsync` with keeping their respective semantics it is not a recommended practice, as it may lead to overly complex nesting.

#### Failures
If persistence of an event fails, `OnPersistFailure` will be invoked (logging the error by default), and the actor will unconditionally be stopped.

The reason that it cannot resume when persist fails is that it is unknown if the event was actually persisted or not, and therefore it is in an inconsistent state. Restarting on persistent failures will most likely fail anyway since the journal is probably unavailable. It is better to stop the actor and after a back-off timeout start it again. The `BackoffSupervisor` actor is provided to support such restarts.
```C#
protected override void PreStart()
{
    var childProps = Props.Create<DocumentPersistentActor>();
    var actor = new BackoffSupervisor(
        childProps,
        "myActor",
        TimeSpan.FromSeconds(3),
        TimeSpan.FromSeconds(30),
        0.2);
    base.PreStart();
}
```

If persistence of an event is rejected before it is stored, e.g. due to serialization error, `OnPersistRejected` will be invoked (logging a warning by default), and the actor continues with next message.

If there is a problem with recovering the state of the actor from the journal when the actor is started, `OnRecoveryFailure` is called (logging the error by default), and the actor will be stopped.

#### Atomic writes
Each event is of course stored atomically, but it is also possible to store several events atomically by using the `PersistAll` or `PersistAllAsync` method. That means that all events passed to that method are stored or none of them are stored if there is an error.

The recovery of a persistent actor will therefore never be done partially with only a subset of events persisted by `PersistAll`.

Some journals may not support atomic writes of several events and they will then reject the `PersistAll` command, i.e. `OnPersistRejected` is called with an exception (typically `NotSupportedException`).

#### Batch writes
In order to optimize throughput when using `PersistAsync`, a persistent actor internally batches events to be stored under high load before writing them to the journal (as a single batch). The batch size is dynamically determined by how many events are emitted during the time of a journal round-trip: after sending a batch to the journal no further batch can be sent before confirmation has been received that the previous batch has been written. Batch writes are never timer-based which keeps latencies at a minimum.

#### Message deletion

It is possible to delete all messages (journaled by a single persistent actor) up to a specified sequence number; Persistent actors may call the `DeleteMessages` method to this end.

Deleting messages in event sourcing based applications is typically either not used at all, or used in conjunction with snapshotting, i.e. after a snapshot has been successfully stored, a `DeleteMessages` (`ToSequenceNr`) up until the sequence number of the data held by that snapshot can be issued to safely delete the previous events while still having access to the accumulated state during replays - by loading the snapshot.

The result of the `DeleteMessages` request is signaled to the persistent actor with a `DeleteMessagesSuccess` message if the delete was successful or a `DeleteMessagesFailure` message if it failed.

Message deletion doesn't affect the highest sequence number of the journal, even if all messages were deleted from it after `DeleteMessages` invocation.

#### Persistence status handling


| Method   	             | Success      	        |  Failure / Rejection 	| After failure handler invoked
|------                  |------                    |------	                |------	  
| Persist / PersistAsync | persist handler invoked	| OnPersistFailure  	| Actor is stopped.
|                        |                          | OnPersistRejected     | No automatic actions.
| Recovery 	             | RecoverySuccess   	    | OnRecoveryFailure 	| Actor is stopped.
| DeleteMessages 	     | DeleteMessagesSuccess 	| DeleteMessagesFailure | No automatic actions.

The most important operations (Persist and Recovery) have failure handlers modelled as explicit callbacks which the user can override in the `PersistentActor`. The default implementations of these handlers emit a log message (error for persist/recovery failures, and warning for others), logging the failure cause and information about which message caused the failure.

For critical failures such as recovery or persisting events failing the persistent actor will be stopped after the failure handler is invoked. This is because if the underlying journal implementation is signalling persistence failures it is most likely either failing completely or overloaded and restarting right-away and trying to persist the event again will most likely not help the journal recover – as it would likely cause a Thundering herd problem, as many persistent actors would restart and try to persist their events again. Instead, using a `BackoffSupervisor` (as described in Failures) which implements an exponential-backoff strategy which allows for more breathing room for the journal to recover between restarts of the persistent actor.

> **NOTE:** Journal implementations may choose to implement a retry mechanism, e.g. such that only after a write fails N number of times a persistence failure is signalled back to the user. In other words, once a journal returns a failure, it is considered fatal by Akka Persistence, and the persistent actor which caused the failure will be stopped. Check the documentation of the journal implementation you are using for details if/how it is using this technique.

#### Safely shutting down persistent actors

Special care should be given when shutting down persistent actors from the outside. With normal Actors it is often acceptable to use the special `PoisonPill` message to signal to an Actor that it should stop itself once it receives this message – in fact this message is handled automatically by Akka, leaving the target actor no way to refuse stopping itself when given a poison pill.

This can be dangerous when used with PersistentActor due to the fact that incoming commands are stashed while the persistent actor is awaiting confirmation from the Journal that events have been written when `Persist` was used. Since the incoming commands will be drained from the Actor's mailbox and put into its internal stash while awaiting the confirmation (thus, before calling the persist handlers) the Actor may receive and (auto)handle the `PoisonPill` before it processes the other messages which have been put into its stash, causing a pre-mature shutdown of the Actor.

> **WARNING:** Consider using explicit shut-down messages instead of `PoisonPill` when working with persistent actors.

The example below highlights how messages arrive in the Actor's mailbox and how they interact with its internal stashing mechanism when `Persist()` is used. Notice the early stop behaviour that occurs when `PoisonPill` is used:

```C#
public class Shutdown
{
}

public class ShutdownPersistentActor : ReceivePersistentActor
{
    public ShutdownPersistentActor()
    {
        Recover<string>(rec =>
        {
            // handle recovery...
        });

        Command<string>(msg =>
        {
            Persist(msg, param =>
            {
                Console.WriteLine(param);
            });
        });

        Command<Shutdown>(msg =>
        {
            Context.Stop(Self);
        });
    }

    public override string PersistenceId
    {
        get
        {
            return "some-persistence-id";
        }
    }
}
```

```C#
// UN-SAFE, due to PersistentActor's command stashing:
persistentActor.Tell("a");
persistentActor.Tell("b");
persistentActor.Tell(PoisonPill.Instance);
// order of received messages:
// a
//   # b arrives at mailbox, stashing;        internal-stash = [b]
//   # PoisonPill arrives at mailbox, stashing; internal-stash = [b, Shutdown]
// PoisonPill is an AutoReceivedMessage, is handled automatically
// !! stop !!
// Actor is stopped without handling `b` nor the `a` handler!
```

```C#
// SAFE:
persistentActor.Tell("a");
persistentActor.Tell("b");
persistentActor.Tell(new Shutdown());
// order of received messages:
// a
//   # b arrives at mailbox, stashing;        internal-stash = [b]
//   # Shutdown arrives at mailbox, stashing; internal-stash = [b, Shutdown]
// handle-a
//   # unstashing;                            internal-stash = [Shutdown]
// b
// handle-b
//   # unstashing;                            internal-stash = []
// Shutdown
// -- stop --
```

### Persistent views

> **WARNING:** `PersistentView` is deprecated. Use `PersistenceQuery` when it will be ported.

While a persistent actor may be used to produce and persist events, views are used only to read internal state based on them. Like the persistent actor, a view has a `PersistenceId` to specify a  collection of events to be resent to current view. This value should however be correlated with the  `PersistentId` of an actor who is the producer of the events.

Other members:

- `ViewId` property is a view unique identifier that doesn't change across different actor incarnations. It's useful in cases where there are multiple different views associated with a single persistent actor, but showing its state from a different perspectives.
- `IsAutoUpdate` property determines if the view will try to automatically update its state in specified time intervals. Without it, the view won't update its state until it receives an explicit `Update` message. This value can be set through configuration with *akka.persistence.view.auto-update* set to either *on* (by default) or *off*.
- `AutoUpdateInterval` specifies a time interval in which the view will be updating itself - only in cases where the *IsAutoUpdate* flag is on. This value can be set through configuration with *akka.persistence.view.auto-update-interval* key (5 seconds by default).
- `AutoUpdateReplayMax` property determines the maximum number of events to be replayed during a single *Update* cycle. This value can be set through configuration with *akka.persistence.view.auto-update-replay-max* key (by default it's -1 - no limit).
- `LoadSnapshot` will send a request to the snapshot store to resend a current view's snapshot.
- `SaveSnapshot` will send the current view's internal state as a snapshot to be saved by the  configured snapshot store.
- `DeleteSnapshot` and `DeleteSnapshots` methods may be used to specify snapshots to be removed from the snapshot store in cases where they are no longer needed.

The `PersistenceId` identifies the persistent actor from which the view receives journaled messages. It is not necessary that the referenced persistent actor is actually running. Views read messages from a persistent actor's journal directly. When a persistent actor is started later and begins to write new messages, by default the corresponding view is updated automatically.

It is possible to determine if a message was sent from the Journal or from another actor in user-land by calling the `IsPersistent` property. Having that said, very often you don't need this information at all and can simply apply the same logic to both cases (skip the if `IsPersistent` check).

#### Updates
The default update interval of all persistent views of an actor system is configurable:

```hocon
akka.persistence.view.auto-update-interval = 5s
```

`PersistentView` implementation classes may also override the `AutoUpdateInterval` method to return a custom update interval for a specific view class or view instance. Applications may also trigger additional updates at any time by sending a view an Update message.

```C#
IActorRef view = system.ActorOf<ViewActor>();
view.Tell(new Update(true));
```

If the await parameter is set to true, messages that follow the `Update` request are processed when the incremental message replay, triggered by that update request, completed. If set to false (default), messages following the update request may interleave with the replayed message stream. 

Automated updates of all persistent views of an actor system can be turned off by configuration:
```hocon
akka.persistence.view.auto-update = off
```
Implementation classes may override the configured default value by overriding the autoUpdate method. To limit the number of replayed messages per update request, applications can configure a custom *akka.persistence.view.auto-update-replay-max* value or override the `AutoUpdateReplayMax` property. The number of replayed messages for manual updates can be limited with the replayMax parameter of the Update message.

#### Recovery
Initial recovery of persistent views works the very same way as for persistent actors (i.e. by sending a `Recover` message to self). The maximum number of replayed messages during initial recovery is determined by `AutoUpdateReplayMax`. Further possibilities to customize initial recovery are explained in section Recovery.

#### Identifiers
A persistent view must have an identifier that doesn't change across different actor incarnations. The identifier must be defined with the `ViewId` method.

The `ViewId` must differ from the referenced `PersistenceId`, unless Snapshots of a view and its persistent actor should be shared (which is what applications usually do not want).

### Snapshots

Snapshots can dramatically reduce recovery times of persistent actors and views. The following discusses snapshots in context of persistent actors but this is also applicable to persistent views.

Persistent actors can save snapshots of internal state by calling the `SaveSnapshot` method. If saving of a snapshot succeeds, the persistent actor receives a `SaveSnapshotSuccess` message, otherwise a `SaveSnapshotFailure` message.

```C#
public class DocumentPersistentSnapshotActor : ReceivePersistentActor
{
    private List<string> _messages = new List<string>();
    private int _pagesSinceLastSnapshot = 0;

    public DocumentPersistentSnapshotActor()
    {
        //...
        
        Command<string>(message =>
        {
            Persist(message, page =>
            {
                _messages.Add(page);
                if (++_pagesSinceLastSnapshot % 5 == 0)
                {
                    SaveSnapshot(_messages);
                }
            });
        });

        Command<SaveSnapshotSuccess>(success => {
            // handle snapshot save success...
            DeleteMessages(success.Metadata.SequenceNr);
        });

        Command<SaveSnapshotFailure>(failure => {
            // handle snapshot save failure...
        });
    }

    public override string PersistenceId { get; } = "HardCoded";
}
```

During recovery, the persistent actor is offered a previously saved snapshot via a `SnapshotOffer` message from which it can initialize internal state.

```C#
Recover<string>(page =>
{
    _messages.Add(page);
});

Recover<SnapshotOffer>(offer => {
    var msgs = offer.Snapshot as List<string>;
    if (msgs != null)
        _messages = _messages.Concat(msgs).ToList();
});
```
The replayed messages that follow the `SnapshotOffer` message, if any, are younger than the offered snapshot. They finally recover the persistent actor to its current (i.e. latest) state.

In general, a persistent actor is only offered a snapshot if that persistent actor has previously saved one or more snapshots and at least one of these snapshots matches the `SnapshotSelectionCriteria` that can be specified for recovery.

```C#
public override Recovery Recovery
{
    get
    {
        return new Recovery(new SnapshotSelectionCriteria(150, DateTime.UtcNow));
    }
}
```

If not specified, they default to `SnapshotSelectionCriteria.Latest` which selects the latest (= youngest) snapshot. To disable snapshot-based recovery, applications should use `SnapshotSelectionCriteria.None`. A recovery where no saved snapshot matches the specified `SnapshotSelectionCriteria` will replay all journaled messages.

### At-Least-Once Delivery

At-Least-Once Delivery actors are specializations of persistent actors and may be used to provide [at-least-once](concepts/message-delivery-reliability#discussion-what-does-at-most-once-mean-) delivery semantics, even in cases where one of the communication endpoints crashes. Because it's possible that the same message will be send twice, actor's receive behavior must work in the idempotent manner.

Members:

- `Deliver` method is used to send a message to another actor in [at-least-once](concepts/message-delivery-reliability#discussion-what-does-at-most-once-mean-) delivery semantics. A message sent this way must be confirmed by the other endpoint with the  `ConfirmDelivery` method. Otherwise it will be resent again and again until the redelivery limit is reached.
- `GetDeliverySnapshot` and `SetDeliverySnapshot` methods are used as part of a delivery snapshotting strategy. They return/reset state of the current guaranteed delivery actor's unconfirmed messages. In order to save custom deliverer state inside a snapshot, a returned delivery snapshot should be included in that snapshot and reset in *ReceiveRecovery* method, when `SnapshotOffer` arrives.
- `RedeliveryBurstLimit` is a virtual property which determines the maximum number of unconfirmed messages to be send in each redelivery attempt. It may be useful in preventing message overflow scenarios. It may be overridden or configured inside HOCON configuration under *akka.persistence.at-least-once-delivery.redelivery-burst-limit* path (10 000 by default).
- `UnconfirmedDeliveryAttemptsToWarn` is a virtual property which determines how many unconfirmed deliveries may be sent before guaranteed delivery actor will send an `UnconfirmedWarning` message to itself. The count is reset after the actor's restart. It may be overridden or configured inside HOCON configuration under *akka.persistence.at-least-once-delivery.warn-after-number-of-unconfirmed-attempts* path (5 by default).
- `MaxUnconfirmedMessages` is a virtual property which determines the maximum number of unconfirmed deliveries to hold in memory. After this threshold is exceeded, any `Deliver` method will raise `MaxUnconfirmedMessagesExceededException`. It may be overridden or configured inside HOCON configuration under *akka.persistence.at-least-once-delivery.max-unconfirmed-messages* path (100 000 by default).
- `UnconfirmedCount` property shows the number of unconfirmed messages.

#### Relationship between Deliver and ConfirmDelivery
To send messages to the destination path, use the `Deliver` method after you have persisted the intent to send the message.

The destination actor must send back a confirmation message. When the sending actor receives this confirmation message you should persist the fact that the message was delivered successfully and then call the `ConfirmDelivery` method.

If the persistent actor is not currently recovering, the deliver method will send the message to the destination actor. When recovering, messages will be buffered until they have been confirmed using `ConfirmDelivery`. Once recovery has completed, if there are outstanding messages that have not been confirmed (during the message replay), the persistent actor will resend these before sending any other messages.

Deliver requires a `deliveryMessageMapper` function to pass the provided `deliveryId` into the message so that the correlation between `Deliver` and `ConfirmDelivery` is possible. The `deliveryId` must do the round trip. Upon receipt of the message, the destination actor will send the same `deliveryId` wrapped in a confirmation message back to the sender. The sender will then use it to call the `ConfirmDelivery` method to complete the delivery routine.

```C#
public class Msg
{
    public Msg(long deliveryId, string message)
    {
        DeliveryId = deliveryId;
        Message = message;
    }

    public long DeliveryId { get; }

    public string Message { get; }
}

public class Confirm
{
    public Confirm(long deliveryId)
    {
        DeliveryId = deliveryId;
    }

    public long DeliveryId { get; }
}

public class MsgSent
{
    public MsgSent(string message)
    {
        Message = message;
    }

    public string Message { get; }
}

public class MsgConfirmed
{
    public MsgConfirmed(long deliveryId)
    {
        DeliveryId = deliveryId;
    }

    public long DeliveryId { get; }
}

public class MyAtLeastOneDeliveryReceiveActor : AtLeastOnceDeliveryReceiveActor
{
    private readonly IActorRef _destionationActor = Context.ActorOf<MyDestinationActor>();

    public MyAtLeastOneDeliveryReceiveActor()
    {
        Recover<MsgSent>(msgSent => Handler(msgSent));
        Recover<MsgConfirmed>(msgConfirmed => Handler(msgConfirmed));

        Command<string>(str =>
        {
            Persist(new MsgSent(str), Handler);
        });

        Command<Confirm>(confirm =>
        {
            Persist(new MsgConfirmed(confirm.DeliveryId), Handler);
        });
    }

    private void Handler(MsgSent msgSent)
    {
        Deliver(_destionationActor.Path, l => new Msg(l, msgSent.Message));
    }

    private void Handler(MsgConfirmed msgConfirmed)
    {
        ConfirmDelivery(msgConfirmed.DeliveryId);
    }

    public override string PersistenceId { get; } = "HardCoded";
}

public class MyDestinationActor : ReceiveActor
{
    public MyDestinationActor()
    {
        Receive<Msg>(msg =>
        {
            Sender.Tell(new Confirm(msg.DeliveryId), Self);
        });
    }
}
```

The `deliveryId` generated by the persistence module is a strictly monotonically increasing sequence number without gaps. The same sequence is used for all destinations of the actor, i.e. when sending to multiple destinations the destinations will see gaps in the sequence. It is not possible to use custom `deliveryId`. However, you can send a custom correlation identifier in the message to the destination. You must then retain a mapping between the internal `deliveryId` (passed into the `deliveryMessageMapper` function) and your custom correlation id (passed into the message). You can do this by storing such mapping in a Map(CorrelationId -> DeliveryId) from which you can retrieve the `deliveryId` to be passed into the `ConfirmDelivery` method once the receiver of your message has replied with your custom correlation id.

The `AtLeastOnceDeliveryReceiveActor` class has a state consisting of unconfirmed messages and a sequence number. It does not store this state itself. You must persist events corresponding to the `Deliver` and `ConfirmDelivery` invocations from your PersistentActor so that the state can be restored by calling the same methods during the recovery phase of the PersistentActor. Sometimes these events can be derived from other business level events, and sometimes you must create separate events. During recovery, calls to deliver will not send out messages, those will be sent later if no matching `ConfirmDelivery` will have been performed.

Support for snapshots is provided by `GetDeliverySnapshot` and `SetDeliverySnapshot`. The `AtLeastOnceDeliverySnapshot` contains the full delivery state, including unconfirmed messages. If you need a custom snapshot for other parts of the actor state you must also include the `AtLeastOnceDeliverySnapshot`. It is serialized using protobuf with the ordinary Akka serialization mechanism. It is easiest to include the bytes of the `AtLeastOnceDeliverySnapshot` as a blob in your custom snapshot.

The interval between redelivery attempts is defined by the `RedeliverInterval` method. The default value can be configured with the *akka.persistence.at-least-once-delivery.redeliver-interval* configuration key. The method can be overridden by implementation classes to return non-default values.

The maximum number of messages that will be sent at each redelivery burst is defined by the `RedeliveryBurstLimit` method (burst frequency is half of the redelivery interval). If there's a lot of unconfirmed messages (e.g. if the destination is not available for a long time), this helps to prevent an overwhelming amount of messages to be sent at once. The default value can be configured with the *akka.persistence.at-least-once-delivery.redelivery-burst-limit* configuration key. The method can be overridden by implementation classes to return non-default values.

After a number of delivery attempts a `UnconfirmedWarning` message will be sent to self. The re-sending will still continue, but you can choose to call `ConfirmDelivery` to cancel the re-sending. The number of delivery attempts before emitting the warning is defined by the `WarnAfterNumberOfUnconfirmedAttempts` property. The default value can be configured with the *akka.persistence.at-least-once-delivery.warn-after-number-of-unconfirmed-attempts* configuration key. The method can be overridden by implementation classes to return non-default values.

The `AtLeastOnceDeliveryReceiveActor` class holds messages in memory until their successful delivery has been confirmed. The maximum number of unconfirmed messages that the actor is allowed to hold in memory is defined by the `MaxUnconfirmedMessages` method. If this limit is exceed the deliver method will not accept more messages and it will throw `MaxUnconfirmedMessagesExceededException`. The default value can be configured with the *akka.persistence.at-least-once-delivery.max-unconfirmed-messages* configuration key. The method can be overridden by implementation classes to return non-default values.

### Journals

Journal is a specialized type of actor which exposes an API to handle incoming events and store them in backend storage. By default Akka.Persitence uses a `MemoryJournal` which stores all events in memory and therefore it's not persistent storage. A custom journal configuration path may be specified inside *akka.persistence.journal.plugin* path and by default it requires two keys set: *class* and *plugin-dispatcher*. Example configuration:

```hocon
akka {
	persistence {
		journal {

			# Path to the journal plugin to be used
	    	plugin = "akka.persistence.journal.inmem"

	    	# In-memory journal plugin.
	    	inmem {

	        	# Class name of the plugin.
	        	class = "Akka.Persistence.Journal.MemoryJournal, Akka.Persistence"

	        	# Dispatcher for the plugin actor.
	        	plugin-dispatcher = "akka.actor.default-dispatcher"
	    	}
    	}
	}
}
```

### Snapshot store

Snapshot store is a specialized type of actor which exposes an API to handle incoming snapshot-related requests and is able to save snapshots in some backend storage. By default Akka.Persistence uses a `LocalSnapshotStore`, which uses a local file system as storage. A custom snapshot store configuration path may be specified inside *akka.persistence.snapshot-store.plugin* path and by default it requires two keys set: *class* and *plugin-dispatcher*. Example configuration:

```hocon
akka {
	persistence {
		snapshot-store {

	    	# Path to the snapshot store plugin to be used
	    	plugin = "akka.persistence.snapshot-store.local"

	    	# Local filesystem snapshot store plugin.
	    	local {

	    		# Class name of the plugin.
	        	class = "Akka.Persistence.Snapshot.LocalSnapshotStore, Akka.Persistence"

	        	# Dispatcher for the plugin actor.
	        	plugin-dispatcher = "akka.persistence.dispatchers.default-plugin-dispatcher"

	        	# Dispatcher for streaming snapshot IO.
	        	stream-dispatcher = "akka.persistence.dispatchers.default-stream-dispatcher"

	        	# Storage location of snapshot files.
	        	dir = "snapshots"
	    	}
    	}
	}
}
```

### Event adapters

Event adapters are an intermediate layer on top of your journal, that allows to produce different data model depending on stored/recovered event type. It's especially useful in situations like:

- **Event versioning** - since events may change their structure over the course of time, you may specify custom event adapter that will deal with mapping obsolete data types accordingly to current business logic.
- **Separation of domain model from stored data** in cases when such separation is necessary.
- **Utilization of persistent backend specific data types** as they allow transition between data understood by actors and specialized format allowed by datastores. Examples of such may be: BSON in MongoDb or JSON data type in PostgreSQL.

For custom event adapter simply create class implementing `IEventAdapter` interface. It's required, that it should either expose parameterless constructor or the one that has `ExtendedActorSystem` as its only argument. Then in order to use it, you'll need to register it and bind to a particular type of events using HOCON configuration - type assignability rules applies here and the most specific types have precedence over the more general ones:

```
akka.persistence.journal {
	<journal_identifier> {
		event-adapters {
			tagging = "<fully qualified event adapter type name with assembly>"
			v1 = "<fully qualified event adapter type name with assembly>"
			v2 = "<fully qualified event adapter type name with assembly>"
		}

		event-adapter-bindings {
			"<fully qualified event type name with assembly>" = v1
			"<fully qualified event type name with assembly>" = [v2, tagging]
		}
	}
}
```

Multiple event adapters may be applied to a single type (for recovery). If that is the case, their order will match order of the definition in *event-adapter-bindings* config section. For write side, each adapter may decide to return none, one or many adapted event for each single event provided as an input. In case of multiple adapters attached, each one of them may decide to return its own set of adapted events. They all will be stored in the same order corresponding to adapters order.

### Contributing

Akka persistence plugin gives a custom journal and snapshot store creator a built-in set of tests, which can be used to verify correctness of the implemented backend storage plugins. It's available through `Akka.Persistence.TestKit` package and uses [xUnit](http://xunit.github.io/) as the default test framework.
