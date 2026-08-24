/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import BrowserMenu from 'components/BrowserMenu/BrowserMenu.react';
import DashboardView from 'dashboard/DashboardView.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import Icon from 'components/Icon/Icon.react';
import Markdown from 'components/Markdown/Markdown.react';
import MenuItem from 'components/BrowserMenu/MenuItem.react';
import React from 'react';
import SidebarAction from 'components/Sidebar/SidebarAction';
import Toolbar from 'components/Toolbar/Toolbar.react';
import AgentService from 'lib/AgentService';
import AgentConfigDialog from './AgentConfigDialog.react';
import styles from './Agent.scss';
import { withRouter } from 'lib/withRouter';
import { CurrentApp } from 'context/currentApp';

// The app environment variable (Cloud Code env) where the user's OpenAI API key
// is stored, instead of localStorage.
const AGENT_ENV_KEY = 'OPENAI_API_KEY';
// The model list (name/provider/model) is stored as an app env var too, so the
// whole agent config is per-app on the backend and never bleeds between apps.
const AGENT_MODELS_ENV_KEY = 'AGENT_MODELS';

@withRouter
class Agent extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Agent';
    this.subsection = 'Agent';

    this.state = {
      messages: [],
      inputValue: '',
      isLoading: false,
      selectedModel: this.getStoredSelectedModel(),
      conversationId: null,
      permissions: this.getStoredPermissions(),
      // Force re-render key
      permissionsKey: 0,
      // User-provided agent config (from the in-UI Configure dialog), loaded on mount
      userAgentConfig: null,
      showConfigDialog: false,
    };

    this.browserMenuRef = React.createRef();
    this.chatInputRef = React.createRef();
    this.chatWindowRef = React.createRef();
    this.action = new SidebarAction('Clear Chat', () => this.clearChat());
  }

  selectedModelStorageKey() {
    const appSlug = this.context ? this.context.slug : null;
    return appSlug ? `selectedAgentModel_${appSlug}` : null;
  }

  getStoredSelectedModel() {
    const key = this.selectedModelStorageKey();
    return key ? localStorage.getItem(key) : null;
  }

  getStoredPermissions() {
    try {
      const stored = localStorage.getItem('agentPermissions');
      return stored ? JSON.parse(stored) : {
        deleteObject: false,
        deleteClass: false,
        updateObject: false,
        createObject: false,
        createClass: false,
      };
    } catch (error) {
      console.warn('Failed to parse stored permissions, using defaults:', error);
      return {
        deleteObject: false,
        deleteClass: false,
        updateObject: false,
        createObject: false,
        createClass: false,
      };
    }
  }

  // Save the config: a shared API key + a list of models. BOTH are stored as app
  // env vars (Cloud Code env) — the key in OPENAI_API_KEY and the (non-secret)
  // model list in AGENT_MODELS. Nothing lives in localStorage, so the whole
  // config is per-app on the backend and never bleeds between apps. Returns a
  // promise so the dialog can show "Saving…" and surface errors while the app
  // rebuilds.
  saveAgentConfig = async ({ apiKey, models }) => {
    const cleanModels = (models || []).map(m => ({
      name: m.name,
      provider: m.provider || 'openai',
      model: m.model,
    }));

    // Store the shared API key AND the model list as app env vars, merging with
    // the existing ones.
    if (this.context && this.context.getEnvVars && this.context.updateEnvVars) {
      const existing = await this.context.getEnvVars();
      const envVars = (existing && existing.envVars) || {};
      const next = { ...envVars, [AGENT_MODELS_ENV_KEY]: JSON.stringify(cleanModels) };
      if (apiKey) {
        next[AGENT_ENV_KEY] = apiKey;
      }
      await this.context.updateEnvVars(next);
    }

    // Keep the full config (each model carries the shared key) in memory.
    const config = { models: cleanModels.map(m => ({ ...m, apiKey })) };
    this.setState({ userAgentConfig: config }, () => {
      if (cleanModels[0]) {
        this.setSelectedModel(cleanModels[0].name);
      }
    });
  }

  // Load the effective config entirely from the app environment variables: the
  // model list from AGENT_MODELS + the shared API key from OPENAI_API_KEY. Both
  // are per-app on the backend.
  async loadAgentConfig() {
    let apiKey;
    let models = [];
    try {
      if (this.context && this.context.getEnvVars) {
        const existing = await this.context.getEnvVars();
        const envVars = (existing && existing.envVars) || {};
        apiKey = envVars[AGENT_ENV_KEY];
        const rawModels = envVars[AGENT_MODELS_ENV_KEY];
        if (rawModels) {
          try {
            const parsed = JSON.parse(rawModels);
            if (Array.isArray(parsed)) {
              models = parsed;
            }
          } catch (error) {
            console.warn('Failed to parse AGENT_MODELS env var:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read agent config from env vars:', error);
    }

    if (models.length > 0 && apiKey) {
      const config = {
        models: models.map(m => ({
          name: m.name,
          provider: m.provider || 'openai',
          model: m.model,
          apiKey,
        })),
      };
      this.setState({ userAgentConfig: config }, () => this.setDefaultModel());
    } else {
      this.setState({ userAgentConfig: null }, () => this.setDefaultModel());
    }
  }

  // Effective config: user-provided (localStorage) takes precedence over the
  // dashboard config file (props.agentConfig).
  getAgentConfig() {
    return this.state.userAgentConfig || this.props.agentConfig;
  }

  setPermission = (operation, enabled) => {
    this.setState(prevState => {
      const newPermissions = {
        ...prevState.permissions,
        [operation]: enabled
      };

      // Save to localStorage immediately
      localStorage.setItem('agentPermissions', JSON.stringify(newPermissions));

      return {
        permissions: newPermissions,
        permissionsKey: prevState.permissionsKey + 1
      };
    });
  }

  getStoredChatState() {
    try {
      const appSlug = this.context ? this.context.slug : null;
      if (!appSlug) {return null;}

      const stored = localStorage.getItem(`agentChat_${appSlug}`);
      if (!stored) {return null;}

      const parsedState = JSON.parse(stored);

      // Validate the structure
      if (!parsedState || typeof parsedState !== 'object') {return null;}
      if (!Array.isArray(parsedState.messages)) {return null;}

      // Check if the data is too old (optional: 24 hours expiry)
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (parsedState.timestamp && (Date.now() - parsedState.timestamp > ONE_DAY)) {
        localStorage.removeItem(`agentChat_${appSlug}`);
        return null;
      }

      return parsedState;
    } catch (error) {
      console.warn('Failed to parse stored chat state:', error);
      return null;
    }
  }

  saveChatState() {
    try {
      const appSlug = this.context ? this.context.slug : null;
      if (!appSlug) {return;}

      const chatState = {
        messages: this.state.messages,
        conversationId: this.state.conversationId,
        timestamp: Date.now()
      };
      localStorage.setItem(`agentChat_${appSlug}`, JSON.stringify(chatState));
    } catch (error) {
      console.warn('Failed to save chat state:', error);
    }
  }

  componentDidMount() {
    // Fix the routing issue by ensuring this.state.route is set to 'agent'
    if (this.state.route !== 'agent') {
      this.setState({ route: 'agent' });
    }

    // Load user-provided agent config (non-secret parts from localStorage, API
    // key from the app env var) now that the app context (slug) is available.
    this._loadedSlug = this.context ? this.context.slug : null;
    this.loadAgentConfig();

    // Load saved chat state after component mounts when context is available
    this.loadSavedChatState();
  }

  loadSavedChatState() {
    const savedChatState = this.getStoredChatState();
    if (savedChatState && savedChatState.messages && savedChatState.messages.length > 0) {
      // Convert timestamp strings back to Date objects
      const messagesWithDateTimestamps = savedChatState.messages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }));

      this.setState({
        messages: messagesWithDateTimestamps,
        conversationId: savedChatState.conversationId || null,
      });
    }
  }

  componentWillUnmount() {
    // Save chat state when component unmounts (navigation away)
    this.saveChatState();
  }

  componentDidUpdate(prevProps, prevState) {
    // The Agent component instance is reused when switching apps (only the app
    // context/slug changes, not the mounted component). Reset per-app in-memory
    // state and reload from the new app's storage so the previous app's model
    // name / config / chat don't bleed across apps.
    const currentSlug = this.context ? this.context.slug : null;
    if (currentSlug !== this._loadedSlug) {
      this._loadedSlug = currentSlug;
      this.setState(
        { selectedModel: null, userAgentConfig: null, messages: [], conversationId: null },
        () => {
          this.loadAgentConfig();
          this.loadSavedChatState();
        }
      );
      return;
    }

    // If agentConfig just became available, set default model
    if (!prevProps.agentConfig && this.props.agentConfig) {
      this.setDefaultModel();
    }

    // Save chat state when messages change
    if (prevState.messages.length !== this.state.messages.length ||
        prevState.conversationId !== this.state.conversationId) {
      this.saveChatState();
    }

    // Auto-scroll to bottom when new messages are added or loading state changes
    if (prevState.messages.length !== this.state.messages.length ||
        prevState.isLoading !== this.state.isLoading) {
      // Use requestAnimationFrame and setTimeout to ensure DOM has updated
      requestAnimationFrame(() => {
        setTimeout(() => this.scrollToBottom(), 50);
      });
    }
  }

  setDefaultModel() {
    // Pick the selected model when none is set. Prefer the per-app stored choice
    // (the constructor can't read it — no app slug yet); fall back to the first.
    const agentConfig = this.getAgentConfig();
    const { selectedModel } = this.state;
    const models = agentConfig?.models || [];

    if (!selectedModel && models.length > 0) {
      const stored = this.getStoredSelectedModel();
      const valid = stored && models.some(m => m.name === stored);
      this.setSelectedModel(valid ? stored : models[0].name);
    }
  }

  setSelectedModel(modelName) {
    this.setState({ selectedModel: modelName });
    const key = this.selectedModelStorageKey();
    if (key) {
      localStorage.setItem(key, modelName);
    }
  }

  scrollToBottom() {
    if (this.chatWindowRef.current) {
      const element = this.chatWindowRef.current;
      element.scrollTop = element.scrollHeight;

      // Force smooth scrolling behavior
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  clearChat() {
    this.setState({
      messages: [],
      conversationId: null, // Reset conversation to start fresh
    });

    // Clear saved chat state from localStorage
    try {
      const appSlug = this.context ? this.context.slug : null;
      if (appSlug) {
        localStorage.removeItem(`agentChat_${appSlug}`);
      }
    } catch (error) {
      console.warn('Failed to clear saved chat state:', error);
    }

    // Close the menu by simulating an external click
    if (this.browserMenuRef.current) {
      this.browserMenuRef.current.setState({ open: false });
    }
  }

  handleInputChange = (event) => {
    this.setState({ inputValue: event.target.value });
  }

  handleExampleClick = (exampleText) => {
    this.setState({ inputValue: exampleText }, () => {
      // Auto-submit the example query
      const event = { preventDefault: () => {} };
      this.handleSubmit(event);
    });
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const { inputValue, selectedModel, messages } = this.state;
    const agentConfig = this.getAgentConfig();

    if (inputValue.trim() === '') {
      return;
    }

    // Find the selected model configuration
    const models = agentConfig?.models || [];
    const modelConfig = models.find(model => model.name === selectedModel) || models[0];

    if (!modelConfig) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'No AI model is configured. Please check your dashboard configuration.',
        timestamp: new Date(),
        isError: true,
      };

      this.setState(prevState => ({
        messages: [...prevState.messages, errorMessage],
        isLoading: false,
      }));
      return;
    }

    // Add warning message if this is the first message in the conversation
    const isFirstMessage = messages.length === 0;
    const messagesToAdd = [];

    if (isFirstMessage) {
      const warningMessage = {
        id: Date.now() - 1,
        type: 'warning',
        content: 'The AI agent has full access to your database using the master key. It can read, modify, and delete any data. This feature is highly recommended for development environments only. Always back up important data before using the AI agent. Use the permissions menu to restrict operations.',
        timestamp: new Date(),
      };
      messagesToAdd.push(warningMessage);
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    messagesToAdd.push(userMessage);

    this.setState(prevState => ({
      messages: [...prevState.messages, ...messagesToAdd],
      inputValue: '',
      isLoading: true,
    }));

    try {
      // Validate model configuration
      AgentService.validateModelConfig(modelConfig);

      // Get app slug from context
      const appSlug = this.context ? this.context.slug : null;
      if (!appSlug) {
        throw new Error('App context not available');
      }

      // Get response from AI service with conversation context
      const result = await AgentService.sendMessage(
        inputValue.trim(),
        modelConfig,
        appSlug,
        this.state.conversationId,
        this.state.permissions
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: result.response,
        timestamp: new Date(),
      };

      this.setState(prevState => ({
        messages: [...prevState.messages, aiMessage],
        isLoading: false,
        conversationId: result.conversationId, // Update conversation ID
      }));

    } catch (error) {
      console.error('Agent API error:', error);

      let errorContent = `Error: ${error.message}`;

      // Handle specific error types
      if (error.message && error.message.includes('Permission Denied')) {
        errorContent = 'Error: Permission denied. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('CSRF')) {
        errorContent = 'Error: Security token expired. Please refresh the page and try again.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      };

      this.setState(prevState => ({
        messages: [...prevState.messages, errorMessage],
        isLoading: false,
      }));
    }

    // Focus the input field after the response
    setTimeout(() => {
      if (this.chatInputRef.current) {
        this.chatInputRef.current.focus();
      }
    }, 100);
  }

  renderToolbar() {
    const agentConfig = this.getAgentConfig();
    const { selectedModel, permissions, permissionsKey } = this.state;
    const models = agentConfig?.models || [];

    const permissionOperations = [
      { key: 'deleteObject', label: 'Delete Objects' },
      { key: 'deleteClass', label: 'Delete Classes' },
      { key: 'updateObject', label: 'Update Objects' },
      { key: 'createObject', label: 'Create Objects' },
      { key: 'createClass', label: 'Create Classes' },
    ];

    return (
      <Toolbar section="Agent" subsection="AI Agent">
        {models.length > 0 && (
          <BrowserMenu
            title="Select AI model"
            icon="b4a-app-settings-icon"
            setCurrent={() => {}}
          >
            {models.map((model, index) => (
              <MenuItem
                key={index}
                text={
                  <span>
                    {selectedModel === model.name && (
                      <Icon
                        name="check"
                        width={12}
                        height={12}
                        fill="#ffffffff"
                        className="menuCheck"
                      />
                    )}
                    {model.name}
                  </span>
                }
                onClick={() => this.setSelectedModel(model.name)}
              />
            ))}
          </BrowserMenu>
        )}
        {selectedModel && models.some(m => m.name === selectedModel) && (
          <span
            className={styles.activeModel}
            title={`Active model: ${(models.find(m => m.name === selectedModel) || {}).model || ''}`}
          >
            {selectedModel}
          </span>
        )}
        <BrowserMenu
          key={`permissions-${permissionsKey}`}
          title="Permissions — what the agent can do in your database"
          icon="b4a-lock-icon"
          setCurrent={() => {}}
        >
          {permissionOperations.map((operation) => (
            <MenuItem
              key={operation.key}
              active={permissions[operation.key]}
              text={
                <span>
                  {permissions[operation.key] && (
                    <Icon
                      name="check"
                      width={12}
                      height={12}
                      fill="#ffffffff"
                      className="menuCheck"
                    />
                  )}
                  {operation.label}
                </span>
              }
              onClick={() => {
                this.setPermission(operation.key, !permissions[operation.key]);
              }}
            />
          ))}
        </BrowserMenu>
        <a
          className={styles.toolbarAction}
          title="Add / configure models"
          onClick={() => this.setState({ showConfigDialog: true })}
        >
          <Icon name="b4a-add-outline-circle" width={18} height={18} fill="#ffffff" />
        </a>
        <a
          className={styles.toolbarAction}
          title="Clear conversation"
          onClick={() => this.clearChat()}
        >
          Clear
        </a>
      </Toolbar>
    );
  }

  formatMessageContent(content) {
    // Use the existing Markdown component to render the content
    return <Markdown content={content} />;
  }

  renderMessages() {
    const { messages, isLoading } = this.state;

    if (messages.length === 0) {
      return null; // Empty state is now handled as overlay
    }

    return (
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.type]} ${message.isError ? styles.error : ''} ${message.type === 'warning' ? styles.warningMessage : ''}`}
          >
            {message.type === 'warning' ? (
              <>
                <Icon name="warn-outline" width={16} height={16} fill="#856404" className={styles.warningIcon} />
                <div className={styles.warningContent}>
                  {message.content}
                </div>
              </>
            ) : (
              <>
                <div className={styles.messageContent}>
                  {message.type === 'agent' ? this.formatMessageContent(message.content) : message.content}
                </div>
                <div className={styles.messageTime}>
                  {message.timestamp instanceof Date ?
                    message.timestamp.toLocaleTimeString() :
                    new Date(message.timestamp).toLocaleTimeString()
                  }
                </div>
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.agent}`}>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  renderChatInput() {
    const { inputValue, isLoading } = this.state;

    return (
      <form className={styles.chatForm} onSubmit={this.handleSubmit}>
        <div className={styles.inputContainer}>
          <input
            ref={this.chatInputRef}
            type="text"
            className={styles.chatInput}
            placeholder="Type your message here..."
            value={inputValue}
            onChange={this.handleInputChange}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={isLoading || inputValue.trim() === ''}
          >
            Send
          </button>
        </div>
      </form>
    );
  }

  renderContent() {
    const { messages } = this.state;
    const agentConfig = this.getAgentConfig();
    const models = agentConfig?.models || [];

    // Check if agent configuration is missing or no models are configured
    const hasNoAgentConfig = !agentConfig;
    const hasNoModels = models.length === 0;

    return (
      <div className={styles.agentContainer}>
        {this.renderToolbar()}
        <div className={styles.chatContainer}>
          <div ref={this.chatWindowRef} className={styles.chatWindow}>
            {this.renderMessages()}
          </div>
          {!hasNoAgentConfig && !hasNoModels && this.renderChatInput()}
        </div>
        {messages.length === 0 && (
          <div className={styles.emptyStateOverlay}>
            {hasNoAgentConfig || hasNoModels ? (
              <B4aEmptyState
                title="AI Agent"
                description={
                  hasNoAgentConfig
                    ? 'No AI agent configured yet. Configure your own OpenAI credentials to start using the agent.'
                    : 'No AI models configured. Configure a model to start using the agent.'
                }
                cta="Configure"
                action={() => this.setState({ showConfigDialog: true })}
              />
            ) : (
              <div className={styles.welcomeState}>
                <B4aEmptyState
                  title="AI Agent"
                  description="Start a conversation with the AI agent to get help with your database queries and operations. The agent can query your Parse classes, create and update objects, analyze your schema, and provide Parse Server guidance."
                />
                <div className={styles.exampleQueries}>
                  <h4>Try asking:</h4>
                  <div className={styles.queryExamples}>
                    <button
                      className={styles.exampleButton}
                      onClick={() => this.handleExampleClick('How many users do I have?')}
                    >
                      &ldquo;How many users do I have?&rdquo;
                    </button>
                    <button
                      className={styles.exampleButton}
                      onClick={() => this.handleExampleClick('What classes do I have in my database?')}
                    >
                      &ldquo;What classes do I have in my database?&rdquo;
                    </button>
                    <button
                      className={styles.exampleButton}
                      onClick={() => this.handleExampleClick('Can you fill a class with test data?')}
                    >
                      &ldquo;Can you fill a class with test data?&rdquo;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <AgentConfigDialog
          open={this.state.showConfigDialog}
          initialModels={this.getAgentConfig()?.models || []}
          initialApiKey={(this.getAgentConfig()?.models || [])[0]?.apiKey}
          onConfirm={this.saveAgentConfig}
          onClose={() => this.setState({ showConfigDialog: false })}
        />
      </div>
    );
  }
}

export default Agent;
