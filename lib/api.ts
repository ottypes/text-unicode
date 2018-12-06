// Text document API for the 'text' type. This implements some standard API
// methods for any text-like type, so you can easily bind a textarea or
// something without being fussy about the underlying OT implementation.
//
// The API is desigend as a set of functions to be mixed in to some context
// object as part of its lifecycle. It expects that object to have getSnapshot
// and submitOp methods, and call _onOp when an operation is received.
//
// This API defines:
//
// - getLength() returns the length of the document in characters
// - getText() returns a string of the document
// - insert(pos, text, [callback]) inserts text at position pos in the document
// - remove(pos, length, [callback]) removes length characters at position pos
//
// A user can define:
// - onInsert(pos, text): Called when text is inserted.
// - onRemove(pos, length): Called when text is removed.
import {TextOp} from './maketext'
import {strPosToUni} from './unicode'

export default function api(getSnapshot: () => string, submitOp: (op: TextOp, cb: () => {}) => void) {
  return {
    // Returns the text content of the document
    get: getSnapshot,

    // Returns the number of characters in the string
    getLength() { return getSnapshot().length },

    // Insert the specified text at the given position in the document
    insert(pos: number, text: string, callback: () => {}) {
      const uniPos = strPosToUni(getSnapshot(), pos)
      return submitOp([uniPos, text], callback)
    },

    remove(pos: number, length: number, callback: () => {}) {
      const uniPos = strPosToUni(getSnapshot(), pos)
      return submitOp([uniPos, {d:length}], callback)
    },

    // When you use this API, you should implement these two methods
    // in your editing context.
    //onInsert: function(pos, text) {},
    //onRemove: function(pos, removedLength) {},

    _onOp(op: TextOp) {
      var pos = 0
      var spos = 0
      for (var i = 0; i < op.length; i++) {
        var component = op[i]
        switch (typeof component) {
          case 'number':
            pos += component
            spos += component
            break
          case 'string':
            if (this.onInsert) this.onInsert(pos, component)
            pos += component.length
            break
          case 'object':
            if (this.onRemove) this.onRemove(pos, component.d)
            spos += component.d
        }
      }
    },

    onInsert: null as null | ((pos: number, s: string) => void),
    onRemove: null as null | ((pos: number, amt: number) => void),
  }
}
api.provides = {text: true}
