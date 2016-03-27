﻿---
layout: docs.hbs
title: Actors
---

The Actor Model provides a higher level of abstraction for writing concurrent and distributed systems. It alleviates the developer from having to deal with explicit locking and thread management, making it easier to write correct concurrent and parallel systems. Actors were defined in the 1973 paper by Carl Hewitt but have been popularized by the Erlang language, and used for example at Ericsson with great success to build highly concurrent and reliable telecom systems.

## Creating Actors
> **Note**<br/>
Since Akka.NET enforces parental supervision every actor is supervised and (potentially) the supervisor of its children, it is advisable that you familiarize yourself with [Actor Systems](Actor Systems) and [Supervision and Monitoring](Supervision) and it may also help to read [Actor References, Paths and Addresses](Addressing).

### Defining an Actor class
Actors are implemented by extending the `UntypedActor` class and implementing the `OnReceive` method. This method takes the message as a parameter.

Here is an example:
```csharp
public class MyUntypedActor : UntypedActor
{
    private readonly ILoggingAdapter log = Context.GetLogger();

    protected override void OnReceive(object message)
    {
        if (message is string)
        {
            log.Info("Received String message: {0}", message);
            Sender.Tell(message, Self);
        }
        else
        {
            Unhandled(message);
        }
    }
}
```

### Props

`Props` is a configuration class to specify options for the creation of actors, think of it as an immutable and thus freely shareable recipe for creating an actor including associated deployment information (e.g. which dispatcher to use, see more below). Here are some examples of how to create a `Props` instance
```csharp
Props props1 = Props.Create(typeof(MyActor));
Props props2 = Props.Create(() => new MyActor(..), "...");
Props props3 = Props.Create<MyActor>();
```
The second variant shows how to pass constructor arguments to the `Actor` being created, but it should only be used outside of actors as explained below.

#### Recommended Practices
It is a good idea to provide static factory methods on the `UntypedActor` which help keeping the creation of suitable `Props` as close to the actor definition as possible.

```csharp
public class DemoActor : UntypedActor
{
    private readonly int _magicNumber;

    public DemoActor(int magicNumber)
    {
        _magicNumber = magicNumber;
    }

    public static Props CreateProps(int magicNumber)
    {
        return Props.Create(() => new DemoActor(magicNumber));
    }

    protected override void OnReceive(object message)
    {
        if (message is int)
        {
            int x = (int)message;
            Sender.Tell(x + _magicNumber);
        }
        else
        {
            Unhandled(message);
        }
    }
}

system.ActorOf(DemoActor.CreateProps(42), "demo");
```

Another good practice is to declare what messages an `Actor` can receive in the companion object of the `Actor`, which makes easier to know what it can receive:
```csharp
public class DemoMessagesActor : UntypedActor
{
    public class Greeting
    {
        public Greeting(string from)
        {
            Greeter = from;
        }

        public string Greeter { get; }
    }

    protected override void OnReceive(object message)
    {
        if (message is Greeting)
        {
            var greeting = (Greeting)message;
            Sender.Tell("Hello " + greeting.Greeter, Self);
        }
        else
        {
            Unhandled(message);
        }
    }
}
```

### Creating Actors with Props
Actors are created by passing a `Props` instance into the `ActorOf` factory method which is available on `ActorSystem` and `ActorContext`.
```C#
// ActorSystem is a heavy object: create only one per application
ActorSystem system = ActorSystem.Create("MySystem");
IActorRef myActor = system.ActorOf(Props.Create(typeof(MyActor)), "myactor");
```
Using the `ActorSystem` will create top-level actors, supervised by the actor system’s provided guardian actor, while using an actor’s context will create a child actor.
```C#
public class FirstActor : ReceiveActor
{
    IActorRef child = Context.ActorOf(Props.Create(typeof(MyActor)), "myChild");
    // plus some behavior ...
}
```
It is recommended to create a hierarchy of children, grand-children and so on such that it fits the logical failure-handling structure of the application, see [Actor Systems](ActorSystem).

The call to `ActorOf` returns an instance of `IActorRef`. This is a handle to the actor instance and the only way to interact with it. The `IActorRef` is immutable and has a one to one relationship with the `Actor` it represents. The `IActorRef` is also serializable and network-aware. This means that you can serialize it, send it over the wire and use it on a remote host and it will still be representing the same `Actor` on the original node, across the network.

