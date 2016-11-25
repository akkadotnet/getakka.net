---
layout: docs.hbs
title: Persistence FSM
---
# Persistence FSM

`PersistentFSM` handles the incoming messages in an FSM like fashion. Its internal state is persisted as a sequence of changes, later referred to as domain events. Relationship between incoming messages, FSM's states and transitions, persistence of domain events is defined by a DSL.

> **Warning** PersistentFSM is marked as “experimental".

To demonstrate the features of the `PersistentFSM` class, consider an actor which represents a Web store customer. The contract of our "`WebStoreCustomerFSMActor`" is that it accepts the following commands:

```C#
public interface ICommand
{
}

public class AddItem : ICommand
{
    public AddItem(Item item)
    {
        Item = item;
    }

    public Item Item { get; set; }
}

public class Buy : ICommand
{
}

public class Leave : ICommand
{
}

public class GetCurrentCart : ICommand
{
}
```

`AddItem` sent when the customer adds an item to a shopping cart `Buy` - when the customer finishes the purchase `Leave` - when the customer leaves the store without purchasing anything `GetCurrentCart` allows to query the current state of customer's shopping cart

The customer can be in one of the following states:
```C#
public enum UserState
{
    Shopping,
    Inactive,
    Paid,
    LookingAround
}
```
`LookingAround` customer is browsing the site, but hasn't added anything to the shopping cart `Shopping` customer has recently added items to the shopping cart `Inactive` customer has items in the shopping cart, but hasn't added anything recently `Paid` customer has purchased the items

Customer's actions are "recorded" as a sequence of "domain events" which are persisted. Those events are replayed on an actor's start in order to restore the latest customer's state:

```C#
public interface IDomainEvent
{
}

public class ItemAdded : IDomainEvent
{
    public ItemAdded(Item item)
    {
        Item = item;
    }

    public Item Item { get; set; }
}

public class OrderExecuted : IDomainEvent
{
}

public class OrderDiscarded : IDomainEvent
{
}
```

Customer state data represents the items in a customer's shopping cart:

```C#
public class Item
{
    public Item(string id, string name, double price)
    {
        Id = id;
        Name = name;
        Price = price;
    }

    public string Id { get; set; }

    public string Name { get; set; }

    public double Price { get; set; }
}
 
public interface IShoppingCart
{
    ICollection<Item> Items { get; set; }

    IShoppingCart AddItem(Item item);

    IShoppingCart Empty();
}

public class EmptyShoppingCart : IShoppingCart
{
    public IShoppingCart AddItem(Item item)
    {
        return new NonEmptyShoppingCart(item);
    }

    public IShoppingCart Empty()
    {
        return this;
    }

    public ICollection<Item> Items { get; set; }
}

public class NonEmptyShoppingCart : IShoppingCart
{
    public NonEmptyShoppingCart(Item item)
    {
        Items = new List<Item>();
        Items.Add(item);
    }

    public IShoppingCart AddItem(Item item)
    {
        Items.Add(item);
        return this;
    }

    public IShoppingCart Empty()
    {
        return new EmptyShoppingCart();
    }

    public ICollection<Item> Items { get; set; }
}
```

Side-effects:
```C#
internal interface IReportEvent
{
}

internal class PurchaseWasMade : IReportEvent
{
}

internal class ShoppingCardDiscarded : IReportEvent
{
}
```

Here is how everything is wired together:
```C#
StartWith(UserState.LookingAround, new EmptyShoppingCart());

When(UserState.LookingAround, (e, state) =>
{
    if (e.FsmEvent is AddItem)
    {
        var addItem = (AddItem)e.FsmEvent;
        return
            GoTo(UserState.Shopping)
                .Applying(new ItemAdded(addItem.Item))
                .ForMax(TimeSpan.FromSeconds(1));
    }

    if (e.FsmEvent is GetCurrentCart)
    {
        return Stay().Replying(e.StateData);
    }

    return state;
});

When(UserState.Shopping, (e, state) =>
{
    if (e.FsmEvent is AddItem)
    {
        var addItem = (AddItem)e.FsmEvent;
        return Stay().Applying(new ItemAdded(addItem.Item)).ForMax(TimeSpan.FromSeconds(1));
    }

    if (e.FsmEvent is Buy)
    {
        return
            GoTo(UserState.Paid)
                .Applying(new OrderExecuted())
                .AndThen(cart =>
                {
                    if (cart is NonEmptyShoppingCart)
                    {
                        _reportActor.Tell(new PurchaseWasMade());
                    }
                });
    }

    if (e.FsmEvent is Leave)
    {
        return
            Stop()
                .Applying(new OrderDiscarded())
                .AndThen(cart => _reportActor.Tell(new ShoppingCardDiscarded()));
    }

    if (e.FsmEvent is GetCurrentCart)
    {
        return Stay().Replying(e.StateData);
    }

    if (e.FsmEvent is StateTimeout)
    {
        return GoTo(UserState.Inactive).ForMax(TimeSpan.FromSeconds(2));
    }

    return state;
});

When(UserState.Inactive, (e, state) =>
{
    if (e.FsmEvent is AddItem)
    {
        var addItem = (AddItem)e.FsmEvent;
        return
            GoTo(UserState.Shopping)
                .Applying(new ItemAdded(addItem.Item))
                .ForMax(TimeSpan.FromSeconds(1));
    }

    if (e.FsmEvent is GetCurrentCart)
    {
        return
            Stop()
                .Applying(new OrderDiscarded())
                .AndThen(cart => _reportActor.Tell(new ShoppingCardDiscarded()));
    }

    return state;
});

When(UserState.Paid, (e, state) =>
{
    if (e.FsmEvent is Leave)
    {
        return Stop();
    }

    if (e.FsmEvent is GetCurrentCart)
    {
        return Stay().Replying(e.StateData);
    }

    return state;
});
```
> Note: State data can only be modified directly on initialization. Later it's modified only as a result of applying domain events. Override the `ApplyEvent` method to define how state data is affected by domain events, see the example below

```C#
protected override IShoppingCart ApplyEvent(IDomainEvent e, IShoppingCart data)
{
    if (e is ItemAdded)
    {
        var itemAdded = (ItemAdded)e;
        return data.AddItem(itemAdded.Item);
    }

    if (e is OrderExecuted)
    {
        return data;
    }

    if (e is OrderDiscarded)
    {
        return data.Empty();
    }

    return data;
}
```
