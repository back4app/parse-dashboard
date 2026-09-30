/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from 'components/Icon/Icon.react';
import { CurrentApp } from 'context/currentApp';
import AgentChat from './AgentChat.react';
import styles from './AgentPanel.scss';

const WIDTH_KEY = 'b4a-agent-panel-width';
const DEFAULT_WIDTH = 360;
// Must match the clamp() in AgentPanel.scss: the panel never gets narrower
// than MIN_WIDTH, and the page keeps at least PAGE_MIN_WIDTH (sidebar + 480px).
const MIN_WIDTH = 300;
const PAGE_MIN_WIDTH = 280 + 480;
const KEY_STEP = 16;

function clampWidth(width) {
  return Math.max(MIN_WIDTH, Math.min(width, window.innerWidth - PAGE_MIN_WIDTH));
}

// The width the user dragged it to last time. Storage can throw (private mode,
// blocked site data) — it just starts at the default then.
function readWidth() {
  try {
    const stored = parseInt(localStorage.getItem(WIDTH_KEY), 10);
    return stored > 0 ? stored : DEFAULT_WIDTH;
  } catch (e) {
    return DEFAULT_WIDTH;
  }
}

function writeWidth(width) {
  try {
    localStorage.setItem(WIDTH_KEY, String(width));
  } catch (e) {
    /* noop */
  }
}

/**
 * The Backend Agent docked on the right of every app page — the one right-hand
 * zone of the dashboard. It starts minimized to a strip and only opens when the
 * user clicks it (a dot on the strip flags an answer that landed meanwhile).
 * The same conversation also lives on the full Backend Agent page (sidebar),
 * where the panel steps aside. Its left edge can be dragged to resize it (the
 * width is remembered in this browser; double-click the edge to reset).
 *
 * Mounted once in AppData, above the routes, so the chat and its subscription
 * survive navigation between pages. The space it takes is published on
 * <body data-agent-dock> (open/collapsed) and --agent-panel-width (the dragged
 * width), and turned into the --agent-dock width in AgentPanel.scss; page chrome that is fixed to the right edge (toolbars,
 * footers, the data browser) reads that variable. An attribute and not a class
 * because B4aSidebar edits body.className as a raw string.
 */
function AgentPanel() {
  const app = useContext(CurrentApp);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [width, setWidth] = useState(readWidth);
  const [resizing, setResizing] = useState(false);
  const [agent, setAgent] = useState(null);
  const chatRef = useRef(null);
  // The chat reports answers through a callback created once; read the live
  // value instead of the one captured when it was created.
  const openRef = useRef(open);
  openRef.current = open;

  const onAgentPage = location.pathname.split('/')[3] === 'agent';

  useEffect(() => {
    if (onAgentPage) {
      delete document.body.dataset.agentDock;
    } else {
      document.body.dataset.agentDock = open ? 'open' : 'collapsed';
    }
    return () => {
      delete document.body.dataset.agentDock;
    };
  }, [open, onAgentPage]);

  useEffect(() => {
    document.body.style.setProperty('--agent-panel-width', `${width}px`);
    return () => {
      document.body.style.removeProperty('--agent-panel-width');
    };
  }, [width]);

  // Drag the left edge. Moves are batched to one update per frame, since each
  // one re-lays out the page beside the panel; the width is saved on release.
  const startResize = event => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    let latest = clampWidth(width);
    let frame = null;
    const onMove = moveEvent => {
      // Only a real drag raises the sheet: raised on mousedown it would take
      // the second click of a double-click (the reset).
      setResizing(true);
      latest = clampWidth(window.innerWidth - moveEvent.clientX);
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          frame = null;
          setWidth(latest);
        });
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      if (latest !== clampWidth(width)) {
        setWidth(latest);
        writeWidth(latest);
      }
      setResizing(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const resizeTo = next => {
    const clamped = clampWidth(next);
    setWidth(clamped);
    writeWidth(clamped);
  };

  // The edge is focusable, so the width can be changed from the keyboard too.
  const handleResizeKey = event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      resizeTo(clampWidth(width) + KEY_STEP);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      resizeTo(clampWidth(width) - KEY_STEP);
    }
  };

  const toggle = next => {
    setOpen(next);
    if (next) {
      setUnread(false);
    }
  };

  const handleAgentActivity = () => {
    if (!openRef.current) {
      setUnread(true);
    }
  };

  // The full page is this same thread with room; showing both would mean two
  // subscriptions to one chat.
  if (onAgentPage || !app) {
    return null;
  }

  return (
    <aside className={`${styles.panel} ${open ? '' : styles.collapsed}`}>
      <button
        type="button"
        className={`${styles.strip} ${unread ? styles.unread : ''}`}
        onClick={() => toggle(true)}
        title="Open the Backend Agent"
      >
        <span className={styles.badge} />
        <Icon name="b4a-ai" width={20} height={20} fill="#ffffff" />
        <span className={styles.stripLabel}>Backend Agent</span>
      </button>
      <div className={styles.body}>
        <div
          className={styles.resizer}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the Backend Agent panel"
          aria-valuenow={clampWidth(width)}
          aria-valuemin={MIN_WIDTH}
          tabIndex={0}
          title="Drag to resize · double-click to reset"
          onMouseDown={startResize}
          onDoubleClick={() => resizeTo(DEFAULT_WIDTH)}
          onKeyDown={handleResizeKey}
        />
        {/* While dragging, a sheet over the whole window keeps the cursor and
            the mouse events — otherwise the code editors in the chat and the
            page swallow them and text gets selected along the way. */}
        {resizing ? <div className={styles.resizeSheet} /> : null}
        <div className={styles.head}>
          <span className={styles.title}>
            <Icon name="b4a-ai" width={18} height={18} fill="#C1E2FF" />
            Backend Agent
          </span>
          {/* Destructive and owner-only server-side; isOwner comes from the API
              and undefined means "not selected", not "collaborator". */}
          {agent && agent.isOwner !== false ? (
            <>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.first}`}
                onClick={() => chatRef.current && chatRef.current.openNewAgentDialog()}
                title="New agent — start fresh (switches the LLM key/provider; the conversation is lost)"
                aria-label="New agent"
              >
                <Icon name="b4a-refresh-icon" fill="#ffffff" width={16} height={16} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => chatRef.current && chatRef.current.deleteAgent()}
                title="Delete this agent and its conversation"
                aria-label="Delete agent"
              >
                <Icon name="b4a-delete-icon" fill="#E85C3E" width={20} height={16} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.minimize} ${agent && agent.isOwner !== false ? '' : styles.first}`}
            onClick={() => toggle(false)}
            title="Minimize"
            aria-label="Minimize"
          >
            <Icon name="b4a-collapse-sidebar" width={20} height={20} fill="#ffffff" />
          </button>
        </div>
        <div className={styles.chat}>
          <AgentChat
            ref={chatRef}
            variant="panel"
            onAgentActivity={handleAgentActivity}
            onAgentChange={setAgent}
          />
        </div>
      </div>
    </aside>
  );
}

export default AgentPanel;
