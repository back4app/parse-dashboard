/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'lib/PropTypes';
import styles from 'components/B4aFileTree/B4aFileTree.scss';

const FOLDER_TYPES = new Set(['folder', 'new-folder']);

const isFolder = node => FOLDER_TYPES.has(node && node.type);

const buildPath = (parentPath, node) =>
  parentPath ? `${parentPath}/${node.text}` : node.text;

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const FolderIcon = ({ open }) => {
  const color = open ? '#fbbf24' : 'rgba(251, 191, 36, 0.7)';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"
        stroke={color}
        strokeWidth="2"
        fill={open ? color : 'none'}
        fillOpacity={open ? 0.2 : 0}
      />
    </svg>
  );
};

const FILE_COLORS = {
  js: '#fbbf24',
  mjs: '#fbbf24',
  jsx: '#fbbf24',
  ts: '#60a5fa',
  tsx: '#60a5fa',
  json: '#ca8a04',
  html: '#fb923c',
  htm: '#fb923c',
  css: '#3b82f6',
  scss: '#f472b6',
  md: 'rgba(255, 255, 255, 0.6)',
  txt: 'rgba(255, 255, 255, 0.5)',
};

const FILE_LABELS = {
  js: 'JS',
  mjs: 'JS',
  jsx: 'JSX',
  ts: 'TS',
  tsx: 'TSX',
  json: '{}',
  html: '<>',
  htm: '<>',
  css: '#',
  scss: '#',
  md: 'MD',
};

const getExtension = filename => {
  if (typeof filename !== 'string') {
    return '';
  }
  const idx = filename.lastIndexOf('.');
  if (idx <= 0) {
    return '';
  }
  return filename.slice(idx + 1).toLowerCase();
};

const FileIcon = ({ filename }) => {
  const ext = getExtension(filename);
  const color = FILE_COLORS[ext] || 'rgba(255, 255, 255, 0.5)';
  const label = FILE_LABELS[ext] || '';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {label ? (
        <text x="12" y="17" fontSize="6" fill={color} textAnchor="middle" fontWeight="bold">
          {label}
        </text>
      ) : null}
    </svg>
  );
};

const NewFileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
    <path d="M14 2v6h6" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const NewFolderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = e => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [onClose]);

  useEffect(() => {
    if (!menuRef.current) {
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) {
      menuRef.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > vh) {
      menuRef.current.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  return createPortal(
    <div ref={menuRef} className={styles.contextMenu} style={{ top: y, left: x }}>
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          className={styles.contextMenuItem}
          onClick={() => { item.action(); onClose(); }}
        >
          <span className={styles.contextMenuIcon}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
};

const TreeNode = ({
  node,
  parentPath,
  depth,
  expanded,
  selectedPath,
  draggingPath,
  dropTargetPath,
  onToggle,
  onSelect,
  onContextAction,
  onDragStart,
  onDragEnd,
  onDropNode,
  canDropNode,
}) => {
  const folder = isFolder(node);
  const path = buildPath(parentPath, node);
  const isExpanded = expanded.has(path);
  const isSelected = selectedPath === path;
  const isDragging = draggingPath === path;
  const isDropTarget = dropTargetPath === path;

  const handleClick = () => {
    if (folder) {
      onToggle(path);
    }
    onSelect(node, path);
  };

  const handleContextMenu = e => {
    if (typeof onContextAction !== 'function') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onContextAction(node, path, folder, e.clientX, e.clientY);
  };

  const draggable = typeof onDropNode === 'function' && path.indexOf('/') > -1;

  const handleDragStart = e => {
    if (!draggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', path);
    onDragStart(path);
  };

  const handleDragOver = e => {
    if (!folder || typeof canDropNode !== 'function' || !canDropNode(draggingPath, path)) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = e => {
    if (!folder || typeof onDropNode !== 'function') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onDropNode(draggingPath || e.dataTransfer.getData('text/plain'), path);
  };

  const handleDragEnter = e => {
    if (!folder || typeof canDropNode !== 'function' || !canDropNode(draggingPath, path)) {
      return;
    }
    e.preventDefault();
    onToggle(path, true);
  };

  const indentStyle = { paddingLeft: `${depth * 12 + 8}px` };
  const rowClassName = [
    styles.row,
    isSelected ? styles.selected : '',
    isDragging ? styles.dragging : '',
    isDropTarget ? styles.dropTarget : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.nodeWrapper}>
      <button
        type="button"
        className={rowClassName}
        style={indentStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
      >
        <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>
          {folder ? <ChevronIcon /> : null}
        </span>
        <span className={styles.icon}>
          {folder ? <FolderIcon open={isExpanded} /> : <FileIcon filename={node.text} />}
        </span>
        <span className={styles.label}>{node.text}</span>
      </button>

      {folder && isExpanded && Array.isArray(node.children) && node.children.length > 0 ? (
        <div className={styles.children}>
          {node.children.map(child => (
            <TreeNode
              key={child.id || `${path}/${child.text}`}
              node={child}
              parentPath={path}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              draggingPath={draggingPath}
              dropTargetPath={dropTargetPath}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextAction={onContextAction}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropNode={onDropNode}
              canDropNode={canDropNode}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const B4aFileTree = ({
  tree,
  selectedPath,
  onFileSelect,
  onContextAction,
  onNodeDrop,
  rootFilter,
  defaultExpanded,
  emptyMessage,
}) => {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded || []));
  const [ctxMenu, setCtxMenu] = useState(null);
  const [draggingPath, setDraggingPath] = useState('');
  const [dropTargetPath, setDropTargetPath] = useState('');

  useEffect(() => {
    if (!selectedPath) {
      return;
    }
    const segments = selectedPath.split('/');
    if (segments.length <= 1) {
      return;
    }
    setExpanded(prev => {
      const next = new Set(prev);
      let accumulated = '';
      for (let i = 0; i < segments.length - 1; i++) {
        accumulated = accumulated ? `${accumulated}/${segments[i]}` : segments[i];
        next.add(accumulated);
      }
      if (next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [selectedPath]);

  const toggleFolder = useCallback((path, forceOpen) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (forceOpen) {
        next.add(path);
      } else if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const canDropNode = useCallback((sourcePath, targetPath) => {
    if (typeof onNodeDrop !== 'function' || !sourcePath || !targetPath) {
      return false;
    }
    if (sourcePath === targetPath) {
      return false;
    }
    if (sourcePath.indexOf('/') === -1) {
      return false;
    }
    if (sourcePath.split('/').slice(0, -1).join('/') === targetPath) {
      return false;
    }
    if (targetPath.startsWith(`${sourcePath}/`)) {
      return false;
    }
    return true;
  }, [onNodeDrop]);

  const handleDragStart = useCallback(path => {
    setDraggingPath(path);
    setDropTargetPath('');
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingPath('');
    setDropTargetPath('');
  }, []);

  const handleDropNode = useCallback((sourcePath, targetPath) => {
    if (!canDropNode(sourcePath, targetPath)) {
      handleDragEnd();
      return;
    }
    onNodeDrop(sourcePath, targetPath);
    handleDragEnd();
  }, [canDropNode, handleDragEnd, onNodeDrop]);

  const handleNodeContext = useCallback((node, path, folder, x, y) => {
    if (typeof onContextAction !== 'function') {
      return;
    }
    setCtxMenu({ node, path, folder, x, y });
  }, [onContextAction]);

  const ctxMenuItems = useMemo(() => {
    if (!ctxMenu) {
      return [];
    }
    const items = [
      {
        key: 'new-file',
        label: 'New File',
        icon: <NewFileIcon />,
        action: () => onContextAction('create-file', ctxMenu.node, ctxMenu.path),
      },
    ];
    if (ctxMenu.folder) {
      items.push({
        key: 'new-folder',
        label: 'New Folder',
        icon: <NewFolderIcon />,
        action: () => onContextAction('create-folder', ctxMenu.node, ctxMenu.path),
      });
    }
    return items;
  }, [ctxMenu, onContextAction]);

  const filteredTree = useMemo(() => {
    if (!Array.isArray(tree) || tree.length === 0) {
      return [];
    }
    if (!rootFilter || rootFilter.length === 0) {
      return tree;
    }
    const allowed = new Set(rootFilter);
    return tree.filter(node => allowed.has(node.text));
  }, [tree, rootFilter]);

  if (filteredTree.length === 0) {
    return (
      <div className={styles.empty}>{emptyMessage || 'No files found'}</div>
    );
  }

  return (
    <div className={styles.tree}>
      {filteredTree.map(node => (
        <TreeNode
          key={node.id || node.text}
          node={node}
          parentPath=""
          depth={0}
          expanded={expanded}
          selectedPath={selectedPath}
          draggingPath={draggingPath}
          dropTargetPath={dropTargetPath}
          onToggle={toggleFolder}
          onSelect={onFileSelect}
          onContextAction={typeof onContextAction === 'function' ? handleNodeContext : undefined}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDropNode={typeof onNodeDrop === 'function' ? handleDropNode : undefined}
          canDropNode={(sourcePath, targetPath) => {
            const canDrop = canDropNode(sourcePath, targetPath);
            setDropTargetPath(canDrop ? targetPath : '');
            return canDrop;
          }}
        />
      ))}
      {ctxMenu ? (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenuItems} onClose={closeCtxMenu} />
      ) : null}
    </div>
  );
};

B4aFileTree.propTypes = {
  tree: PropTypes.arrayOf(PropTypes.any).isRequired.describe('Hierarchical tree data (jstree-style nodes with text/type/children).'),
  selectedPath: PropTypes.string.describe('The currently selected node path.'),
  onFileSelect: PropTypes.func.isRequired.describe('Called with (node, path) when a file is clicked.'),
  onContextAction: PropTypes.func.describe('Called with (action, node, path) on right-click menu selection. Actions: "create-file", "create-folder".'),
  onNodeDrop: PropTypes.func.describe('Called with (sourcePath, targetPath) when a node is dropped onto a folder.'),
  rootFilter: PropTypes.arrayOf(PropTypes.string).describe('When set, only root nodes whose `text` is in this list are rendered.'),
  defaultExpanded: PropTypes.arrayOf(PropTypes.string).describe('Paths that should start expanded.'),
  emptyMessage: PropTypes.string.describe('Message to show when the tree is empty.'),
};

export default B4aFileTree;
export { getExtension };
