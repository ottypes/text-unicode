// This is an implementation of the text OT type built on top of JS strings.
// You would think this would be horribly inefficient, but its surpringly
// good. JS strings are magic.
import {strPosToUni, uniToStrPos} from './unicode'
import makeType, {Rope} from './maketext'
import api from './api'

const ropeImplUnicodeString: Rope<string> = {
  create(s: string) { return s },
  toString(s) { return s },

  builder(oldDoc) {
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
  }
}

const textString = makeType(ropeImplUnicodeString)

const type = {
  ...textString,
  api,
}

export {default as makeType, TextOp, TextType, Rope} from './maketext'
export {type}