The name parameter is optional, but you should preferably name your actors, since that is used in log messages and for identifying actors. The name must not be empty or start with `$`, but it may contain URL encoded characters (eg. `%20` for a blank space). If the given name is already in use by another child to the same parent an `InvalidActorNameException` is thrown.

Actors are automatically started asynchronously when created.

### The Inbox
When writing code outside of actors which shall communicate with actors, the ask pattern can be a solution (see below), but there are two things it cannot do: receiving multiple replies (e.g. by subscribing an `IActorRef` to a notification service) and watching other actors’ lifecycle. For these purposes there is the `Inbox` class:
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

The send method wraps a normal `Tell` and supplies the internal actor’s reference as the sender. This allows the reply to be received on the last line. Watching an actor is quite simple as well
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

## UntypedActor API
The `UntypedActor` class defines only one abstract method, the above mentioned `OnReceive(object message)`, which implements the behavior of the actor.

If the current actor behavior does not match a received message, it's recommended that you call the unhandled method, which by default publishes a new `Akka.Actor.UnhandledMessage(message, sender, recipient)` on the actor system’s event stream (set configuration item `akka.actor.debug.unhandled` to on to have them converted into actual `Debug` messages).

In addition, it offers:

* `Self` reference to the `IActorRef` of the actor

* `Sender` reference sender Actor of the last received message, typically used as described in [Reply to messages](reply-to-messages).

* `SupervisorStrategy` user overridable definition the strategy to use for supervising child actors

This strategy is typically declared inside the actor in order to have access to the actor’s internal state within the decider function: since failure is communicated as a message sent to the supervisor and processed like other messages (albeit outside of the normal behavior), all values and variables within the actor are available, as is the `Sender` reference (which will be the immediate child reporting the failure; if the original failure occurred within a distant descendant it is still reported one level up at a time).

* `Context` exposes contextual information for the actor and the current message, such as:

  * factory methods to create child actors (`ActorOf`)
  * system that the actor belongs to
  * parent supervisor
  * supervised children
  * lifecycle monitoring
  * hotswap behavior stack as described in [HotSwap](hotswap)

The remaining visible methods are user-overridable life-cycle hooks which are described in the following:

```csharp
public override void PreStart()
{
}

protected override void PreRestart(Exception reason, object message)
{
    foreach (ActorRef each in Context.GetChildren())
    {
      Context.Unwatch(each);
      Context.Stop(each);
    }
    PostStop();
}

protected override void PostRestart(Exception reason)
{
  PreStart();
}

protected override void PostStop()
{
}
```
The implementations shown above are the defaults provided by the `UntypedActor` class.

### Actor Lifecycle

### Lifecycle Monitoring aka DeathWatch

### Start Hook

### Restart Hooks

### Stop Hook

## Identifying Actors via Actor Selection
As described in Actor References, Paths and Addresses, each actor has a unique logical path, which is obtained by following the chain of actors from child to parent until reaching the root of the actor system, and it has a physical path, which may differ if the supervision chain includes any remote supervisors. These paths are used by the system to look up actors, e.g. when a remote message is received and the recipient is searched, but they are also useful more directly: actors may look up other actors by specifying absolute or relative paths—logical or physical—and receive back an `ActorSelection` with the result:

```csharp
// will look up this absolute path
Context.ActorSelection("/user/serviceA/actor");

// will look up sibling beneath same supervisor
Context.ActorSelection("../joe");
```
> **Note**<br/>
It is always preferable to communicate with other Actors using their `IActorRef` instead of relying upon `ActorSelection`. Exceptions are: sending messages using the At-Least-Once Delivery facility, initiating first contact with a remote system. In all other cases `ActorRefs` can be provided during Actor creation or initialization, passing them from parent to child or introducing Actors by sending their `ActorRefs` to other Actors within messages.

The supplied path is parsed as a `System.URI`, which basically means that it is split on `/` into path elements. If the path starts with /, it is absolute and the look-up starts at the root guardian (which is the parent of `"/user"`); otherwise it starts at the current actor. If a path element equals `..`, the look-up will take a step “up” towards the supervisor of the currently traversed actor, otherwise it will step “down” to the named child. It should be noted that the `..` in actor paths here always means the logical structure, i.e. the supervisor.

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
public class Follower : UntypedActor
{
    public Follower(ActorRef probe)
    {
        var selection = Context.ActorSelection("/user/another");
        selection.Tell(new Identify(identifyId), Self);
        this.probe = probe;
    }

