import React, { Suspense, lazy, forwardRef, useMemo } from 'react';

// Lazy-load the heavy Monaco-based editor implementation into its own webpack
// chunk so it (and `@monaco-editor/react` + `@monaco-editor/loader`) don't
// land in the main dashboard bundle. The chunk is fetched the first time any
// route mounts an editor (Cloud Code, Playground, Custom Parse Options
// modal) and is cached for subsequent mounts.
const B4aCodeEditorImpl = lazy(() =>
  import(/* webpackChunkName: "b4a-code-editor" */ './B4aCodeEditorImpl.react')
);

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

// Kept visually identical to the impl's own `loading` prop so the user only
// ever sees one consistent "Loading editor…" surface across both phases:
// (1) chunk download, then (2) Monaco CDN bootstrap.
const LoadingFallback = () => <div style={loadingFallbackStyle}>Loading editor…</div>;

const B4aCodeEditor = forwardRef((props, ref) => {
  const fallback = useMemo(() => <LoadingFallback />, []);
  return (
    <Suspense fallback={fallback}>
      <B4aCodeEditorImpl {...props} ref={ref} />
    </Suspense>
  );
});

B4aCodeEditor.displayName = 'B4aCodeEditor';

export default B4aCodeEditor;
