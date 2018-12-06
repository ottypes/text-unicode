{randomInt, randomWord} = require 'ot-fuzzer'
{type} = require '../dist'

emoji = '😅🤖👻🤟💃'

strToList = (s) ->
  list = []
  i = 0
  while i < s.length
    code = s.charCodeAt i
    if code >= 0xd800
      list.push s[i] + s[i+1]
      i += 2
    else
      list.push s[i++]

  list


module.exports = genOp = (docStr) ->
  docStr = strToList docStr
  initialLen = docStr.length

  op = []
  expectedDoc = ''

  consume = (len) ->
    expectedDoc += docStr[...len].join('')
    docStr = docStr[len..]

  addInsert = ->
    # Insert a random word from the list somewhere in the document
    skip = randomInt Math.min docStr.length, 5

    if randomInt(2)
      word = randomWord() + ' '
    else
      p = randomInt(emoji.length/2)
      word = emoji.slice(p*2, p*2 + 2)

    op.push skip
    consume skip

    op.push word
    expectedDoc += word

  addDelete = ->
    skip = randomInt Math.min docStr.length, 5

    op.push skip
    consume skip

    length = randomInt Math.min docStr.length, 10
    op.push {d:length}
    docStr = docStr[length..]

  while docStr.length > 0
    # If the document is long, we'll bias it toward deletes
    chance = if initialLen > 100 then 3 else 2
    switch randomInt(chance)
      when 0 then addInsert()
      when 1, 2 then addDelete()
    
    if randomInt(7) is 0
      break

  # The code above will never insert at the end of the document. Its important to do that
  # sometimes.
  addInsert() if randomInt(10) == 0

  expectedDoc += docStr.join ''
  [type.normalize(op), expectedDoc]
 

# console.log genOp emoji for [1..10]