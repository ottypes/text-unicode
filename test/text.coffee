# Tests for the ShareDB compatible text type.

fs = require 'fs'
assert = require 'assert'

fuzzer = require 'ot-fuzzer'
type = require('../dist').type
genOp = require './genOp'

readOp = (file) ->
  op = for c in JSON.parse file.shift()
    if typeof c is 'number'
      c
    else if c.i?
      c.i
    else
      {d:c.d.length}

  type.normalize op

compose = (op1, op2, expect) -> assert.deepEqual type.compose(op1, op2), expect
transform = (op1, op2, expectLeft, expectRight) ->
  expectRight = if expectRight != undefined then expectRight else expectLeft
  assert.deepEqual type.transform(op1, op2, 'left'), expectLeft
  assert.deepEqual type.transform(op1, op2, 'right'), expectRight


describe 'text', ->
  describe 'text-transform-tests.json', ->
    it 'should transform correctly', ->
      testData = fs.readFileSync(__dirname + '/text-transform-tests.json').toString().split('\n')

      while testData.length >= 4
        op = readOp testData
        otherOp = readOp testData
        side = testData.shift()
        expected = readOp testData

        result = type.transform op, otherOp, side

        assert.deepEqual result, expected

    it 'should compose without crashing', ->
      testData = fs.readFileSync(__dirname + '/text-transform-tests.json').toString().split('\n')

      while testData.length >= 4
        testData.shift()
        op1 = readOp testData
        testData.shift()
        op2 = readOp testData

        # nothing interesting is done with result... This test just makes sure compose runs
        # without crashing.
        result = type.compose(op1, op2)

  describe '#create()', ->
    it 'should return an empty string when called with no arguments', ->
      assert.strictEqual '', type.create()
    it 'should return any string thats passed in', ->
      assert.strictEqual '', type.create ''
      assert.strictEqual 'oh hi', type.create 'oh hi'
    it 'throws when something other than a string is passed in', ->
      assert.throws (-> type.create 123), /must be a string/

  it 'should normalize sanely', ->
    assert.deepEqual [], type.normalize [0]
    assert.deepEqual [], type.normalize ['']
    assert.deepEqual [], type.normalize [{d:0}]

    assert.deepEqual [{d:2}], type.normalize [{d:2}]
    assert.deepEqual [], type.normalize [1,1]
    assert.deepEqual [], type.normalize [2,0]
    assert.deepEqual [2, 'hi'], type.normalize [1,1,'hi']
    assert.deepEqual [{d:2}, 'hi'], type.normalize [{d:1}, {d:1},'hi']
    assert.deepEqual ['a'], type.normalize ['a', 100]
    assert.deepEqual ['ab'], type.normalize ['a', 'b']
    assert.deepEqual ['ab'], type.normalize ['ab', '']
    assert.deepEqual ['ab'], type.normalize [0, 'a', 0, 'b', 0]
    assert.deepEqual ['a', 1, 'b'], type.normalize ['a', 1, 'b']

  describe 'emoji', ->    
    it 'compose insert', ->
      compose ['👻'], [1, '🥰'], ['👻🥰']

    it 'compose delete', ->
      compose [1, 'a👻b'], [2, d:1], [1, 'ab']
      compose [1, 'a👻b'], [3, d:1], [1, 'a👻']

    it 'transform', ->
      transform ['👻'], ['🥰'], ['👻'], [1, '👻']

  describe 'fuzzer found bugs', ->
    it 'compose does not consume too many items', ->
      compose ['👻🥰💃'], [1, d:1], ['👻💃']

  describe '#transformSelection()', ->
    # This test was copied from https://github.com/josephg/libot/blob/master/test.c
    # 
    # TODO: Add unicode tests here.
    doc = "abcdefghijklmnopqrstuvwxyz1234abcdefghijklmnopqrstuvwxyz1234"
    ins = [10, "oh hi"]
    del = [25, {d:20}]
    op = [10, 'oh hi', 10, {d:20}] # The previous ops composed together

    tc = (op, cursor, expected) ->
      assert.strictEqual type.transformSelection(cursor, doc, op), expected
      assert.deepStrictEqual type.transformSelection([cursor, cursor], doc, op), [expected, expected]
 
    it "shouldn't move a cursor at the start of the inserted text", ->
      tc op, 10, 10
  
    it 'should move a character inside a deleted region to the start of the region', ->
      tc del, 25, 25
      tc del, 35, 25
      tc del, 45, 25
  
    it "shouldn't effect cursors before the deleted region", ->
      tc del, 10, 10
  
    it "pulls back cursors past the end of the deleted region", ->
      tc del, 55, 35
  
    it "works with more complicated ops", ->
      tc op, 0, 0
      tc op, 100, 85
      tc op, 10, 10
      tc op, 11, 16
  
      tc op, 20, 25
      tc op, 30, 25
      tc op, 40, 25
      tc op, 41, 26


  describe 'randomizer', -> it 'passes', ->
    @timeout 100000
    @slow 5000

    fuzzer type, genOp, 10000

# And test the API.
require('./api') type, genOp

