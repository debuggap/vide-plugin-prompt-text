'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var words = [];
var prevPromptStr = '';
var prevPromptLists = [];

function analyseContent(con) {
  var reg = /([a-zA-Z_\$][a-zA-Z0-9_\$]{3,})/g;
  var arr = con.match(reg);
  words = [];
  if (!arr) {
    return;
  }
  var matchObj = {};
  arr.forEach(function (item) {
    if (!matchObj[item]) {
      words.push({ value: item });
      matchObj[item] = 1;
    }
  });
}

function getTypedCharacters(action, store, editor) {
  if (action.action == 'remove' && !store.state.editor.promptLists.length) {
    return '';
  }
  if (action && action.lines.length === 1 && /^\S+$/.test(action.lines[0]) && action.start.row != undefined && action.start.row == action.end.row) {
    var session = editor.session;
    var line = session.getLine(action.start.row);
    var str = void 0;
    var after_adding_letter = "";

    if (action.action == 'insert' && action.lines[0].length == 1) {
      str = line.slice(0, action.end.column);
      after_adding_letter = line.slice(action.end.column, action.end.column + 1);
    } else if (action.action == 'remove' && action.lines[0].length == 1) {
      str = line.slice(0, action.start.column);
      after_adding_letter = line.slice(action.start.column, action.start.column + 1);
    } else {
      return '';
    }

    // if after adding letter,there is a legal letter,it means we are editing in a word,
    if (after_adding_letter && /[a-zA-Z0-9_$]+$/.test(after_adding_letter)) {
      return '';
    }

    var value = str.match(/[a-zA-Z_\$][a-zA-Z0-9_$]*$/);
    if (value && value[0]) {
      value = value[0];
    }
    return value ? value : '';
  } else {
    return '';
  }
}

function matchWords(str) {
  var reg = new RegExp(str, 'i');
  var lists = words;
  if (prevPromptStr && str.slice(0, prevPromptStr.length) === prevPromptStr) {
    lists = prevPromptLists;
  }
  var results = lists.filter(function (item) {
    return reg.test(item.value);
  });
  results.sort(function (a, b) {
    return a.value > b.value ? 1 : -1;
  });
  return results;
}

exports.default = function (_ref) {
  var editor = _ref.editor,
      store = _ref.store,
      view = _ref.view,
      packageInfo = _ref.packageInfo,
      baseClass = _ref.baseClass;

  // subscribe change file
  store.subscribe(function (mutation, state) {
    if (['EDITOR_SET_FILE_TYPE', 'FILE_CREATE'].includes(mutation.type) && store.state.editor.promptName === 'videPluginPromptText') {
      analyseContent(state.editor.content);
    }
  });
  editor.session.on('change', function (action) {
    if (store.state.editor.promptName === 'videPluginPromptText' && action.action === 'insert' && action.lines.join('') === '') {
      analyseContent(editor.getValue());
    }
  });
  // return execute class
  return function (_baseClass) {
    _inherits(videPluginPromptText, _baseClass);

    function videPluginPromptText() {
      _classCallCheck(this, videPluginPromptText);

      return _possibleConstructorReturn(this, (videPluginPromptText.__proto__ || Object.getPrototypeOf(videPluginPromptText)).apply(this, arguments));
    }

    _createClass(videPluginPromptText, [{
      key: 'index',
      value: function index(_ref2) {
        var action = _ref2.action;

        var promptLists = [];
        var promptStr = '';
        try {
          promptStr = getTypedCharacters(action, store, editor);
          if (promptStr) {
            promptLists = matchWords(promptStr);
          }
        } catch (e) {}
        if (promptLists.length) {
          prevPromptStr = promptStr;
          prevPromptLists = promptLists;
          store.dispatch('editor/setPromptLists', { promptStr: promptStr, promptLists: promptLists });
        } else {
          prevPromptStr = '';
          prevPromptLists = [];
          store.dispatch('editor/cleanPromptLists');
        }
      }
    }]);

    return videPluginPromptText;
  }(baseClass);
};