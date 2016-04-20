---
layout: docs.hbs
title: Contributing
---
# Contributing

Akka persistence plugin gives a custom journal and snapshot store creator a built-in set of tests, which can be used to verify correctness of the implemented backend storage plugins. It's available through `Akka.Persistence.TestKit` package and uses [xUnit](http://xunit.github.io/) as the default test framework.