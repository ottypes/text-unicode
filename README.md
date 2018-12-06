# The Plaintext OT Type

This OT type can be used to edit plaintext documents, like sourcecode or
markdown.

For documentation on the API spec this type implements, see [ottypes/docs](/ottypes/docs).

## Spec

The plaintext OT type thinks of the document as a giant unicode string, and
edits index unicode characters in the string. This is different from most text
editors, which break up a document into an array of lines. For small documents
on modern computers, the conversion isn't particularly expensive. However, if
you have giant documents you should be using a rope library like
[jumprope](https://github.com/josephg/jumprope) or
[librope](https://github.com/josephg/librope).

Each operation describes a traversal over the document. The traveral can edit
the document as it goes.

For example, given the document:

```
"ABCDEFG"
```

You could apply the operation

```
[1, ' hi ', 2, {d:3}]
```

This operation will skip the first character (1), insert ' hi ', skip 2 more
characters then delete the next 3 characters. The result would be:

```
"A hi BCG"
```

### Operations

Operations are lists of components, which move along the document. Each
component is one of

- **Number N**: Skip forward *N* characters in the document
- **"str"**: Insert *"str"* at the current position in the document
- **{d:N}**: Delete *N* characters at the current position in the document

The operation does not have to skip the last characters in the document.

### Selections

The text type also has methods for manipulating selections.

Selection ranges are either a single number (the cursor position) or a pair of
[anchor, focus] numbers (aka [start, end]) of the selection range. Be aware
that end can be before start.


# Other implementations

I have compatible implementations of this OT type in:

- [C](https://github.com/share/libot/blob/master/text.h). This implementation is insanely fast (~20M transforms / second on my old laptop, not that that will ever be a bottleneck.)
- [Rust](https://github.com/josephg/textot.rs). This code is much less mature, but far more concise and beautiful than the C or JS implementations.

---

# Commentary

This is the 4th iteration of ShareJS's plaintext type.


The [first
iteration](https://github.com/share/ShareJS/blob/0.6/src/types/text2.coffee)
was similar, except it is invertable. Invertability is nice, but I want to
eventually build an arbitrary P2P OT system, and in a p2p setting
invertibillity becomes impractical to achieve. I don't want systems to depend
on it.

The second iteration made each component specify a location and an edit there.
Operations were lists of these edits. Because the components were not sorted,
if you transform two big operations by one another it requires M\*N
time to transform. The components could be sorted to fix this, but if you're
going to do that you may as well just make them sorted by design - which is
what the current text implementation does. I thought the individual edits style
was better because I expected it to be simpler, but when I implemented it I
found the implementation of each method was almost identical in size.

The [3rd iteration](https://github.com/ottypes/text) is 99% identical to this
codebase, except it used UTF16 word offsets instead of unicode codepoints.
This implementation considers emoji 🤸🏼‍♀️ as 1 character. ottypes/text
considers that as 2 characters instead, because it takes a pair of UTF16
values to store (`"🤓".length === 2` in javascript). This makes it awkward to
build cross-platform OT systems spanning platforms which don't accept use JS's
awkward unicode encoding.

---

# License

All code contributed to this repository is licensed under the standard MIT license:

Copyright 2011 ottypes library contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following condition:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.



