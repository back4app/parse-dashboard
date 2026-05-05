/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'lib/PropTypes';
import B4aCodeEditor from 'components/CodeEditor/B4aCodeEditor.react';
import B4aFileTree, { getExtension } from 'components/B4aFileTree/B4aFileTree.react';
import styles from 'components/B4aCloudCodeBrowser/B4aCloudCodeBrowser.scss';

const LANGUAGE_BY_EXTENSION = {
  js: 'javascript',
  mjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sh: 'shell',
  bash: 'shell',
  txt: 'plaintext',
};

const getLanguageFromFilename = filename => {
  const ext = getExtension(filename);
  return LANGUAGE_BY_EXTENSION[ext] || 'plaintext';
};

const getEditorMode = filename => {
  // B4aCodeEditor expects the editor's "mode" key (js/json/html/css/javascript)
  const ext = getExtension(filename);
  if (!ext) {
    return 'javascript';
  }
  if (ext === 'mjs' || ext === 'jsx') {
    return 'javascript';
  }
  return ext;
};

const decodeFileContent = node => {
  if (!node || !node.data || typeof node.data.code !== 'string') {
    return '// No content available';
  }
  const code = node.data.code;
  const match = code.match(/base64,(.*)$/);
  if (!match) {
    return code;
  }
  try {
    const decoded = window.atob(match[1] || '');
    return decodeURIComponent(escape(decoded));
  } catch (err) {
    return '// Error decoding file content';
  }
};

const findFirstFile = node => {
  if (!node) {
    return null;
  }
  if (node.type !== 'folder' && node.type !== 'new-folder') {
    return node;
  }
  if (!Array.isArray(node.children)) {
    return null;
  }
  for (const child of node.children) {
    if (child.type !== 'folder' && child.type !== 'new-folder') {
      return child;
    }
  }
  for (const child of node.children) {
    const inner = findFirstFile(child);
    if (inner) {
      return inner;
    }
  }
  return null;
};

