const fs = require('fs')
const assert = require('assert')

const fuzzer = require('ot-fuzzer')
const { type } = require('../dist')
const genOp = require('./genOp')

const readOp = function(file) {
  const op = JSON.parse(file.shift()).map((c) =>
    typeof c === 'number' ? c
    : (c.i != null) ? c.i
    : {d:c.d.length}
  )

  return type.normalize(op)
}

const create = (input, expect) => {
  assert.deepEqual(type.create(input), expect)
}

const normalize = (input, expect) => {
  assert.deepEqual(type.normalize(input), expect)
}
  
const compose = (op1, op2, expect) => {
  assert.deepEqual(type.compose(op1, op2), expect)
}

const transform = function(op1, op2, expectLeft, expectRight) {
  expectRight = expectRight !== undefined ? expectRight : expectLeft
  
  assert.deepEqual(type.transform(op1, op2, 'left'), expectLeft)
  assert.deepEqual(type.transform(op1, op2, 'right'), expectRight)
}


describe('text', () => {
  describe('text-transform-tests.json', () => {
    it('should transform correctly', () => {
      const testData = fs.readFileSync(__dirname + '/text-transform-tests.json', 'utf8').split('\n')

      while (testData.length >= 4) {
        const op = readOp(testData)
        const otherOp = readOp(testData)
        const side = testData.shift()
        const expected = readOp(testData)

        const result = type.transform(op, otherOp, side)

        assert.deepEqual(result, expected)
      }
    })

    it('should compose without crashing', () => {
      const testData = fs.readFileSync(__dirname + '/text-transform-tests.json', 'utf8').split('\n')

      while (testData.length >= 4) {
        testData.shift()
        const op1 = readOp(testData)
        testData.shift()
        const op2 = readOp(testData)

        // nothing interesting is done with result... This test just makes sure compose runs
        // without crashing.
        const result = type.compose(op1, op2)
      }
    })
  })

  describe('#create()', () => {
    it('should return an empty string when called with no arguments', () => {
      create(undefined, '')
    })

    it('should return any string thats passed in', () => {
      create('', '')
      create('oh hi', 'oh hi')
    })

    it('throws when something other than a string is passed in', () => {
      assert.throws((() => type.create(123)), /must be a string/)
    })
  })

  it('should normalize sanely', () => {
    normalize([0], [])
    normalize([''], [])
    normalize([{d:0}], [])

    normalize([{d:2}], [{d:2}])
    normalize([1,1], [])
    normalize([2,0], [])
    normalize([1,1,'hi'], [2, 'hi'])
    normalize([{d:1}, {d:1},'hi'], [{d:2}, 'hi'])
    normalize(['a', 100], ['a'])
    normalize(['a', 'b'], ['ab'])
    normalize(['ab', ''], ['ab'])
    normalize([0, 'a', 0, 'b', 0], ['ab'])
    normalize(['a', 1, 'b'], ['a', 1, 'b'])
  })

  describe('emoji', () => {    
    it('compose insert', () => {
      compose(['👻'], [1, '🥰'], ['👻🥰'])
    })

    it('compose delete', () => {
      compose([1, 'a👻b'], [2, {d:1}], [1, 'ab'])
      compose([1, 'a👻b'], [3, {d:1}], [1, 'a👻'])
    })

    it('transform', () => {
      transform(['👻'], ['🥰'], ['👻'], [1, '👻'])
    })
  })

  describe('fuzzer found bugs', () =>
    it('compose does not consume too many items', () => {
      compose(['👻🥰💃'], [1, {d:1}], ['👻💃'])
    })
  )

  describe('#transformSelection()', () => {
    // This test was copied from https://github.com/josephg/libot/blob/master/test.c
    // 
    // TODO: Add unicode tests here.
    const doc = "abcdefghijklmnopqrstuvwxyz1234abcdefghijklmnopqrstuvwxyz1234"
    const ins = [10, "oh hi"]
    const del = [25, {d:20}]
    const op = [10, 'oh hi', 10, {d:20}] // The previous ops composed together

    const tc = (op, cursor, expected) => {
      assert.strictEqual(type.transformSelection(cursor, doc, op), expected)
      assert.deepStrictEqual(type.transformSelection([cursor, cursor], doc, op), [expected, expected])
    }
 
    it("shouldn't move a cursor at the start of the inserted text", () => tc(op, 10, 10))
  
    it('should move a character inside a deleted region to the start of the region', () => {
      tc(del, 25, 25)
      tc(del, 35, 25)
      tc(del, 45, 25)
    })
  
    it("shouldn't effect cursors before the deleted region", () => tc(del, 10, 10))
  
    it("pulls back cursors past the end of the deleted region", () => tc(del, 55, 35))
  
    it("works with more complicated ops", () => {
      tc(op, 0, 0)
      tc(op, 100, 85)
      tc(op, 11, 16)
  
      tc(op, 20, 25)
      tc(op, 30, 25)
      tc(op, 40, 25)
      tc(op, 41, 26)
    })

    it('considers an insert at the current position to be after the current cursor position', () => {
      tc(op, 10, 10)
    })
  })


  describe('randomizer', () => it('passes', function () {
    this.timeout(100000)
    this.slow(5000)

    fuzzer(type, genOp, 10000)
  }))
})

// And test the API.
require('./api')(type, genOp)