    string identifyId = "1";
    ActorRef another;
    ActorRef probe;

    protected override void OnReceive(object message)
    {
        if (message is ActorIdentity)
        {
            var identity = (ActorIdentity)message;

            if (identity.MessageId.Equals(identifyId))
            {
                var subject = identity.Subject;

                if (subject == null)
                    Context.Stop(Self);
                else
                {
                    another = subject;
                    Context.Watch(another);
                    probe.Tell(subject, Self);
                }
            }
        }
        else if (message is Terminated)
        {
            var t = (Terminated)message;
            if (t.ActorRef == another)
            {
                Context.Stop(Self);
            }
        }
        else
        {
            Unhandled(message);
        }
    }
}
```

You can also acquire an `IActorRef` for an `ActorSelection` with the `ResolveOne` method of the `ActorSelection`. It returns a Task of the matching `IActorRef` if such an actor exists. It is completed with failure `akka.actor.ActorNotFound` if no such actor exists or the identification didn't complete within the supplied timeout.

Remote actor addresses may also be looked up, if *remoting* is enabled:

```C#
Context.ActorSelection("akka.tcp://app@otherhost:1234/user/serviceB");
```

## Messages and immutability
**IMPORTANT:** Messages can be any kind of object but have to be immutable. Akka can’t enforce immutability (yet) so this has to be by convention.

Here is an example of an immutable message:

```csharp
public class ImmutableMessage
{
    public ImmutableMessage(int sequenceNumber, List<string> values)
    {
        this.SequenceNumber = sequenceNumber;
        this.Values = values.AsReadOnly();
    }

    public int SequenceNumber { get; private set; }
    public IReadOnlyCollection<string> Values { get; private set; }
}
```

## Send messages
Messages are sent to an Actor through one of the following methods.

- `tell` means `“fire-and-forget”`, e.g. send a message asynchronously and return immediately.
- `ask` sends a message asynchronously and returns a Future representing a possible reply.

Message ordering is guaranteed on a per-sender basis.

> **Note**<br/>
There are performance implications of using `Ask` since something needs to keep track of when it times out, there needs to be something that bridges a `Task` into an `IActorRef` and it also needs to be reachable through remoting. So always prefer `Tell` for performance, and only `Ask` if you must.

In all these methods you have the option of passing along your own `IActorRef`. Make it a practice of doing so because it will allow the receiver actors to be able to respond to your message, since the `Sender` reference is sent along with the message.

### Tell: Fire-forget
This is the preferred way of sending messages. No blocking waiting for a message. This gives the best concurrency and scalability characteristics.

```csharp
// don’t forget to think about who is the sender (2nd argument)
target.Tell(message, Self);
```
The sender reference is passed along with the message and available within the receiving actor via its `Sender` property while processing this message. Inside of an actor it is usually `Self` who shall be the sender, but there can be cases where replies shall be routed to some other actor—e.g. the parent—in which the second argument to `Tell` would be a different one. Outside of an actor and if no reply is needed the second argument can be `null`; if a reply is needed outside of an actor you can use the ask-pattern described next.

### Ask: Send-And-Receive-Future
The ask pattern involves actors as well as Tasks, hence it is offered as a use pattern rather than a method on ActorRef:

```csharp
var tasks = new List<Task>();
tasks.Add(actorA.Ask("request", TimeSpan.FromSeconds(1)));
tasks.Add(actorB.Ask("another request", TimeSpan.FromSeconds(5)));

