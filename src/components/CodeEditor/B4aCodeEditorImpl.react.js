import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';

const MONACO_THEME = 'b4a-dark';
let themeDefined = false;

const defineB4aTheme = monaco => {
  if (themeDefined) {
    return;
  }
  themeDefined = true;

  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7F8C98', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7AB2', fontStyle: 'bold' },
      { token: 'string', foreground: '27AE60' },
      { token: 'string.key.json', foreground: '15A9FF' },
      { token: 'string.value.json', foreground: '27AE60' },
      { token: 'number', foreground: 'FF8170' },
      { token: 'regexp', foreground: 'FF8170' },
      { token: 'type', foreground: '7CACF8' },
      { token: 'identifier', foreground: 'CECFD0' },
      { token: 'variable', foreground: '15A9FF' },
      { token: 'variable.predefined', foreground: '6BDFFF' },
      { token: 'function', foreground: '6BDFFF' },
      { token: 'tag', foreground: 'FF7AB2' },
      { token: 'attribute.name', foreground: '15A9FF' },
      { token: 'attribute.value', foreground: '27AE60' },
      { token: 'meta', foreground: '27AE60' },
    ],
    colors: {
      'editor.background': '#111214',
      'editor.foreground': '#CECFD0',
      'editor.lineHighlightBackground': '#FFFFFF0F',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#727377',
      'editor.inactiveSelectionBackground': '#72737780',
      'editorCursor.foreground': '#FFFFFF',
      'editorLineNumber.foreground': '#F9F9F980',
      'editorLineNumber.activeForeground': '#F9F9F9',
      'editorGutter.background': '#0A0B0C',
      'editorWidget.background': '#0A0B0C',
      'editorWidget.border': '#1E1F22',
      'editorSuggestWidget.background': '#0A0B0C',
      'input.background': '#111214',
      'input.foreground': '#CECFD0',
      'dropdown.background': '#111214',
      focusBorder: '#6BDFFF',
    },
  });
};

const languageMap = {
  html: 'html',
  xml: 'xml',
  css: 'css',
  json: 'json',
  javascript: 'javascript',
  js: 'javascript',
};

const loadingFallbackStyle = {
  color: '#CECFD0',
  background: '#111214',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  boxSizing: 'border-box',
};

const B4aCodeEditorImpl = forwardRef(
  ({ code: initialCode, onCodeChange, mode, readOnly = false, fontSize = 12 }, ref) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const [code, setCode] = useState(initialCode ?? '');

    useEffect(() => {
      const next = initialCode ?? '';
      // Avoid re-applying the value when the incoming prop is just an echo of
      // what the user typed (parent re-renders with the same source). This
      // prevents Monaco from doing a full setValue on every keystroke, which
      // is heavy (revalidation, undo reset) and can cause cursor jumps.
      const current = editorRef.current ? editorRef.current.getValue() : code;
      if (current === next) {
        return;
      }
      setCode(next);
    }, [initialCode]);

    useImperativeHandle(ref, () => ({
      get editor() {
        return editorRef.current;
      },
      get monaco() {
        return monacoRef.current;
      },
      get value() {
        return editorRef.current ? editorRef.current.getValue() : '';
      },
      set value(next) {
        if (editorRef.current && typeof next === 'string') {
          editorRef.current.setValue(next);
        }
      },
      focus() {
        editorRef.current && editorRef.current.focus();
      },
    }));

    const handleMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      defineB4aTheme(monaco);
      monaco.editor.setTheme(MONACO_THEME);

      if (monaco.languages.typescript) {
        const jsDefaults = monaco.languages.typescript.javascriptDefaults;
        jsDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
        });
        jsDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2022,
          allowNonTsExtensions: true,
          allowJs: true,
          checkJs: false,
        });
        jsDefaults.addExtraLib(
          [
            'declare var Parse: any;',
            'declare var process: any;',
            'declare var require: any;',
            'declare var module: any;',
            'declare var __dirname: string;',
            'declare var __filename: string;',
          ].join('\n'),
          'file:///b4a-globals.d.ts'
        );
      }
    };

    const handleChange = value => {
      const next = value ?? '';
      setCode(next);
      if (typeof onCodeChange === 'function') {
        onCodeChange(next);
      }
    };

    const language = languageMap[mode] || 'plaintext';

    const options = useMemo(
      () => ({
        readOnly,
        fontSize,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        renderLineHighlight: 'all',
        fontFamily:
          '\'Roboto Mono\', Menlo, Monaco, Consolas, \'Liberation Mono\', \'Courier New\', monospace',
        fontLigatures: false,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        padding: { top: 8, bottom: 8 },
        wordWrap: 'off',
        fixedOverflowWidgets: true,
      }),
      [readOnly, fontSize]
    );

    const loadingElement = useMemo(
      () => <div style={loadingFallbackStyle}>Loading editor…</div>,
      []
    );

    return (
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme={MONACO_THEME}
        onChange={handleChange}
        onMount={handleMount}
        loading={loadingElement}
        options={options}
      />
    );
  }
);

B4aCodeEditorImpl.displayName = 'B4aCodeEditorImpl';

export default B4aCodeEditorImpl;
