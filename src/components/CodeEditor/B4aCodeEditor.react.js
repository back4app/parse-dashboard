import React, { useState, useEffect, forwardRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, esLint } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { linter, lintGutter } from '@codemirror/lint';
import globals from 'globals';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import * as eslint from 'eslint-linter-browserify';
// import { StreamLanguage } from '@codemirror/language';

const myTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#111214',
    foreground: '#CECFD0',
    caret: '#fff',
    selection: '#727377',
    selectionMatch: '#727377',
    lineHighlight: '#ffffff0f',
    backgroundImage: '',

    gutterBackground: '#0A0B0C',
    gutterForeground: '#f9f9f980',
    gutterBorder: '#dddddd',
    gutterActiveForeground: '#11437080',
  },
  styles: [
    { tag: [t.comment, t.quote], color: '#7F8C98' },
    { tag: [t.keyword], color: '#FF7AB2', fontWeight: 'bold' },
    { tag: [t.string, t.meta], color: '#27AE60' },
    { tag: [t.typeName], color: '#7cacf8' },
    { tag: [t.definition(t.variableName)], color: '#6BDFFF' },
    { tag: [t.name], color: '#6BAA9F' },
    { tag: [t.variableName], color: '#15A9FF' },
    { tag: [t.regexp, t.link], color: '#FF8170' },
  ],
});

const config = {
  // eslint configuration
  languageOptions: {
    globals: {
      ...globals.node,
      Parse: true,
    },
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  'rules': {
    'no-unused-vars': ['warn', {
      'vars': 'all',
      'args': 'after-used',
      'caughtErrors': 'all',
      'ignoreRestSiblings': false,
      'reportUsedIgnorePattern': false
    }],
    'no-case-declarations': 0,
    'no-undef': 'warn',
    'no-const-assign': 'error',
    'no-multiple-empty-lines': 1
  }
};

const B4aCodeEditor = forwardRef(({ code: initialCode, onCodeChange, mode }, ref) => {
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    if (window && window.document.querySelector('.cm-theme')) {
      const el = window.document.querySelector('.cm-theme')
      el.style.height = '100%';
      el.style.fontSize = '12px';
    }
  }, []);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = (value) => {
    setCode(value);
    typeof onCodeChange === 'function' && onCodeChange(value)
  };

  // Set the language extension
  const getLanguageExtension = () => {
    switch (mode) {
      case 'html':
        return [html()];
      case 'xml':
        return [xml()];
      case 'css':
        return [css()];
      case 'json':
        return [json()];
      case 'javascript':
      case 'js':
        return [javascript(),
          linter(esLint(new eslint.Linter(), config))];
      default:
        return [];
    }
  };

  return (
    <CodeMirror
      ref={ref}
      value={code}
      height="100%"
      extensions={[
        ...getLanguageExtension(),
        lintGutter(),
      ]}
      onChange={(value) => handleCodeChange(value)}
      basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
      theme={myTheme}
    />
  );
})

export default B4aCodeEditor;