Task.WhenAll(tasks).PipeTo(actorC, Self);
```

This example demonstrates `Ask` together with the `Pipe` Pattern on tasks, because this is likely to be a common combination. Please note that all of the above is completely non-blocking and asynchronous: `Ask` produces a `Task`, two of which are awaited until both are completed, and when that happens, a new `Result` object is forwarded to another actor.

Using `Ask` will send a message to the receiving Actor as with `Tell`, and the receiving actor must reply with `Sender.Tell(reply, Self)` in order to complete the returned `Task` with a value. The `Ask` operation involves creating an internal actor for handling this reply, which needs to have a timeout after which it is destroyed in order not to leak resources; see more below.

>**Warning**<br/> To complete the `Task` with an exception you need send a `Failure` message to the sender. This is not done automatically when an actor throws an exception while processing a message.

```csharp
try
{
    var result = operation();
    Sender.Tell(result, Self);
}
catch (Exception e)
{
    Sender.Tell(new Failure { Exception = e }, Self);
}
```

If the actor does not complete the task, it will expire after the timeout period, specified as parameter to the `Ask` method, and the `Task` will be cancelled and throw a `TaskCancelledException`.

For more information on Tasks, check out the [MSDN documentation](https://msdn.microsoft.com/en-us/library/dd537609(v=vs.110).aspx).

> **Warning**<br/>
When using task callbacks inside actors, you need to carefully avoid closing over the containing actor’s reference, i.e. do not call methods or access mutable state on the enclosing actor from within the callback. This would break the actor encapsulation and may introduce synchronization bugs and race conditions because the callback will be scheduled concurrently to the enclosing actor. Unfortunately there is not yet a way to detect these illegal accesses at compile time.

### Forward message
You can forward a message from one actor to another. This means that the original sender address/reference is maintained even though the message is going through a 'mediator'. This can be useful when writing actors that work as routers, load-balancers, replicators etc. You need to pass along your context variable as well.

```csharp
target.Forward(result, Context);
```

## Receive messages
When an actor receives a message it is passed into the `OnReceive` method, this is an abstract method on the `UntypedActor` base class that needs to be defined.

Here is an example:
```csharp
public class MyUntypedActor : UntypedActor
{
    private ILoggingAdapter log = Context.GetLogger();

    protected override void OnReceive(object message)
    {
        if (message is string)
        {
            log.Info("Received String message: {0}", message);
            Sender.Tell(message, Self);
        }
        else
        {
            Unhandled(message);
        }
    }
}
```

## Reply to messages
If you want to have a handle for replying to a message, you can use `Sender`, which gives you an `IActorRef`. You can reply by sending to that `IActorRef` with `Sender.Tell(replyMsg, Self)`. You can also store the `IActorRef` for replying later, or passing on to other actors. If there is no sender (a message was sent without an actor or task context) then the sender defaults to a 'dead-letter' actor ref.

```csharp
protected override void OnReceive(object message)
{
  var result = calculateResult();

  // do not forget the second argument!
  Sender.Tell(result, Self);
}
```

## Receive timeout
The `IActorContext` `SetReceiveTimeout` defines the inactivity timeout after which the sending of a `ReceiveTimeout` message is triggered. When specified, the receive function should be able to handle an `Akka.Actor.ReceiveTimeout` message.

> **Note**<br/>
Please note that the receive timeout might fire and enqueue the `ReceiveTimeout` message right after another message was enqueued; hence it is not guaranteed that upon reception of the receive timeout there must have been an idle period beforehand as configured via this method.

Once set, the receive timeout stays in effect (i.e. continues firing repeatedly after inactivity periods). Pass in `null` to `SetReceiveTimeout` to switch off this feature.

```csharp
public class MyUntypedActor : UntypedActor
{
    public MyUntypedActor()
    {
        // To set an initial delay
        SetReceiveTimeout(TimeSpan.FromSeconds(30));
    }

    protected override void OnReceive(object message)
    {
        if (message.Equals("Hello"))
        {
            // To set in a response to a message
            SetReceiveTimeout(TimeSpan.FromSeconds(1));
        }
        else if (message is ReceiveTimeout)
        {
            // To turn it off
            Context.SetReceiveTimeout(null);
        }
        else
        {
            Unhandled(message);
        }
    }
}
```

## Stopping actors
Actors are stopped by invoking the `Stop` method of a `ActorRefFactory`, i.e. `ActorContext` or `ActorSystem`. Typically the context is used for stopping child actors and the system for stopping top level actors. The actual termination of the actor is performed asynchronously, i.e. stop may return before the actor is stopped.

```csharp
public class MyStoppingActor : UntypedActor
{
    private IActorRef child;

