---
layout: docs.hbs
title: Messages
---

# Messages
One of the most fundamental concepts to the Actor model is the notion of ["message-driven systems," as defined by the Reactive Manifesto](http://www.reactivemanifesto.org/glossary#Message-Driven "Reactive Manifesto"):

> A message is an item of data that is sent to a specific destination. An event is a signal emitted by a component upon reaching a given state. In a message-driven system addressable recipients await the arrival of messages and react to them, otherwise lying dormant.

**Message-passing** is how Akka.NET actors communicate with each other in Akka.NET.

## How are messages defined?
In Akka.NET messages are simple POCO classes:

#### `C#`
```csharp
public class MyMessage
{
    public MyMessage(string name)
    {
        Name = name;
    }

    public string Name {get;private set;}
}
```

#### `F#`
```fsharp
type MyMessage =
    | Name of string
```

Akka.NET allows you to automatically pass around these messages to any actor, whether it's an actor running inside your application's local process or a remote actor running on a different machine. Akka.NET can automatically serialize and route your message to its intended recipient(s.)

## Actors change their internal state based on the content of messages
One of the defining characteristics of actors is that they have the ability to change their state in a thread-safe way, and they do this based on the content of messages they receive.

Here's a simple example:

```csharp
using System;
using Akka.Actor;


/* message definition */
public class MyMessage
{
    public MyMessage(string name)
    {
        Name = name;
    }

    public string Name {get;private set;}
}

public class Hi{}

/* actor definition */
public class MyActor : ReceiveActor
{
    string lastActorName;

    public MyActor()
    {
        Receive<MyMessage>(msg =>
        {
            lastActorName = msg.Name;
        });
        Receive<Hi>(hi => Console.WriteLine("Hi {0}!",lastActorName));
    }
}

public class Program
{
    public static void Main()
    {
        var mySystem = ActorSystem.Create("MySystem");
        var myActor = mySystem.ActorOf(Props.Create<MyActor>());
        myActor.Tell(new MyMessage("AkkaDotNetUser"));
        myActor.Tell(new Hi());
    }
}
```

`MyActor.lastActorName` gets set to the latest value provided in the last `MyMessage` instance received, and then that value gets printed to the console whenever a `Hi` message type is received.

This is how you should expect to modify your actor's mutable state inside Akka.NET - by passing stateful messages.

## Messages are immutable

One major design constraint that **you, the Akka.NET user must enforce throughout your code** is guaranteeing that your message classes are [immutable objects](http://en.wikipedia.org/wiki/Immutable_object).

*Quoted from [Beyond HTTP: "What is an Actor?"](http://petabridge.com/blog/akkadotnet-what-is-an-actor/ "What is an Akka.NET Actor?")*

So what's an "immutable" object?

> An immutable object is an object who's state (i.e. the contents of its memory) cannot be modified once it's been created.

If you're a .NET developer, you've used the `string` class. Did you know that [in .NET `string` is an immutable object](http://stackoverflow.com/questions/2365272/why-net-string-is-immutable)?

Here's an example:

```csharp
var myStr = "Hi!".ToLowerInvariant().Replace("!", "?");
```

In this example, the following occurs in this order:

1. .NET allocates a `const string` with the content Hi!" and then
1. `ToLowerInvariant()` is called, which **copies the original "Hi!" string** and *modifies the copy* to become all lowercase and returns the modified copy (which now reads as "hi!") Then
1. `.Replace(string,string)` is called, which **copies the "hi!" string returned by `ToLowerInvariant`** and *modifies the copy* to substitute `!` with `?` and returns the modified copy, with the final result reading as "hi?"

Since the original `string` is immutable, all of these operations had to make a copy of the string before they could make their changes.

> Immutable messages are inherently thread-safe.  No thread can modify the content of an immutable message, so a second thread receiving the original message doesn't have to worry about a previous thread altering the state in an unpredictable way.

Hence, in Akka.NET - all messages are immutable and thus thread-safe. That's one of the reasons why we can have thousands of Akka.NET actors process messages concurrently without synchronization mechanisms and other weird stuff - because immutable messages eliminate that as a requirement.

## Message-passing is asynchronous
*Quoted from [Beyond HTTP: "What is an Actor?"](http://petabridge.com/blog/akkadotnet-what-is-an-actor/ "What is an Akka.NET Actor?")*

In OOP, your objects communicate with each-other via function calls. The same is true for procedural programming. Class A calls a function on Class B and waits for that function to return before Class A can move onto the rest of its work.

In the Akka.NET and the Actor model, actors communicate with each-other by sending messages.

So what's so radical about this idea?

> Well for starters, **message passing is asynchronous** - the actor who sent the message can continue to do other work while the receiving actor processes the sender's message.
>
> So in effect, every interaction one actor has with any other actor is going to be asynchronous by default.

That's a dramatic change, but here's another big one...

> Since all "function calls" have been replaced by messages, i.e. distinct instances of objects, actors can store a history of their function calls and even defer processing some function calls until later in the future!

Imagine how easy it would be to build something like the Undo button in Microsoft Word with an actor - by default you have a message that represents every change someone made to a document. To undo one of those changes, you just have to pop the message off of the UndoActor's stash of messages and push that change back to another actor who manages the current state of the Word document. This is a pretty powerful concept in practice.

### References
* **[*Reactive Manifesto*: Glossary - Message-driven](http://www.reactivemanifesto.org/glossary#Message-Driven)**
* **[*Beyond HTTP:* "What is an Actor?"](http://petabridge.com/blog/akkadotnet-what-is-an-actor/ "What is an Akka.NET Actor?")**
* **[*Wikipedia*: "Immutable object"](http://en.wikipedia.org/wiki/Immutable_object)**
