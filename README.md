# String.cooked proposal

**Champions:**

- Jamie Kyle (Rome)
- Hemanth HM 

**Authors:**

- Darien Maillet Valentine

**Stage:** 1 ([Tracking Issue](https://github.com/bathos/proposal-string-cooked/issues/3))

> You can browse the [ecmarkup output](https://tc39.es/proposal-string-cooked/)
or browse the [source](https://github.com/bathos/proposal-string-cooked/blob/HEAD/spec.emu).

## Overview

This proposes a new static String method like `String.raw` but which
concatenates the “cooked” (escaped string value) strings rather than the raw
strings — the same behavior as that of an untagged template literal.

```js
String.raw`consuming \u0072aw or undercooked strings may increase your risk of stringborne illness`;
// → "consuming \u0072aw or undercooked strings may increase your risk of stringborne illness"

String.cooked`mmm ... \u0064elicious cooked string`;
// → "mmm ... delicious cooked string"
```

This can be used to simplify the creation of new template string tags:

```js
function myTag(strings, ...values) {
  return String.cooked(strings, ...values.map(value => String(value).toUpperCase())
}

myTag`hello ${'world'}` // "hello WORLD"
```

## Motivation

Many template tags are interested in some kind of preprocessing of either the
“cooked” string values, the substitution values, or both — but ultimately they
may still want to perform the “default” concatenation behavior after this
processing.

This can be achieved today in at least two ways:

1. Implementing the “zip-like” concatenation behavior for the string values and
   substitution values “manually”.
2. Delegating to `String.raw`.

The latter is very attractive; it’s the only exposed way to get something that
_looks like_ the “default” behavior. That it’s actually different is not super
obvious because for most input strings people are likely to test the output will
be the same; the difference isn’t apparent unless you feed it literal segments
which contain escape sequences (or “uncookable” escape-like sequences). The
combination of `raw` being present and no counterpart for the “cooked” behavior
being present creates a sort of pit-of-failure.

Delegating to `raw` is possible — but it requires passing the cooked strings _as
if_ they were raw strings, i.e. `String.raw({ raw: strs }, ...subs)` instead of
`String.raw(strs, ...subs)`. Though this works, the indirection is confusing;
there aren’t any “real” raw string values in play here.

> It may also be tempting for folks to use `String.raw` as if it were a true
> identity function for other reasons, as can be seen in
> [this Twitter post](https://twitter.com/wcbytes/status/1430271001632415745).
> Again, it seems pretty understandable why folks might see the _one_ built-in
> tag and assume that it’s what they’re looking for, but hopefully with `cooked`
> present as well, the distinction being made will become more apparent.

## Use cases

The primary use case is to serve as a final step in custom template tags which
perform some kind of mapping over input. For example, consider a tag which is
meant to escape URL path segments in such a way that they round trip (i.e., any
`/`, `?`, and `#` characters in the interpolated portions get percent-encoded):

```js
function safePath(strings, ...subs) {
  return String.cooked(strings, ...subs.map(sub => encodeURIComponent(sub)));
}

let id = 'spottie?';

safePath`/cats/${ id }`;

// → "/cats/spottie%3F"
```

In other words, although it has the signature of a template tag function, it is
mainly expected to facilitate building other template tags without needing to
reimplement the usual string/substitution concatenation logic.

As a tag in its own right, it acts like the template tag equivalent of the
identity function, which may also help with usage patterns like the example
linked to earlier where the user wished to use template tags to provide a signal
to their editor that the content should be interpreted as HTML. Some compilation
or preprocessing tools may also benefit from that, e.g. Prettier singles out the
tags with the binding “html” for different string transformation.

## Q&A

### Should the name be “cooked”?

Not sure! This is an initial proposal. Feedback about whether this name
is intuitive and clear would be helpful. The term does have a history of usage
in discussion contexts (ES Discuss, etc) as the counterpart for “raw,” but it
has not appeared in any spec text or API surface to date as far as I know.

### What is the behavior if `undefined` is encountered when reading properties from the first argument object?

The tentatively proposed behavior is that if `undefined` is returned when
reading one of the index-keyed properties, a `TypeError` is thrown. For any
other value type, ordinary `ToString` conversion is attempted.

This is because (assuming the first argument is a “real” template array object)
`undefined` appearing indicates that the raw segment source contained
[NotEscapeSequence](https://tc39.es/ecma262/#prod-NotEscapeSequence), i.e.
it is a template which has a raw value but _does not have_ a cooked value. If
such a template literal is _untagged,_ a `SyntaxError` would be thrown (though
that would likely not be appropriate for an evaluation-time API, hence use of
`TypeError` instead).

Arguably it could instead throw for any non-String value (unidiomatic) or it
could not throw for `undefined`. The rationale for the currently proposed
behavior is that it aims to balance footgun prevention with other ergonomics
concerns.