    protected override void OnReceive(object message)
    {
        if (message.Equals("interrupt-child"))
        {
            Context.Stop(child);
        }
        else if (message is ReceiveTimeout)
        {
            Context.Stop(Self);
        }
        else
        {
            Unhandled(message);
        }
    }
}
```

Processing of the current message, if any, will continue before the actor is stopped, but additional messages in the mailbox will not be processed. By default these messages are sent to the `DeadLetters` of the `ActorSystem`, but that depends on the mailbox implementation.

Termination of an actor proceeds in two steps: first the actor suspends its mailbox processing and sends a stop command to all its children, then it keeps processing the internal termination notifications from its children until the last one is gone, finally terminating itself (invoking `PostStop`, dumping mailbox, publishing `Terminated` on the `DeathWatch`, telling its supervisor). This procedure ensures that actor system sub-trees terminate in an orderly fashion, propagating the stop command to the leaves and collecting their confirmation back to the stopped supervisor. If one of the actors does not respond (i.e. processing a message for extended periods of time and therefore not receiving the stop command), this whole process will be stuck.

Upon `ActorSystem.Terminate`, the system guardian actors will be stopped, and the aforementioned process will ensure proper termination of the whole system.

The `PostStop` hook is invoked after an actor is fully stopped. This enables cleaning up of resources:

```csharp
protected override void PostStop()
{
    // clean up resources here ...
}
```

> **Note**<br/>
Since stopping an actor is asynchronous, you cannot immediately reuse the name of the child you just stopped; this will result in an `InvalidActorNameException`. Instead, watch the terminating actor and create its replacement in response to the `Terminated` message which will eventually arrive.

### PoisonPill
You can also send an actor the `Akka.Actor.PoisonPill` message, which will stop the actor when the message is processed. `PoisonPill` is enqueued as ordinary messages and will be handled after messages that were already queued in the mailbox.

Use it like this:

```csharp
myActor.Tell(PoisonPill.Instance, Sender);
```

### Graceful Stop
`GracefulStop` is useful if you need to wait for termination or compose ordered termination of several actors:

```csharp
var manager = system.ActorOf<Manager>();

try
{
    await manager.GracefulStop(TimeSpan.FromMilliseconds(5), "shutdown");
    // the actor has been stopped
}
catch (TaskCanceledException)
{
    // the actor wasn't stopped within 5 seconds
}

...

public class Manager : UntypedActor
{
    private IActorRef worker = Context.Watch(Context.ActorOf<Worker>("worker"));

    protected override void OnReceive(object message)
    {
        if (message.Equals("job"))
        {
            worker.Tell("crunch", Self);
        }
        else if (message.Equals("shutdown"))
        {
            worker.Tell(PoisonPill.Instance, Self);
            Context.Become(ShuttingDown);
        }
    }

    private void ShuttingDown(object message)
    {
        if (message.Equals("job"))
        {
            Sender.Tell("service unavailable, shutting down", Self);
        }
        else if (message is Terminated)
        {
            Context.Stop(Self);
        }
    }
}
```

When `GracefulStop()` returns successfully, the actor’s `PostStop()` hook will have been executed: there exists a happens-before edge between the end of `PostStop()` and the return of `GracefulStop()`.

In the above example a `"shutdown"` message is sent to the target actor to initiate the process of stopping the actor. You can use `PoisonPill` for this, but then you have limited possibilities to perform interactions with other actors before stopping the target actor. Simple cleanup tasks can be handled in `PostStop`.

> **Warning**<br/>
Keep in mind that an actor stopping and its name being deregistered are separate events which happen asynchronously from each other. Therefore it may be that you will find the name still in use after `GracefulStop()` returned. In order to guarantee proper deregistration, only reuse names from within a supervisor you control and only in response to a `Terminated` message, i.e. not for top-level actors.

## Become/Unbecome
### Upgrade
Akka supports hotswapping the Actor’s message loop (e.g. its implementation) at runtime. Use the `Context.Become` method from within the Actor. The hotswapped code is kept in a `Stack` which can be pushed (replacing or adding at the top) and popped.

> **Warning**<br/>
Please note that the actor will revert to its original behavior when restarted by its Supervisor.

To hotswap the Actor using `Context.Become`:

```csharp
public class HotSwapActor : UntypedActor
{
    protected override void OnReceive(object message)
    {
        if (message.Equals("angry"))
        {
            Become(Angry);
        }
        else if (message.Equals("happy"))
        {
            Become(Happy);
        }
        else
        {
            Unhandled(message);
        }
    }

