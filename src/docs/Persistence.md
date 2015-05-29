---
layout: docs.hbs
title: Persistence
---
## Persistence

Akka.Persistence plugin enables the creation of stateful actors whose internal state may be stored inside persistent data storage and used for recovery in case of restart, migration or VM crash. The core concept behind Akka persistence lays in storing not only the actor's state directly (in the form of snapshots) but also history of all of the changes of that actor's state. This is quite  useful solution common in patterns such as eventsourcing. Changes are immutable by nature, as they describe facts already reported in the history, and can be stored inside event journal in append-only mode. While recovering, the actor restores it's state from the latests snapshot available - which can reduce recovery time - and then recreates it further by replaying events stored inside the journal. Among other features provided by the persistence plugin is support for command query segregation model and point-to-point communication with [at-least-once](concepts/message-delivery-reliability#discussion-what-does-at-most-once-mean-) delivery semantics.

### Architecture

Akka.Persistence features are available through new set of actor base classes:

- `PersistentActor` is a persistent, stateful equivalent of the `ActorBase` class. It's able to persist events inside the journal, creating snapshots in snapshot stores and recover from them in a  thread-safe manner. It can be used for both changing and reading state of the actor.
- `PersistentView` is used to recreate the internal state of other persistent actor based on journaled messages. It works in a read-only manner - it cannot journal any event by itself.
- `GuaranteedDeliveryActor` may be used to ensure [at-least-once](concepts/message-delivery-reliability#discussion-what-does-at-most-once-mean-) delivery semantics between communicating actors, even in case when either sender or receiver VM crashes.
- `Journal` stores a sequence of events send by the persistent actor. The storage backend of the journal is pluggable. By default it uses an in-memory message stream and is NOT a persistent storage.
- `Snapshot store` is used to persist snapshots of either persistent actor's or view's internal state. They can be used to reduce recovery times in case when a lot of events needs to be replayed for specific persistent actor. Storage backend of the snapshot store is pluggable. By default it uses local file system.

### Persistent actors

Unlike the default `ActorBase` class, `PersistentActor` and it's derivatives requires the setup of a few more additional members:

- `PersistenceId` is a persistent actor's identifier that doesn't change across different actor incarnations. It's used to retrieve an event stream required by the persistent actor to recover it's internal state.
- `ReceiveRecover` is a method invoked during an actor's recovery cycle. Incoming objects may be user-defined events as well as system messages, for example `SnapshotOffer` which is used to deliver latest actor state saved in the snapshot store.
- `ReceiveCommand` is an equivalent of the basic `Receive` method of default Akka.NET actors.

Persistent actors also offer a set of specialized members:

- `Persist` and `PersistAsync` methods can be used to send events to the event journal in order to store them inside. The second argument is a callback invoked when the journal confirms that events have been stored successfully.
- `Defer` and `DeferAsync` are used to perform various operations *after* events will be persisted and their callback handlers will be invoked. Unlike the persist methods, defer won't store an event in persistent storage. Defer methods may NOT be invoked in case when the actor is restarted even though the journal will successfully persist events sent.
- `DeleteMessages` will order attached journal to remove part of it's events. It can be either logical deletion - messages are marked as deleted, but are not removed physically from the backend storage - or a physical one, when the messages are removed physically from the journal.
- `LoadSnapshot` will send a request to the snapshot store to resend the current actor's snapshot.
- `SaveSnapshot` will send the current actor's internal state as a snapshot to be saved by the configured snapshot store.
- `DeleteSnapshot` and `DeleteSnapshots` methods may be used to specify snapshots to be removed from the snapshot store in cases where they are no longer needed.
- `OnReplaySuccess` is a virtual method which will be called when the recovery cycle ends successfully.
- `OnReplayFailure` is a virtual method which will be called when the recovery cycle fails unexpectedly from some reason.
- `IsRecovering` property determines if the current actor is performing a recovery cycle at the moment.
- `SnapshotSequenceNr` property may be used to determine the sequence number used for marking persisted events. This value changes in a monotonically increasing manner.

In case a manual recovery cycle initialization is necessary, it may be invoked by sending a `Recover` message to a persistent actor.

### Persistent views

While a persistent actor may be used to produce and persist events, views are used only to read internal state based on them. Like the persistent actor, a view has a `PersistenceId` to specify a  collection of events to be resent to current view. This value should however be correlated with the  `PersistentId` of an actor who is the producer of the events.

Other members:

- `ViewId` property is a view unique identifier that doesn't change across different actor incarnations. It's useful in cases where there are multiple different views associated with a single persistent actor, but showing its state from a different perspectives.
- `IsAutoUpdate` property determines if the view will try to automatically update its state in specified time intervals. Without it, the view won't update its state until it receives an explicit `Update` message. This value can be set through configuration with *akka.persistence.view.auto-update* set to either *on* (by default) or *off*.
- `AutoUpdateInterval` specifies a time interval in which the view will be updating itself - only in cases where the *IsAutoUpdate* flag is on. This value can be set through configuration with *akka.persistence.view.auto-update-interval* key (5 seconds by default).
- `AutoUpdateReplayMax` property determines the maximum number of events to be replayed during a single *Update* cycle. This value can be set through configuration with *akka.persistence.view.auto-update-replay-max* key (by default it's -1 - no limit).
- `LoadSnapshot` will send a request to the snapshot store to resend a current view's snapshot.
- `SaveSnapshot` will send the current view's internal state as a snapshot to be saved by the  configured snapshot store.
- `DeleteSnapshot` and `DeleteSnapshots` methods may be used to specify snapshots to be removed from the snapshot store in cases where they are no longer needed.

### Guaranteed delivery

Guaranteed delivery actors are specializations of persistent actors and may be used to provide [at-least-once](concepts/message-delivery-reliability#discussion-what-does-at-most-once-mean-) delivery semantics, even in cases where one of the communication endpoints crashes. Because it's possible that the same message will be send twice, actor's receive behavior must work in the idempotent manner.

Members:

- `Deliver` method is used to send a message to another actor in [at-least-once](concepts/message-delivery-reliability#discussion-what-does-at-most-once-mean-) delivery semantics. A message sent this way must be confirmed by the other endpoint with the  `ConfirmDelivery` method. Otherwise it will be resent again and again until the redelivery limit is reached.
- `GetDeliverySnapshot` and `SetDeliverySnapshot` methods are used as part of a delivery snapshotting strategy. They return/reset state of the current guaranteed delivery actor's unconfirmed messages. In order to save custom deliverer state inside a snapshot, a returned delivery snapshot should be included in that snapshot and reset in *ReceiveRecovery* method, when `SnapshotOffer` arrives.
- `RedeliveryBurstLimit` is a virtual property which determines the maximum number of unconfirmed messages to be send in each redelivery attempt. It may be useful in preventing message overflow scenarios. It may be overridden or configured inside HOCON configuration under *akka.persistence.at-least-once-delivery.redelivery-burst-limit* path (10 000 by default).
- `UnconfirmedDeliveryAttemptsToWarn` is a virtual property which determines how many unconfirmed deliveries may be sent before guaranteed delivery actor will send an `UnconfirmedWarning` message to itself. The count is reset after the actor's restart. It may be overridden or configured inside HOCON configuration under *akka.persistence.at-least-once-delivery.warn-after-number-of-unconfirmed-attempts* path (5 by default).
- `MaxUnconfirmedMessages` is a virtual property which determines the maximum number of unconfirmed deliveries to hold in memory. After this threshold is exceeded, any `Deliver` method will raise `MaxUnconfirmedMessagesExceededException`. It may be overridden or configured inside HOCON configuration under *akka.persistence.at-least-once-delivery.max-unconfirmed-messages* path (100 000 by default).
- `UnconfirmedCount` property shows the number of unconfirmed messages.

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

### Contributing

Akka persistence plugin gives a custom journal and snapshot store creator a built-in set of tests, which can be used to verify correctness of the implemented backend storage plugins. It's available through `Akka.Persistence.TestKit` package and uses [xUnit](http://xunit.github.io/) as the default test framework.
