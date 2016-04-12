---
layout: docs.hbs
title: Creating your first Actor
---
# Creating Actors
> **Note**<br>
Since Akka.NET enforces parental supervision every actor is supervised and (potentially) the supervisor of its children, it is advisable that you familiarize yourself with [Actor Systems](Actor Systems) and [Supervision and Monitoring](Supervision) and it may also help to read [Actor References, Paths and Addresses](Addressing).

## Defining an Actor class
Actors in C# are implemented by extending the `ReceiveActor` class and configuring what messages to receive using the `Receive<TMessage>` method.

Here is an example:
```csharp
public class MyActor: ReceiveActor
{
  private readonly ILoggingAdapter log = Context.GetLogger();

  public MyActor()
  {
    Receive<string>(message => {
      log.Info("Received String message: {0}", message);
      Sender.Tell(message);
    });
    Receive<SomeMessage>(message => {...});
  }
}
```

## Props

`Props` is a configuration class to specify options for the creation of actors, think of it as an immutable and thus freely shareable recipe for creating an actor including associated deployment information (e.g. which dispatcher to use, see more below). Here are some examples of how to create a `Props` instance
```csharp
Props props1 = Props.Create(typeof(MyActor));
Props props2 = Props.Create(() => new MyActor(..), "...");
Props props3 = Props.Create<MyActor>();
```
The second variant shows how to pass constructor arguments to the `Actor` being created, but it should only be used outside of actors as explained below.

### Recommended Practices
It is a good idea to provide static factory methods on the `ReceiveActor` which help keeping the creation of suitable `Props` as close to the actor definition as possible.

```csharp
public class DemoActor : ReceiveActor
{
    private readonly int _magicNumber;

    public DemoActor(int magicNumber)
    {
        _magicNumber = magicNumber;
        Receive<int>(x =>
        {
            Sender.Tell(x + _magicNumber);
        });
    }

    public static Props Props(int magicNumber)
    {
        return Akka.Actor.Props.Create(() => new DemoActor(magicNumber));
    }
}

system.ActorOf(DemoActor.Props(42), "demo");
```

Another good practice is to declare what messages an `Actor` can receive in the companion object of the `Actor`, which makes easier to know what it can receive:
```csharp
public class DemoMessagesActor : ReceiveActor
{
    public class Greeting
    {
        public Greeting(string from)
        {
            Greeter = from;
        }

        public string Greeter { get; }
    }

    public DemoMessagesActor()
    {
        Receive<Greeting>(greeting =>
        {
            Sender.Tell("Hello " + greeting.Greeter, Self);
        });
    }
}
```

## Creating Actors with Props
Actors are created by passing a `Props` instance into the `ActorOf` factory method which is available on `ActorSystem` and `ActorContext`.

```csharp
// ActorSystem is a heavy object: create only one per application
ActorSystem system = ActorSystem.Create("MySystem");
IActorRef myActor = system.ActorOf(Props.Create(typeof(MyActor)), "myactor");
```

Using the `ActorSystem` will create top-level actors, supervised by the actor system’s provided guardian actor, while using an actor’s context will create a child actor.

```csharp
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

## The Inbox
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