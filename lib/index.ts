// This is an implementation of the text OT type built on top of JS strings.
// You would think this would be horribly inefficient, but its surpringly
// good. JS strings are magic.
import {strPosToUni, uniToStrPos} from 'unicount'
import makeType, {Rope, uniSlice, dlen} from './type'
import api from './api'

const ropeImplUnicodeString: Rope<string> = {
  create(s: string) { return s },
  toString(s) { return s },

  builder(oldDoc) {
    if (typeof oldDoc !== 'string') throw Error('Invalid document snapshot: ' + oldDoc)
    const newDoc: string[] = []

    return {
      skip(n) {
        let offset = uniToStrPos(oldDoc, n)
        if (offset > oldDoc.length) throw Error('The op is too long for this document')
        newDoc.push(oldDoc.slice(0, offset))
        oldDoc = oldDoc.slice(offset)
      },
      append(s) {
        newDoc.push(s)
      },
      del(n) {
        oldDoc = oldDoc.slice(uniToStrPos(oldDoc, n))
      },
      build() { return newDoc.join('') + oldDoc },
    }
  },

  slice: uniSlice,
}

const textString = makeType(ropeImplUnicodeString)

const type = {
  ...textString,
  api,
}

export const insert = (pos: number, text: string) => (
  text.length === 0
    ? []
    : pos === 0 ? [text] : [pos, text]
)

export const remove = (pos: number, textOrLen: string | number) => (
  dlen(textOrLen) === 0
    ? []
    : pos === 0 ? [{d: textOrLen}] : [pos, {d: textOrLen}]
)

export {default as makeType, TextOp, TextOpComponent, TextType, Rope} from './type'
export {type}
