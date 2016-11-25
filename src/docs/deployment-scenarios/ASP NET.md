---
layout: docs.hbs
title: ASP.Net deployment scenario
---

# ASP.NET

### Creating the Akka.NET resources

Hosting inside an ASP.NET application is easy. The Global.asax would be the designated place to start.

```csharp
public class MvcApplication : System.Web.HttpApplication
{
    protected static ActorSystem ActorSystem;
    //here you would store your toplevel actor-refs
    protected static IActorRef MyActor;

    protected void Application_Start()
    {
        //your mvc config. Does not really matter if you initialise
        //your actor system before or after

        ActorSystem = ActorSystem.Create("app");
        //here you would register your toplevel actors
        MyActor = ActorSystem.ActorOf<MyActor>();
    }
}
```

As you can see the main point here is keeping a static reference to your `ActorSystem` . This ensures it won't be accidentally garbage collected and gets disposed and created with the start and stop events of your web application. 

>**Warning**<br>Although hosting inside an ASP.NET Application is easy. A **word of caution**: When you are hosting inside of `IIS` the applicationpool your app lives in could be stopped and started at the whim of `IIS`. This in turn means your `ActorSystem` could be stopped at any given time.

Typically you use a very lightweight `ActorSystem` inside ASP.NET applications, and offload heavy-duty work to a seperate Windows Service via Akka.Remote / Akka.Cluster

### Interaction between Controllers and Akka.NET
In the sample below, we use an Web API Controller:
```csharp
public class SomeController  : ApiController
{
      //expose your endpoint as async
      public async Task<SomeResult> Post(SomeRequest someRequest)
      {
           //send a message based on your incoming arguments to one of the actors you created earlier
           //and await the result by sending the message to `Ask`
           var result = await MvcApplication.MyActor.Ask<SomeResult>(new SomeMessage(someRequest.SomeArg1,someRequest.SomeArg2));
           return result;
      }
}
```