const FileTabIcon = ({ filename }) => {
  const ext = getExtension(filename);
  const colors = {
    js: '#f7df1e',
    mjs: '#f7df1e',
    jsx: '#f7df1e',
    ts: '#3178c6',
    tsx: '#3178c6',
    json: '#cbcb41',
    html: '#e44d26',
    htm: '#e44d26',
    css: '#264de4',
    scss: '#cf649a',
    md: '#9aa0a6',
  };
  const color = colors[ext] || '#cccccc';
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
    </svg>
  );
};

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const B4aCloudCodeBrowser = ({
  tree,
  rootFilter,
  defaultExpanded,
  isLoading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onFileSelect,
  enableFullscreen,
  readOnly,
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPath, setSelectedPath] = useState(undefined);
  const [fileContent, setFileContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyHint, setCopyHint] = useState(false);

  const handleFileSelect = useCallback(
    (node, path) => {
      setSelectedNode(node);
      setSelectedPath(path);
      setFileContent(decodeFileContent(node));
      if (typeof onFileSelect === 'function') {
        onFileSelect(node, path);
      }
    },
    [onFileSelect]
  );

  useEffect(() => {
    if (selectedNode || !Array.isArray(tree) || tree.length === 0) {
      return;
    }
    const allowed = Array.isArray(rootFilter) && rootFilter.length > 0
      ? new Set(rootFilter)
      : null;
    const candidates = allowed
      ? tree.filter(n => allowed.has(n.text))
      : tree;
    for (const root of candidates) {
      const file = findFirstFile(root);
      if (file) {
        handleFileSelect(file, `${root.text}/${file.text}`);
        return;
      }
    }
  }, [tree, rootFilter, selectedNode, handleFileSelect]);

  const language = useMemo(
    () => (selectedNode ? getLanguageFromFilename(selectedNode.text) : 'plaintext'),
    [selectedNode]
  );

  const editorMode = useMemo(
    () => (selectedNode ? getEditorMode(selectedNode.text) : 'javascript'),
    [selectedNode]
  );

  const handleCopy = useCallback(() => {
    if (!fileContent || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(fileContent).then(() => {
      setCopyHint(true);
      setTimeout(() => setCopyHint(false), 1500);
    });
  }, [fileContent]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span>Loading cloud code…</span>
      </div>
    );
  }

  const hasContent = Array.isArray(tree) && tree.length > 0
    && (!Array.isArray(rootFilter) || rootFilter.length === 0
      || tree.some(n => rootFilter.includes(n.text)));

  if (!hasContent) {
    return (
      <div className={styles.empty}>
        {emptyTitle ? <h3 className={styles.emptyTitle}>{emptyTitle}</h3> : null}
        {emptyDescription ? <p className={styles.emptyDescription}>{emptyDescription}</p> : null}
        {emptyAction || null}
      </div>
    );
  }

  const fullscreenLayer = isFullscreen && selectedNode
    ? createPortal(
      <div className={styles.fullscreen}>
        <div className={styles.tabBar}>
          <FileTabIcon filename={selectedNode.text} />
          <span className={styles.tabName}>{selectedNode.text}</span>
          <span className={styles.tabPath}>{selectedPath}</span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleCopy}
            title="Copy contents"
          >
            <CopyIcon />
            <span className={styles.iconButtonLabel}>{copyHint ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsFullscreen(false)}
            title="Exit fullscreen"
          >
            <CollapseIcon />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsFullscreen(false)}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.fullscreenEditor}>
          <B4aCodeEditor
            code={fileContent}
            mode={editorMode}
            readOnly={readOnly !== false}
            fontSize={13}
          />
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Explorer</div>
        <B4aFileTree
          tree={tree}
          selectedPath={selectedPath}
          onFileSelect={handleFileSelect}
          rootFilter={rootFilter}
          defaultExpanded={defaultExpanded}
        />
      </aside>
      <main className={styles.main}>
        {selectedNode ? (
          <React.Fragment>
            <div className={styles.tabBar}>
              <FileTabIcon filename={selectedNode.text} />
              <span className={styles.tabName}>{selectedNode.text}</span>
              <span className={styles.tabPath}>{selectedPath}</span>
              {enableFullscreen !== false ? (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setIsFullscreen(true)}
                  title="Expand to fullscreen"
                >
                  <ExpandIcon />
                </button>
              ) : null}
            </div>
            <div className={styles.editor}>
              <B4aCodeEditor
                code={fileContent}
                mode={editorMode}
                readOnly={readOnly !== false}
                fontSize={13}
              />
            </div>
          </React.Fragment>
        ) : (
          <div className={styles.placeholder}>
            <p>Select a file to view its contents</p>
            <p className={styles.placeholderHint}>Use the explorer on the left to navigate</p>
          </div>
        )}
      </main>
      {fullscreenLayer}
    </div>
  );
};

B4aCloudCodeBrowser.propTypes = {
  tree: PropTypes.arrayOf(PropTypes.any).isRequired.describe('Hierarchical tree data (jstree-style nodes).'),
  rootFilter: PropTypes.arrayOf(PropTypes.string).describe('Show only root nodes whose text is in this list (e.g. ["public", "cloud"]).'),
  defaultExpanded: PropTypes.arrayOf(PropTypes.string).describe('Tree paths to expand by default.'),
  isLoading: PropTypes.bool.describe('Whether the tree is still loading.'),
  emptyTitle: PropTypes.string.describe('Title for the empty state.'),
  emptyDescription: PropTypes.string.describe('Description for the empty state.'),
  emptyAction: PropTypes.any.describe('Optional React node rendered in the empty state (e.g. a link/button).'),
  onFileSelect: PropTypes.func.describe('Called with (node, path) whenever a file is selected.'),
  enableFullscreen: PropTypes.bool.describe('Whether the fullscreen toggle should be shown (defaults to true).'),
  readOnly: PropTypes.bool.describe('Whether the editor should be read-only (defaults to true).'),
};

export default B4aCloudCodeBrowser;
export { getLanguageFromFilename, decodeFileContent };
