/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * Service class for handling AI agent API requests.
 *
 * The request is sent to the back4app API (via the app context), which runs the
 * agent server-side and reads the OpenAI key from the app's own env var. NO
 * secret (API key) is sent from the browser here.
 */
export default class AgentService {
  /**
   * Send a message to the configured AI model and get a response.
   * @param {string} message - The user's message
   * @param {Object} modelConfig - The model configuration object (name/provider/model)
   * @param {Object} app - The current app context (ParseApp) with sendAgentMessage()
   * @param {Object} permissions - Permission settings for operations
   * @param {Array} history - Recent conversation history [{role, content}]
   * @returns {Promise<{response: string, conversationId: null}>} The AI's response
   */
  static async sendMessage(message, modelConfig, app, permissions = {}, history = []) {
    if (!modelConfig) {
      throw new Error('Model configuration is required');
    }

    const { name } = modelConfig;

    if (!name) {
      throw new Error('Model name is required in model configuration');
    }

    if (!app || typeof app.sendAgentMessage !== 'function') {
      throw new Error('App context is required to send message to agent');
    }

    try {
      const response = await app.sendAgentMessage({
        message,
        modelName: name,
        permissions: permissions || {},
        history: history || [],
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      return {
        response: response.response,
        // The server-side agent is stateless (history is sent by the client), so
        // there is no server conversation id.
        conversationId: null,
      };
    } catch (error) {
      // Handle specific error types
      if (error.message && error.message.includes('Permission Denied')) {
        throw new Error('Permission denied. Please refresh the page and try again.');
      }

      if (error.message && error.message.includes('CSRF')) {
        throw new Error('Security token expired. Please refresh the page and try again.');
      }

      // Handle network errors and other fetch-related errors
      if (error.message && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to agent service. Please check your internet connection.');
      }

      // Re-throw the original error if it's not a recognized type
      throw error;
    }
  }

  /**
   * Validate model configuration
   * @param {Object} modelConfig - The model configuration object
   * @returns {boolean} True if valid, throws error if invalid
   */
  static validateModelConfig(modelConfig) {
    if (!modelConfig) {
      throw new Error('Model configuration is required');
    }

    // The API key is NOT required client-side anymore: it lives in the app env
    // var and is used server-side. We only validate the non-secret fields.
    const { name, provider, model } = modelConfig;

    if (!name) {
      throw new Error('Model name is required in model configuration');
    }

    if (!provider) {
      throw new Error('Provider is required in model configuration');
    }

    if (!model) {
      throw new Error('Model name is required in model configuration');
    }

    return true;
  }

}