    private void Angry(object message)
    {
        if (message.Equals("angry"))
        {
            Sender.Tell("I am already angry!", Self);
        }
        else if (message.Equals("happy"))
        {
            Become(Happy);
        }
    }

    private void Happy(object message)
    {
        if (message.Equals("happy"))
        {
            Sender.Tell("I am already happy :-)", Self);
        }
        else if (message.Equals("angry"))
        {
            Become(Angry);
        }
    }
}
```

This variant of the `Become` method is useful for many different things, such as to implement a Finite State Machine (FSM). It will replace the current behavior (i.e. the top of the behavior stack), which means that you do not use Unbecome, instead always the next behavior is explicitly installed.

The other way of using `Become` does not replace but add to the top of the behavior stack. In this case care must be taken to ensure that the number of “pop” operations (i.e. `Unbecome`) matches the number of “push” ones in the long run, otherwise this amounts to a memory leak (which is why this behavior is not the default).

```csharp
public class Swapper : UntypedActor
{
    public static readonly object SWAP = new object();

    private ILoggingAdapter log = Context.GetLogger();

    protected override void OnReceive(object message)
    {
        if (message == SWAP)
        {
            log.Info("Hi");

            Become(m =>
            {
                log.Info("Ho");
                Unbecome();
            }, false);
        }
        else
        {
            Unhandled(message);
        }
    }
}
...

static void Main(string[] args)
{
    var system = ActorSystem.Create("MySystem");
    var swapper = system.ActorOf<Swapper>();

    swapper.Tell(Swapper.SWAP);
    swapper.Tell(Swapper.SWAP);
    swapper.Tell(Swapper.SWAP);
    swapper.Tell(Swapper.SWAP);
    swapper.Tell(Swapper.SWAP);
    swapper.Tell(Swapper.SWAP);

    Console.ReadLine();
}
```

## Stash

## Killing an Actor
You can kill an actor by sending a `Kill` message. This will cause the actor to throw a `ActorKilledException`, triggering a failure. The actor will suspend operation and its supervisor will be asked how to handle the failure, which may mean resuming the actor, restarting it or terminating it completely. See [What Supervision Means](supervision#what-supervision-means) for more information.

Use `Kill` like this:

```csharp
victim.Tell(Kill.Instance, ActorRef.NoSender);
```

## Actors and exceptions
It can happen that while a message is being processed by an actor, that some kind of exception is thrown, e.g. a database exception.

### What happens to the Message
If an exception is thrown while a message is being processed (i.e. taken out of its mailbox and handed over to the current behavior), then this message will be lost. It is important to understand that it is not put back on the mailbox. So if you want to retry processing of a message, you need to deal with it yourself by catching the exception and retry your flow. Make sure that you put a bound on the number of retries since you don't want a system to livelock (so consuming a lot of cpu cycles without making progress).

### What happens to the mailbox
If an exception is thrown while a message is being processed, nothing happens to the mailbox. If the actor is restarted, the same mailbox will be there. So all messages on that mailbox will be there as well.

### What happens to the actor
If code within an actor throws an exception, that actor is suspended and the supervision process is started (see [Supervision and Monitoring](supervision)). Depending on the supervisor’s decision the actor is resumed (as if nothing happened), restarted (wiping out its internal state and starting from scratch) or terminated.

## Initialization patterns

The rich lifecycle hooks of `Actors` provide a useful toolkit to implement various initialization patterns. During the lifetime of an `IActorRef`, an actor can potentially go through several restarts, where the old instance is replaced by a fresh one, invisibly to the outside observer who only sees the `IActorRef`.

One may think about the new instances as "incarnations". Initialization might be necessary for every incarnation of an actor, but sometimes one needs initialization to happen only at the birth of the first instance when the `IActorRef` is created. The following sections provide patterns for different initialization needs.

### Initialization via constructor
Using the constructor for initialization has various benefits. First of all, it makes it possible to use readonly fields to store any state that does not change during the life of the actor instance, making the implementation of the actor more robust. The constructor is invoked for every incarnation of the actor, therefore the internals of the actor can always assume that proper initialization happened. This is also the drawback of this approach, as there are cases when one would like to avoid reinitializing internals on restart. For example, it is often useful to preserve child actors across restarts. The following section provides a pattern for this case.

### Initialization via PreStart
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

For more information see [What Restarting Means](Supervision#what-restarting-means).

#### Initialization via message passing

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