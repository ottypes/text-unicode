## Notes on Compose

This is surprising, but the compose function in this library is not closed under transform.

By that I mean, if you have some document history:

    history = [a, b, c]

And you have a new operation X which was concurrent with that history, the obvious way to transform X is like this:

```javascript
for (const op of history) {
  x = type.transform(x, op, 'right')
}
// or x = history.reduce((a, b) => type.transform(a, b, 'right'), x)
```

But, seeing compose, you might be tempted to be clever, and do this instead:

```javascript
const flatHistory = history.reduce(type.compose)
x = type.transform(x, flatHistory, 'right')
```

This is unsound. Which is to say, this will work *most of the time* but not *all of the time*.

More formally:

    There exist changes [a] and [b0, b1] where:

    transform(a, b0 + b1) != transform(a, b0) + transform(a', b1)

    given:
      a' = transform(a, b0)
      (+) = compose

You can test this yourself for any OT type using [this gist](https://gist.github.com/josephg/aa26cf2e8ed4199466be26db630a0899). This small fuzzer can also be used to find example cases where this property doesn't hold.


### Why not? Can you give me an example?

Sure. With this library, consider these three histories:

```javascript
const di = type.compose([{d:1}], ['x']) // Delete then Insert
const id0 = type.compose(['x'], [1, {d:1}]) // Insert before then delete
const id1 = type.compose([1, 'x'], [{d:1}]) // Insert after then delete
```

Each of these histories has different properties under transform.

For this I'll define "ambiguous" concurrent inserts as inserts where the resulting order is chosen arbitrarily, using left / right fields. And unambiguous inserts are inserts where the order is always fixed.

Given that, this is what we expect to happen:

```javascript
assertAmbig(di, ['y'])
assertAmbig(di, [1, 'y'])

assertAmbig(id0, ['y'])
assertUnAmbig(id0, [1, 'y'])

assertUnAmbig(id1, ['y'])
assertAmbig(id1, [1, 'y'])
```

(We can test for ambiguity like this:)

```javascript
const assertAmbig = (a, b) => assert.notDeepStrictEqual(
  type.transform(a, b, 'left'),
  type.transform(a, b, 'right')
)

const assertUnAmbig = (a, b) => assert.deepStrictEqual(
  type.transform(a, b, 'left'),
  type.transform(a, b, 'right')
)
```

---

So I thought, couldn't you add a special "replace" operation to disambiguate between the `di` case and the others? Collapsing time together creates the problem. Could we mark that differently from the others?

Sadly, I don't think so. The problem then comes from how replaces should themselves be composed together. Consider this awful case:

```javascript
evil = [
  [2, {d:2}],
  [2, 'aa'],
  [{d:2}],
  ['bb']
]
```

If we transform operations against that:

```javascript
xfLeft = (op) => evil.reduce((a, b) => type.transform(a, b, 'left'), op)
xfRight = (op) => evil.reduce((a, b) => type.transform(a, b, 'right'), op)
```

Then all inserts by the left user slide all the way to the left:

```javascript
xfLeft(['x']) // ['x']
xfLeft([4, 'x']) // ['x']
```

But its asymmetric. Inserts by the right user don't slide all the way to the right:

```javascript
xfRight(['x']) // [ 2, 'x' ]
xfRight([4, 'x']) // [ 4, 'x' ]
```

So I give up. Transform here is not closed under compose(). If you want that property, see [ot-text-tp2](https://github.com/ottypes/text-tp2) or [use a CRDT](https://github.com/josephg/diamond-types).