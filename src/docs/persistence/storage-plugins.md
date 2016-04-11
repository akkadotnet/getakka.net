---
layout: docs.hbs
title: Storage plugins
---
# Storage plugins

## Journals

Journal is a specialized type of actor which exposes an API to handle incoming events and store them in backend storage. By default Akka.Persistence uses a `MemoryJournal` which stores all events in memory and therefore it's not persistent storage. A custom journal configuration path may be specified inside *akka.persistence.journal.plugin* path and by default it requires two keys set: *class* and *plugin-dispatcher*. Example configuration:

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

## Snapshot store

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
