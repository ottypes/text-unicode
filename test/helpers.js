const assert = require('assert')
const {insert, remove} = require('../dist')

describe('text helpers', () => {
  it('generates correct operations with insert', () => {
    assert.deepStrictEqual(insert(5, 'hi'), [5, 'hi'])
    assert.deepStrictEqual(insert(0, 'hi'), ['hi'])

    assert.deepStrictEqual(insert(5, ''), [])
    assert.deepStrictEqual(insert(0, ''), [])
  })

  it('generates correct operations with remove', () => {
    assert.deepStrictEqual(remove(5, 'hi'), [5, {d:'hi'}])
    assert.deepStrictEqual(remove(0, 'hi'), [{d:'hi'}])

    assert.deepStrictEqual(remove(5, 2), [5, {d:2}])
    assert.deepStrictEqual(remove(0, 2), [{d:2}])

    assert.deepStrictEqual(remove(5, ''), [])
    assert.deepStrictEqual(remove(0, ''), [])
    assert.deepStrictEqual(remove(5, 0), [])
    assert.deepStrictEqual(remove(0, 0), [])
  })
})
