// Tests for the text types using the DSL interface. This includes the standard
// text type as well as text-tp2 (and any other text types we add). Rich text
// should probably support this API too.

const assert = require('assert')
const {randomInt, randomReal, randomWord} = require('ot-fuzzer')

module.exports = (type, genOp) => describe(`text api for '${type.name}'`, () => {
  if (!type.api.provides.text) throw 'Type does not claim to provide the text api'

  beforeEach(() => {
    // This is a little copy of the context structure created in client/doc.
    // It would probably be better to copy the code, but whatever.

    this.snapshot = type.create()
    const getSnapshot = () => this.snapshot
    const submitOp = (op, callback) => {
      op = type.normalize(op)
      this.snapshot = type.apply(this.snapshot, op)
      if (typeof callback === 'function') {
        callback()
      }
    }

    this.ctx = type.api(getSnapshot, submitOp)

    this.apply = function(op) {
      if (typeof this.ctx._beforeOp === 'function') {
        this.ctx._beforeOp(op)
      }
      submitOp(op)
      this.ctx._onOp(op)
    }
  })

  it('has no length when empty', () => {
    assert.strictEqual(this.ctx.get(), '')
    assert.strictEqual(this.ctx.getLength(), 0)
  })

  it('works with simple inserts and removes', () => {
    this.ctx.insert(0, 'hi')
    assert.strictEqual(this.ctx.get(), 'hi')
    assert.strictEqual(this.ctx.getLength(), 2)

    this.ctx.insert(2, ' mum')
    assert.strictEqual(this.ctx.get(), 'hi mum')
    assert.strictEqual(this.ctx.getLength(), 6)

    this.ctx.remove(0, 3)
    assert.strictEqual(this.ctx.get(), 'mum')
    assert.strictEqual(this.ctx.getLength(), 3)
  })

  it('gets edited correctly', () => {
    // This is slow with text-tp2 because the snapshot gets filled with crap and
    // basically cloned with every operation in apply(). It could be fixed at
    // some point by making the document snapshot mutable (and make apply() not
    // clone the snapshot).
    //
    // If you do this, you'll also have to fix text-tp2.api._onOp. It currently
    // relies on being able to iterate through the previous document snapshot to
    // figure out what was inserted & removed.
    let content = ''

    for (let i = 1; i <= 1000; i++) {
      var pos
      if ((content.length === 0) || (randomReal() > 0.5)) {
        // Insert
        pos = randomInt(content.length + 1)
        const str = randomWord() + ' '
        this.ctx.insert(pos, str)
        content = content.slice(0, pos) + str + content.slice(pos)
      } else {
        // Delete
        pos = randomInt(content.length)
        const len = Math.min(randomInt(4), content.length - pos)
        this.ctx.remove(pos, len)
        content = content.slice(0, pos) + content.slice((pos + len))
      }

      assert.strictEqual(this.ctx.get(), content)
      assert.strictEqual(this.ctx.getLength(), content.length)
    }
  })

  return it.skip('emits events correctly', () => {
    let contents = ''

    this.ctx.onInsert = (pos, text) => {
      contents = contents.slice(0, pos) + text + contents.slice(pos)
    }
    this.ctx.onRemove = (pos, len) => {
      contents = contents.slice(0, pos) + contents.slice((pos + len))
    }

    for (let i = 1; i <= 1000; i++) {
      const [op, newDoc] = genOp(this.snapshot)

      this.apply(op)
      assert.strictEqual(this.ctx.get(), contents)
    }
  })
})
