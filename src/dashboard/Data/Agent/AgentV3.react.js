/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Markdown from 'components/Markdown/Markdown.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import AppOverviewCodeEditorBlock from 'dashboard/Data/AppOverview/AppOverviewCodeEditorBlock.react';
import { CurrentApp } from 'context/currentApp';
import { withRouter } from 'lib/withRouter';
import { getBack4app2 } from 'lib/back4app2Client';
import { ChatMessageStatus } from '@back4app2/sdk';
import styles from './Agent.scss';

const IN_PROGRESS = [
  ChatMessageStatus.INITIALIZING,
  ChatMessageStatus.INITIALIZED,
  ChatMessageStatus.RESPONDING,
];

/**
 * AI Agent V3 chat, scoped to the current Parse app.
 *
 * Consumes the back4app2 SDK directly (GraphQL + graphql-ws), authenticated via
 * the shared `connect.sid` session cookie from the navbar. Resolves the V3 agent
 * bound to this app (agent.currentAppId === app.appId), then streams its chat.
 * Only the chat is used here — no preview/sandbox/hosting.
 */
@withRouter
class AgentV3 extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Agent';
    this.subsection = 'AI Agent';
    this.state = {
      agent: null,
      chatId: null,
      messages: [],
      inputValue: '',
      isLoading: true,
      isSending: false,
      error: null,
    };
    this.chatWindowRef = React.createRef();
    this.chatInputRef = React.createRef();
    this.subscription = null;
    this._loadedAppId = null;
  }

  componentDidMount() {
    this._loadedAppId = this.context ? this.context.appId : null;
    this.init();
  }

  componentDidUpdate() {
    // The view is reused across apps — reload when the app changes.
    const appId = this.context ? this.context.appId : null;
    if (appId !== this._loadedAppId) {
      this._loadedAppId = appId;
      this.teardown();
      this.setState({ agent: null, chatId: null, messages: [], error: null, isLoading: true }, () => this.init());
    }
  }

  componentWillUnmount() {
    this.teardown();
  }

  teardown() {
    if (this.subscription) {
      try { this.subscription.unsubscribe(); } catch (e) { /* noop */ }
      this.subscription = null;
    }
  }

  async init() {
    const appId = this.context ? this.context.appId : null;
    if (!appId) {
      this.setState({ isLoading: false, error: 'App context not available' });
      return;
    }
    try {
      const sdk = getBack4app2();
      const agents = await sdk.findAgents('V3');
      const agent = (agents || []).find(a => a.currentAppId === appId) || null;
      if (!agent || !agent.mainChat) {
        this.setState({ isLoading: false, agent: null, chatId: null });
        return;
      }
      const chatId = agent.mainChat.id;
      const history = await sdk.findChatMessages(chatId);
      this.setState({ agent, chatId, messages: history || [], isLoading: false }, () => this.scrollToBottom());
      this.subscribe(chatId);
    } catch (error) {
      this.setState({ isLoading: false, error: error.message || String(error) });
    }
  }

  subscribe(chatId) {
    const sdk = getBack4app2();
    this.subscription = sdk.subscribeToChatMessageEvents(chatId, (error, event) => {
      if (error) {
        this.setState({ error: error.message || 'Connection error' });
        return;
      }
      if (!event || !event.object) { return; }
      this.upsertMessage(event.object);
    });
  }

  upsertMessage(msg) {
    this.setState(prev => {
      const idx = prev.messages.findIndex(m => m.id === msg.id);
      let messages;
      if (idx >= 0) {
        messages = prev.messages.slice();
        messages[idx] = msg;
      } else {
        messages = prev.messages.concat([msg]);
      }
      return { messages };
    }, () => this.scrollToBottom());
  }

  handleInputChange = event => this.setState({ inputValue: event.target.value });

  handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSubmit(event);
    }
  };

  handleSubmit = async event => {
    if (event) { event.preventDefault(); }
    const { inputValue, agent, isSending } = this.state;
    const question = inputValue.trim();
    if (!question || !agent || isSending) { return; }
    this.setState({ inputValue: '', isSending: true, error: null });
    try {
      // Optimistically show the question; the subscription streams the response.
      const created = await getBack4app2().askQuestionToAgent(agent.id, question);
      this.upsertMessage(created);
    } catch (error) {
      this.setState({ error: error.message || String(error) });
    } finally {
      this.setState({ isSending: false });
    }
  };

  scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.chatWindowRef.current;
      if (el) { el.scrollTop = el.scrollHeight; }
    });
  }

  // Render fenced code blocks with the read-only Monaco editor; prose via Markdown.
  formatMessageContent(content) {
    const text = String(content || '');
    const fence = /```(\w*)[ \t]*\r?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = fence.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) { parts.push(<Markdown key={`t${key++}`} content={before} />); }
      const lang = match[1] || 'plaintext';
      const code = match[2].replace(/\n$/, '');
      parts.push(<AppOverviewCodeEditorBlock key={`c${key++}`} language={lang} value={code} />);
      lastIndex = fence.lastIndex;
    }
    const rest = text.slice(lastIndex);
    if (rest.trim()) { parts.push(<Markdown key={`t${key++}`} content={rest} />); }
    if (parts.length === 0) { return <Markdown content={text} />; }
    return <>{parts}</>;
  }

  renderToolbar() {
    return <Toolbar section="Agent" subsection="AI Agent" />;
  }

  renderMessages() {
    const { messages } = this.state;
    return (
      <div className={styles.messagesContainer}>
        {messages.map(m => {
          const inProgress = IN_PROGRESS.indexOf(m.status) !== -1;
          const failed = m.status === ChatMessageStatus.FAILED || !!m.error;
          return (
            <React.Fragment key={m.id}>
              {m.question ? (
                <div className={`${styles.message} ${styles.user}`}>
                  <div className={styles.messageContent}>{m.question}</div>
                </div>
              ) : null}
              <div className={`${styles.message} ${styles.agent} ${failed ? styles.error : ''}`}>
                <div className={styles.messageContent}>
                  {failed
                    ? `Error: ${(m.error && m.error.message) || 'The agent failed to respond.'}`
                    : m.aiResponse
                      ? this.formatMessageContent(m.aiResponse)
                      : (
                        <div className={styles.typing}>
                          <span></span><span></span><span></span>
                        </div>
                      )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  renderChatInput() {
    const { inputValue, isSending, agent } = this.state;
    return (
      <form className={styles.chatForm} onSubmit={this.handleSubmit}>
        <div className={styles.inputContainer}>
          <textarea
            ref={this.chatInputRef}
            className={styles.chatInput}
            placeholder="Type your message here…  (Shift+Enter for a new line)"
            value={inputValue}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            disabled={!agent || isSending}
            rows={1}
            autoFocus
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!agent || isSending || inputValue.trim() === ''}
          >
            Send
          </button>
        </div>
      </form>
    );
  }

  render() {
    const { messages, isLoading, agent, error } = this.state;
    const hasAgent = !!agent;

    return (
      <div className={styles.agentContainer}>
        {this.renderToolbar()}
        <div className={styles.chatContainer}>
          <div ref={this.chatWindowRef} className={styles.chatWindow}>
            {hasAgent && messages.length > 0 ? this.renderMessages() : null}
          </div>
          {hasAgent ? this.renderChatInput() : null}
        </div>

        {(!hasAgent || messages.length === 0) && (
          <div className={styles.emptyStateOverlay}>
            <B4aEmptyState
              title="AI Agent"
              description={
                isLoading
                  ? 'Loading…'
                  : error
                    ? `Couldn't load the agent: ${error}`
                    : hasAgent
                      ? 'Ask the AI agent anything about this app to get started.'
                      : 'No AI agent is set up for this app yet.'
              }
            />
          </div>
        )}
      </div>
    );
  }
}

export default AgentV3;
