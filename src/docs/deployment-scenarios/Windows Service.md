---
layout: docs.hbs
title: Windows Service deployment scenario
---
# Windows Service

For windows service deployment its recommended to use
[TopShelf](http://topshelf.readthedocs.org/en/latest/index.html)
to build your Windows Services. It radically simplifies hosting Windows Services.

The quickest way to get started with TopShelf is by creating a Console
Application. Which would look like this:

#### Program.cs
```csharp
using Akka.Actor;
using Topshelf;
```
```csharp
class Program
{
    static void Main(string[] args)
    {
        HostFactory.Run(x =>
        {
            x.Service<MyActorService>(s =>
            {
                s.ConstructUsing(n => new MyActorService());
                s.WhenStarted(service => service.Start());
                s.WhenStopped(service => service.Stop());
                //continue and restart directives are also available
            });

            x.RunAsLocalSystem();
            x.UseAssemblyInfoForServiceInfo();
        });
    }
}

/// <summary>
/// This class acts as an interface between your application and TopShelf
/// </summary>
public class MyActorService
{
    private ActorSystem mySystem;

    public void Start()
    {
        //this is where you setup your actor system and other things
        mySystem = ActorSystem.Create("MySystem");
    }

    public async void Stop()
    {
        //this is where you stop your actor system
        await mySystem.Terminate();
    }
}
```

The above example is the simplest way imaginable. However there are also other
styles of integration with TopShelf that give you more control.

Installing with Topshelf is as easy as calling `myConsoleApp.exe install` on
the command line.

For all the options and settings check out their
[docs](http://topshelf.readthedocs.org/en/latest/index.html).
