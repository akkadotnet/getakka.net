---
layout: docs.hbs
title: Sending messages
---
# Sending messages

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

tell means “fire-and-forget”, e.g. send a message asynchronously and return immediately.
ask sends a message asynchronously and returns a Future representing a possible reply.
Message ordering is guaranteed on a per-sender basis.

>**Note**<br/>
There are performance implications of using ask since something needs to keep track of when it times out, there needs to be something that bridges a Promise into an ActorRef and it also needs to be reachable through remoting. So always prefer tell for performance, and only ask if you must.

In all these methods you have the option of passing along your own ActorRef. Make it a practice of doing so because it will allow the receiver actors to be able to respond to your message, since the sender reference is sent along with the message.

### Tell: Fire-forget
This is the preferred way of sending messages. No blocking waiting for a message. This gives the best concurrency and scalability characteristics.

```csharp
// don’t forget to think about who is the sender (2nd argument)
target.Tell(message, Self);
```
The sender reference is passed along with the message and available within the receiving actor via its Sender property while processing this message. Inside of an actor it is usually Self who shall be the sender, but there can be cases where replies shall be routed to some other actor—e.g. the parent—in which the second argument to tell would be a different one. Outside of an actor and if no reply is needed the second argument can be null; if a reply is needed outside of an actor you can use the ask-pattern described next.

### Ask: Send-And-Receive-Future
The ask pattern involves actors as well as Tasks, hence it is offered as a use pattern rather than a method on ActorRef:

```csharp
var t = Task.Run(async () =>
{
    var t1 = actorA.Ask("request", TimeSpan.FromSeconds(1));
    var t2 = actorB.Ask("another request", TimeSpan.FromSeconds(5));

    await Task.WhenAll(t1, t2);

    return new Result(t1.Result, t2.Result);
});

t.PipeTo(actorC, Self);
```

This example demonstrates Ask together with the Pipe Pattern on Tasks, because this is likely to be a common combination. Please note that all of the above is completely non-blocking and asynchronous: Ask produces a Task, two of which are awaited until both are completed, and when that happens, a new Result object is forwarded to another actor.

Using Ask will send a message to the receiving Actor as with Tell, and the receiving actor must reply with  `Sender.Tell(reply, Self)` in order to complete the returned Task with a value. The Ask operation involves creating an internal actor for handling this reply, which needs to have a timeout after which it is destroyed in order not to leak resources; see more below.

>**Warning**<br/> To complete the Task with an exception you need send a Failure
message to the sender. This is not done automatically when an actor throws an
exception while processing a message.

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

If the actor does not complete the task, it will expire after the timeout period, specified as parameter to the Ask method, and the task will be cancelled and throw a `TaskCancelledException`.

For more information on Tasks, check out the [MSDN documentation](https://msdn.microsoft.com/en-us/library/dd537609(v=vs.110).aspx).

>**Warning**<br/>
When using task callbacks inside actors, you need to carefully avoid closing over the containing actor’s reference, i.e. do not call methods or access mutable state on the enclosing actor from within the callback. This would break the actor encapsulation and may introduce synchronization bugs and race conditions because the callback will be scheduled concurrently to the enclosing actor. Unfortunately there is not yet a way to detect these illegal accesses at compile time. See also: [[Actors and shared mutable state]]

### Forward message
You can forward a message from one actor to another. This means that the original sender address/reference is maintained even though the message is going through a 'mediator'. This can be useful when writing actors that work as routers, load-balancers, replicators etc. You need to pass along your context variable as well.

```csharp
target.Forward(result, Context);
```

## Reply to messages
If you want to have a handle for replying to a message, you can use Sender, which gives you an ActorRef. You can reply by sending to that ActorRef with Sender.Tell(replyMsg, Self). You can also store the ActorRef for replying later, or passing on to other actors. If there is no sender (a message was sent without an actor or task context) then the sender defaults to a 'dead-letter' actor ref.

```csharp
protected override void OnReceive(object message)
{
  var result = calculateResult();

  // do not forget the second argument!
  Sender.Tell(result, Self);
}
```