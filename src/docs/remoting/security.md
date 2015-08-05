---
layout: docs.hbs
title: Network Security
---

# Akka.Remote Security
This section is extremely brief - as of today there are no built-in secure transports in Akka.Remote. Security is a "do it yourself" exercise.

That being said, however, [Helios - the socket library that powers all of the transports in Akka.Remote](http://helios-io.github.io/ "Helios - Reactive socket middleware for .NET"), is working on plans to introduce [TLS](http://en.wikipedia.org/wiki/Transport_Layer_Security) and [DTLS](http://en.wikipedia.org/wiki/Datagram_Transport_Layer_Security) inside Helios 2.0, which will bring asymmetric encryption and secure sockets to Akka.Remote.

But in the meantime, we have to create our own security options around Akka.Remote.

## Application-Specific Security Techniques
Here in this section we will discuss a small number of techniques you can use to enforce different types of security functions within your Akka.Remote applications, including:

1. Private Networks and VPNs and
2. Restricting Messages to Local-only Senders.

> NOTE: The AkkaTime sample also includes examples of how to implement two-way symmetric encryption over the network, but it's complex and beyond the scope of this course.

### Secure the Network: Akka.Remote with Virtual Private Networks
The absolute best practice for securing remote Akka.NET applications today is to make the network around the applications secure - don't use public, open networks! Instead, use a private network to restrict machines that can contact Akka.Remote processes to ones who have your VPN credentials.

Some options for doing this:

* [OpenVPN](https://openvpn.net/) - for "do it yourself" environments;
* [Azure Virtual Networks](http://azure.microsoft.com/en-us/services/virtual-network/) - for Windows Azure customers; and
* [Amazon Virtual Private Cloud (VPC)](http://aws.amazon.com/vpc/) - for Amazon Web Services customers.
