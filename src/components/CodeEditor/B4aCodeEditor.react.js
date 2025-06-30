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
// import * as eslint from 'eslint-linter-browserify';
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
    gutterActiveForeground: '#f9f9f9',
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
  languageOptions: {
    globals: {
      ...globals.node,
      Parse: true,
    },
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'no-const-assign': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'VariableDeclaration[kind=\'const\'] > VariableDeclarator[init.type=\'Identifier\'][init.name=\'undefined\']',
        message: 'Do not initialize `const` variables to `undefined`.'
      }
    ]
  }
};

const loadEslint = () => {
  return new Promise((resolve, reject) => {
    if (window.eslint) {
      resolve(window.eslint);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eslint-linter-browserify/linter.min.js';
    script.async = true;
    script.onload = () => resolve(window.eslint);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const B4aCodeEditor = forwardRef(({ code: initialCode, onCodeChange, mode }, ref) => {
  const [code, setCode] = useState(initialCode);
  const [eslintInstance, setEslintInstance] = useState(null);

  useEffect(() => {
    if (mode === 'javascript' || mode === 'js') {
      loadEslint()
        .then(eslint => {
          setEslintInstance(new eslint.Linter());
        })
        .catch(error => {
          console.error('Failed to load ESLint:', error);
        });
    }
  }, [mode]);

  useEffect(() => {
    if (window && window.document.querySelector('.cm-theme')) {
      const el = window.document.querySelector('.cm-theme');
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
        return [
          javascript(),
          ...(eslintInstance ? [linter(esLint(eslintInstance, config))] : [])
        ];
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
      onChange={(value) => {
        handleCodeChange(value)
      }}
      onCreateEditor={() => {
        if (window && window.document.querySelector('.cm-editor')) {
          const el = window.document.querySelector('.cm-editor');
          el.style.outline = 'none'
        }
      }}
      basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
      theme={myTheme}
    />
  );
})

export default B4aCodeEditor;
