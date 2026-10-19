import React, { useCallback, useLayoutEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
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

// How many emitted values we remember while waiting for the parent to hand
// them back through the `code` prop. A parent that echoes synchronously never
// holds more than one.
const MAX_PENDING_ECHOES = 20;

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
  (
    {
      code: initialCode,
      onCodeChange,
      mode,
      readOnly = false,
      fontSize = 12,
      documentKey,
      focusToken,
    },
    ref
  ) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    // Monaco's model is the source of truth while a document is open. The
    // `code` prop is only pushed into the editor when it is a genuinely
    // external change (another file opened, content loaded), never when it is
    // the parent handing back what the user just typed or pasted: re-applying
    // an echo replaces the whole document, which moves the cursor to the end
    // of the file and can drop edits made in the meantime.
    const lastValueRef = useRef(initialCode ?? '');
    const pendingEchoesRef = useRef([]);
    const applyingExternalRef = useRef(false);
    const documentKeyRef = useRef(documentKey);
    const latestRef = useRef(null);
    latestRef.current = { code: initialCode ?? '', documentKey, onCodeChange, readOnly, focusToken };

    const applyExternalValue = (editor, next, isNewDocument) => {
      applyingExternalRef.current = true;
      try {
        if (isNewDocument || latestRef.current.readOnly) {
          // setValue() also clears the undo stack, so undo can never bring the
          // previous file's content into the one that was just opened.
          editor.setValue(next);
          if (isNewDocument) {
            editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
          }
        } else {
          editor.executeEdits('', [
            { range: editor.getModel().getFullModelRange(), text: next, forceMoveMarkers: true },
          ]);
          editor.pushUndoStop();
        }
      } finally {
        applyingExternalRef.current = false;
      }
      lastValueRef.current = next;
      pendingEchoesRef.current = [];
    };

    useLayoutEffect(() => {
      const editor = editorRef.current;
      if (!editor) {
        // Not mounted yet: handleMount picks up the latest code.
        return;
      }
      const next = initialCode ?? '';
      const isNewDocument = documentKeyRef.current !== documentKey;
      documentKeyRef.current = documentKey;
      if (!isNewDocument) {
        if (next === lastValueRef.current) {
          pendingEchoesRef.current = [];
          return;
        }
        // A parent that updates asynchronously can hand back a value the user
        // has already typed past. It is still an echo, not an external change.
        const echoIndex = pendingEchoesRef.current.lastIndexOf(next);
        if (echoIndex !== -1) {
          pendingEchoesRef.current.splice(0, echoIndex + 1);
          return;
        }
      }
      applyExternalValue(editor, next, isNewDocument);
    }, [initialCode, documentKey]);

    useLayoutEffect(() => {
      if (focusToken && editorRef.current) {
        editorRef.current.focus();
      }
    }, [focusToken]);

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
      selectAll() {
        const editor = editorRef.current;
        const model = editor && editor.getModel();
        if (!model) {
          return false;
        }
        editor.focus();
        editor.setSelection(model.getFullModelRange());
        return true;
      },
    }));

    const handleMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // The `code` prop may have changed between the model being created and
      // this callback.
      const latest = latestRef.current;
      documentKeyRef.current = latest.documentKey;
      if (editor.getValue() !== latest.code) {
        applyExternalValue(editor, latest.code, true);
      }
      lastValueRef.current = latest.code;
      if (latest.focusToken) {
        editor.focus();
      }

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

    const handleChange = useCallback(value => {
      const next = value ?? '';
      lastValueRef.current = next;
      if (applyingExternalRef.current) {
        return;
      }
      const notifyParent = latestRef.current.onCodeChange;
      if (typeof notifyParent !== 'function') {
        return;
      }
      const pendingEchoes = pendingEchoesRef.current;
      pendingEchoes.push(next);
      if (pendingEchoes.length > MAX_PENDING_ECHOES) {
        pendingEchoes.shift();
      }
      notifyParent(next);
    }, []);

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
        // Clipboard: insert exactly what was copied, synchronously. The
        // "paste as" pipeline handles the paste asynchronously and gives up if
        // the document changes while it is still working.
        pasteAs: { enabled: false },
        formatOnPaste: false,
        autoIndentOnPaste: false,
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
        defaultValue={initialCode ?? ''}
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
