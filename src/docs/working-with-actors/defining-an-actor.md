---
layout: docs.hbs
title: Defining an Actor class
---
#Defining an Actor class

There are various types of Actor API's you can use to define your Actors. Each has its own merits. Which one to use is up to you.
Lets start with the most common one..

## ReceiveActor API

In order to use the `Receive()` method inside an actor, the actor must
inherit from `ReceiveActor`. Inside the constructor, add a call to
`Receive<T>(Action<T> handler)` for every type of message you want to handle:

```csharp
private class MyActor : ReceiveActor
{
  public MyActor()
  {
    Receive<string>(s => Console.WriteLine("Received string: " + s)); //1
    Receive<int>(i => Console.WriteLine("Received integer: " + i));   //2
  }
}
```

Whenever a message of type `string` is sent to **MyActor**, the first handler
is invoked and for messages of type `int` the second handler is used.

### Handler priority
If more than one handler matches, the one that appears first is used while the
others are ignored.

```csharp
Receive<string>(s => Console.WriteLine("Received string: " + s));      //1
Receive<string>(s => Console.WriteLine("Also received string: " + s)); //2
Receive<object>(o => Console.WriteLine("Received object: " + o));      //3
```
**Example**: The actor receives a message of type `string`. Only the first
handler is invoked, even though all three handlers can handle that message.

### Using predicates
By specifying a predicate, you can choose which messages to handle.

```csharp
Receive<string>(s => s.Length > 5, s => Console.WriteLine("Received string: " + s);
```
The handler above will only be invoked if the length of the string is greater
than 5.

If the predicate do not match, the next matching handler will be used.

```csharp
Receive<string>(s => s.Length > 5, s => Console.WriteLine("1: " + s));    //1
Receive<string>(s => s.Length > 2, s => Console.WriteLine("2: " + s));    //2
Receive<string>(s => Console.WriteLine("3: " + s));                     //3
```
**Example**: The actor receives the message "123456". Since the length of is 6,
the predicate specified for the first handler will return true, and the first
handler will be invoked resulting in "1: 123456" being written to the console.

>**Note**<br/> Note that even though the predicate for the second handler
matches, and that the third handler matches all messages of type `string`
only the first handler is invoked.

**Example**: If the actor receives the message "1234", then "2: 1234" will be
written to the console.

**Example**: If the actor receives the message "12", then "3: 12" will be
written on the console.

#### Predicates position
Predicates can be specified *before* the action handler or *after*. These two
declarations are equivalent:
```csharp
Receive<string>(s => s.Length > 5, s => Console.WriteLine("Received string: " + s));
Receive<string>(s => Console.WriteLine("Received string: " + s), s => s.Length > 5);
```

### Receive using Funcs
More complex handlers can be specified using the `Receive<T>(Func<T,bool> handler)`
overload. These are invoked if the message is of the specified type. The func
handler should return `true` if the message was handled, and `false`otherwise.
If the handler returns `true`no more handlers will be invoked.
```csharp
Receive<string>(s =>
{
    if(s.Length > 5)
    {
      Console.WriteLine("1: " + s);
      return true;
    }
    return false;
});
Receive<string>(s => Console.WriteLine("2: " + s));
```

**Example**: The actor receives the message "123". Since it's a `string`, the
first handler is invoked. The length is only 3 so the if clause will be false
and `false` is returned. Since `false` was returned the next matching handler
will be invoked, and "2: 123" will be written to the console.
**Example**: The actor receives the message "123456". Since it's a `string`,
the first handler is invoked. The length is greater than 5 so the if body will
be called, and "1: 123456" will be written to the console. The handler returns
`true` and therefore no more handlers will be invoked.

>**Note**<br/>It's bad practice to return `true` when a message has not been
handled and can lead to hard found bugs. It's better to let the `Unhandled()`
publish the message to the `EventStream` as explained below.

### Unmatched messages
If the actor receives a message for which no handler matches, the unhandled
message is published to the `EventStream` wrapped in an `UnhandledMessage`.
To change this behavior override `Unhandled(object message)`
```csharp
protected override void Unhandled(object message)
{
  //Do something with the message.
}
```

Another option is to add a last handler that matches all messages,
using `ReceiveAny()`.

### ReceiveAny
To catch messages of any type the `ReceiveAny(Action<object> handler)` overload
can be specified.
```csharp
Receive<string>(s => Console.WriteLine("Received string: " + s);
ReceiveAny(o => Console.WriteLine("Received object: " + o);
```

Since it handles everything, it must be specified last. Specifying handlers it
after will cause an exception.
```csharp
ReceiveAny(o => Console.WriteLine("Received object: " + o);
Receive<string>(s => Console.WriteLine("Received string: " + s);  //This will cause an exception
```

>**Note**<br/>Note that `Receive<object>(Action<object> handler)` behaves
the same as `ReceiveAny()` as it catches all messages. These two are equivalent:
```csharp
ReceiveAny(o => Console.WriteLine("Received object: " + o);
Receive<object>(0 => Console.WriteLine("Received object: " + o);
```

### Non generic overloads
`Receive` has non generic overloads:
```csharp
Receive(typeof(string), obj => Console.WriteLine(obj.ToString()) );
```
Predicates can go before or after the handler:
```csharp
Receive(typeof(string), obj=> ((string) obj).Length>5, obj => Console.WriteLine(obj.ToString()) );
Receive(typeof(string), obj => Console.WriteLine(obj.ToString()), obj=> ((string) obj).Length>5 );
```
And the non generic Func
```csharp
Receive(typeof(string), obj =>
  {
    var s = (string) obj;
    if(s.Length > 5)
    {
      Console.WriteLine("1: " + s);
      return true;
    }
    return false;
  });
```


## UntypedActor API
The `UntypedActor` class defines only one abstract method, the above mentioned `OnReceive(object message)`, which implements the behavior of the actor.

If the current actor behavior does not match a received message, it's recommended that you call the unhandled method, which by default publishes a new `Akka.Actor.UnhandledMessage(message, sender, recipient)` on the actor system’s event stream (set configuration item `akka.actor.debug.unhandled` to on to have them converted into actual `Debug` messages).

In addition, it offers:

* `Self` reference to the `ActorRef` of the actor

* `Sender` reference sender Actor of the last received message, typically used as described in Reply to messages

* `SupervisorStrategy` user overridable definition the strategy to use for supervising child actors

This strategy is typically declared inside the actor in order to have access to the actor’s internal state within the decider function: since failure is communicated as a message sent to the supervisor and processed like other messages (albeit outside of the normal behavior), all values and variables within the actor are available, as is the Sender reference (which will be the immediate child reporting the failure; if the original failure occurred within a distant descendant it is still reported one level up at a time).

* `Context` exposes contextual information for the actor and the current message, such as:

  * factory methods to create child actors (actorOf)
  * system that the actor belongs to
  * parent supervisor
  * supervised children
  * lifecycle monitoring
  * hotswap behavior stack as described in HotSwap

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


## ActorBase vs ReceiveActor
TODO
Just some points:
Use `ActorBase` if you really, really need speed. ReceiveActors are a bit slower
and will consume a bit more memory. Let's just hope we get
[pattern matching in C#](http://www.infoq.com/news/2014/08/Pattern-Matching)
soon :)

## F# API

TODO
