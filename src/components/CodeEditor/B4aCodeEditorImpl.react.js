import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';

const MONACO_THEME = 'vs-dark';

const languageMap = {
  bash: 'shell',
  dart: 'dart',
  graphql: 'graphql',
  html: 'html',
  java: 'java',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  kotlin: 'kotlin',
  php: 'php',
  plaintext: 'plaintext',
  shell: 'shell',
  swift: 'swift',
  text: 'plaintext',
  css: 'css',
  xml: 'xml',
};

const loadingFallbackStyle = {
  color: '#d4d4d4',
  background: '#1e1e1e',
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

      const remeasureAndLayout = () => {
        if (editorRef.current !== editor || monacoRef.current !== monaco) {
          return;
        }
        if (typeof monaco.editor?.remeasureFonts === 'function') {
          monaco.editor.remeasureFonts();
        }
        editor.layout();
      };

      // Monaco can cache character widths before async webfonts finish loading,
      // which makes the caret drift horizontally on some machines/browsers.
      remeasureAndLayout();
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(remeasureAndLayout);
            return;
          }
          remeasureAndLayout();
        });
      }

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
