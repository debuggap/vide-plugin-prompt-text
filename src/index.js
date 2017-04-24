import path from 'path'
let words = []
let prevPromptStr = ''
let prevPromptLists = []

function analyseContent (con) {
  let reg = /([a-zA-Z_\$][a-zA-Z0-9_\$]{3,})/g
  let arr = con.match(reg)
  words =[]
  if (!arr) {
    return
  }
  let matchObj = {}
  arr.forEach((item) => {
    if (!matchObj[item]) {
      words.push({value: item})
      matchObj[item] = 1
    }
  })
}

function getTypedCharacters (action, store, editor) {
  if (action.action == 'remove' && !store.state.editor.promptLists.length) {
    return ''
  }
  if (action && action.lines.length === 1 && /^\S+$/.test(action.lines[0]) && action.start.row != undefined && action.start.row == action.end.row) {
    let session = editor.session
    let line = session.getLine(action.start.row)
    let str
    let after_adding_letter = ""
    
    if (action.action == 'insert' && action.lines[0].length == 1) {
      str = line.slice(0, action.end.column)
      after_adding_letter = line.slice(action.end.column, action.end.column + 1)
    } else if (action.action == 'remove' && action.lines[0].length == 1) {
      str = line.slice(0, action.start.column)
      after_adding_letter = line.slice(action.start.column, action.start.column + 1)
    } else {
      return ''
    }
    
    // if after adding letter,there is a legal letter,it means we are editing in a word,
    if (after_adding_letter && /[a-zA-Z0-9_$]+$/.test(after_adding_letter)) {
      return ''
    }
    
    let value = str.match(/[a-zA-Z_\$][a-zA-Z0-9_$]*$/)
    if (value && value[0]) {
      value = value[0]
    }
    return value ? value : '';
  } else {
    return ''
  } 
}

function matchWords (str) {
  let reg = new RegExp(str, 'i')
  let lists = words
  if (prevPromptStr && str.slice(0, prevPromptStr.length) === prevPromptStr) {
      lists = prevPromptLists
  }
  let results = lists.filter((item) => {
    return reg.test(item.value)
  })
  results.sort(function (a,b){return a.value > b.value ? 1 : -1;})
  return results
}

export default ({editor, store, view, packageInfo, baseClass}) => {
  // subscribe change file
  store.subscribe((mutation, state) => {
    if (['EDITOR_SET_FILE_TYPE','FILE_CREATE'].includes(mutation.type) && store.state.editor.promptName === 'videPluginPromptText') {
      analyseContent(state.editor.content)
    }
  })
  editor.session.on('change', function (action) {
    if (store.state.editor.promptName === 'videPluginPromptText' && action.action === 'insert' && action.lines.join('') === '') {
      analyseContent(editor.getValue())
    }
  })
  // return execute class
  return class videPluginPromptText extends baseClass {
    index ({action}) {
      let promptLists = []
      let promptStr = ''
      try {
        promptStr = getTypedCharacters(action, store, editor)
        if (promptStr) {
          promptLists = matchWords(promptStr)
        }
      } catch (e) {}
      if (promptLists.length) {
        prevPromptStr = promptStr
        prevPromptLists = promptLists
        store.dispatch('editor/setPromptLists', {promptStr, promptLists})
      } else {
        prevPromptStr = ''
        prevPromptLists = []
        store.dispatch('editor/cleanPromptLists')
      }
    }
  }
}
