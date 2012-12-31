If there's one thing that has always made me annoyed running a web hosting and
services business it was the low level details of configuring virtual hosts in
Apache and every other web server on the planet.

It's all scriptable, but it's error prone and completely graceless.

Users want to be able to define their own rules.

Apache configuration syntax, when included, can break the entire configuration.
It's not dynamic. Reloads in a hot web server can be expensive.

Ngingx and Lighttpd are marginally more consistent, but still stink at delegating.

Configurations are sometimes order-dependent, sometimes evaluated root to leaf
node, sometimes leaf node to root, and sometimes require recursing into the
request handler to make decisions based on on "what if" scenarios.

I'd willingly trade a lot of power in configuring a web server for something
simple and able to be delegated to users.

There are some basic requirements:

* Ability to configure redirects (and custom responses) for specific URLs and
  for entire subtrees of URL space. (I'm of the opinion that this should often
  not be handled at the application layer, since it's most often needed to deal
  with changes to URL structure during application upgrades and transitions.)
* Ability to map URLs to handlers located within the document root, without
  exposing the filenames of those handlers. (Thank you, PHP, for moving us
  backward 5 years in URL structure in an effort to teach us how simple
  deployment should be.)
* The ability to direct entire subtrees to a handler.
* The ability to direct entire subtrees to a handler if the request is not
  satisfiable with a url-to-path mapping.
* The ability to direct requests to a handler if url-to-path mapping yields a
  file with a particular suffix (or perhaps indirectly via MIME type)
* The ability to tweak url-to-path mapping if url-to-path mapping yields a
  directory.
* The ability to add a variable passed on to a handler at any point in the
  subtrees of URL space, including setting it to a value from any part of the
  request headers, including a fragment of the URL.

And operationally, I want to be able to delegate the configuration of entire
virtual hosts and preferably also subtrees of URL space to users, and have them
only able to break the parts delegated to them.

Non-goals:

* Mapping a request to a handler in a way that depends on which handler would
  be selected by any other request.
* Arbitrary rewrites.
* Delegating on paths looked up by url-to-path mapping.
