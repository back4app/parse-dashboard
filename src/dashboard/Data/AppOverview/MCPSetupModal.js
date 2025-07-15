import React, { useEffect, useState } from 'react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';
import Button from 'components/Button/Button.react';
import B4aTabToggle from 'components/Toggle/B4aTabToggle.react';

import Prism from 'prismjs';
import 'prismjs/components/prism-markup-templating.js';
// eslint-disable-next-line no-unused-vars
import customPrisma from 'stylesheets/b4a-prisma.css';

const origin = new Position(0, 0);

const CodeBlock = ({ language, value, fileName, inline = false }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [value, language]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (inline) {
    return (
      <div className={styles.inlineCode}>
        {value} <button className={styles.copyButton} onClick={copyToClipboard} title="Copy to clipboard">
          <Icon
            name={`${copied ? 'b4a-check-icon' : 'b4a-copy-icon'}`}
            fill={copied ? '#27AE60' : '#C1E2FF'}
            width={14}
            height={14}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <div className={styles.languageLabel}>{fileName ? fileName : language}</div>
        <div className={styles.copyButtonWrapper}>
          {copied && (
            <div className={styles.copyTooltip}>
              Copied!
            </div>
          )}
          <button className={styles.copyButton} onClick={copyToClipboard} title="Copy to clipboard">
            <Icon
              name={`${copied ? 'b4a-check-icon' : 'b4a-copy-icon'}`}
              fill={copied ? '#27AE60' : '#C1E2FF'}
              width={14}
              height={14}
            />
          </button>
        </div>
      </div>
      <pre className="line-numbers">
        <code className={`language-${language}`}>{value}</code>
      </pre>
    </div>
  );
};

const getManualJsonContent = (ide, mcpKey, isLinux) => {
  if (ide === 'cursor' && isLinux) {
    return `{
  "mcpServers": {
    "back4app": {
      "command": "npx",
      "args": [
        "-y",
        "@back4app/mcp-server-back4app@latest",
        "--account-key",
        "${mcpKey}"
      ]
    }
  }
}`
  } else if (ide === 'cursor' && !isLinux) {
    return `{
  "mcpServers": {
    "back4app": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "@back4app/mcp-server-back4app@latest",
        "--account-key",
        "${mcpKey}"
      ]
    }
  }
}`
  } else if (ide === 'windsurf' && isLinux) {
    return `{
  "mcpServers": {
    "back4app": {
      "command": "npx",
      "args": [
        "-y",
        "@back4app/mcp-server-back4app@latest",
        "--account-key",
        "${mcpKey}"
      ]
    }
  }
}`
  } else if (ide === 'windsurf' && !isLinux) {
    return `{
  "mcpServers": {
    "back4app": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "@back4app/mcp-server-back4app@latest",
        "--account-key",
        "${mcpKey}"
      ]
    }
  }
}`
  } else if (ide === 'vscode' && isLinux) {
    return `{
  "inputs": [
    {
      "type": "promptString",
      "id": "back4app-account-key",
      "description": "Back4App personal access token",
      "password": true
    }
  ],
  "servers": {
    "back4app": {
      "command": "npx",
      "args": ["-y", "@back4app/mcp-server-back4app@latest"],
      "env": {
        "BACK4APP_ACCOUNT_KEY": "\${input:${mcpKey}}"
      }
    }
  }
}`
  } else if (ide === 'vscode' && !isLinux) {
    return `{
  "inputs": [
    {
      "type": "promptString",
      "id": "back4app-account-key",
      "description": "Back4App personal access token",
      "password": true
    }
  ],
  "servers": {
    "back4app": {
      "command": "npx.cmd",
      "args": ["-y", "@back4app/mcp-server-back4app@latest"],
      "env": {
        "BACK4APP_ACCOUNT_KEY": "\${input:${mcpKey}}"
      }
    }
  }
}`
  }
}

const getVerifyContent = (ide) => {
  if (ide === 'cursor') {
    return <div className={styles.text}>Navigate to: <strong>Cursor &gt; Full Settings &gt; MCP</strong></div>
  } else if (ide === 'windsurf') {
    return <div className={styles.text}>Navigate to: <strong>Windsurf &gt; Find the toolbar above the Cascade input and click on refresh</strong></div>
  } else if (ide === 'vscode') {
    return <div className={styles.text}>Navigate to: <strong>VSCode &gt; Click on configure tools on the Agent Mode (Copilot) and find the back4app MCP tools.</strong></div>
  }
}

const getManualInstructions = (ide) => {
  if (ide === 'cursor') {
    return <>
      <div className={styles.step}>1. Open MCP Settings</div>
      <div className={styles.text}>Navigate to: <strong>Cursor-&gt;Settings-&gt;Cursor Settings-&gt;MCP</strong></div>

      <div style={{ margin: '1rem 0' }}></div>

      <div className={styles.step}>2. Add MCP Server Configuration</div>
      <div className={styles.text}>Click <strong>&apos;+ Add new global MCP server&apos;</strong> button.</div>
      <div className={styles.text}>Copy & Paste the code below into opened &apos;<strong>mcp.json</strong>&apos; file </div></>
  } else if (ide === 'windsurf') {
    return <>
      <div className={styles.step}>1. Open MCP Settings</div>
      <div className={styles.text}>Navigate to: <strong>Windsurf-&gt;Casade assistant</strong></div>

      <div style={{ margin: '1rem 0' }}></div>

      <div className={styles.step}>2. Add MCP Server Configuration</div>
      <div className={styles.text}>Tap on the hammer (MCP) icon, then Configure to open the configuration file</div>
      <div className={styles.text} style={{ marginTop: '.5rem' }}>Add the following configuration:</div>
    </>
  } else if (ide === 'vscode') {
    return <>
      <div className={styles.step}>1. Open MCP Settings</div>
      <div className={styles.text}>Navigate to: <strong>VSCode(Copilot)-&gt;Go to root directory of your project</strong></div>
      <div className={styles.text}>Create a .vscode folder if it doesn't exist</div>

      <div style={{ margin: '1rem 0' }}></div>

      <div className={styles.step}>2. Add MCP Server Configuration</div>
      <div className={styles.text}>Create a mcp.json file in the .vscode folder</div>
      <div className={styles.text} style={{ marginTop: '.5rem' }}>Add the following configuration:</div>
    </>
  }
}

const getIDEContent = (ide, automatic, mcpKey) => {
  if (automatic) {
    return (
      <div>
        <div className={styles.step}>1. Run the installation command</div>
        <div className={styles.text}>Copy and run the command below in your terminal to install {ide}.</div>
        <CodeBlock inline={true} value={`npx @back4app/mcp-installer install ${ide} --account-key ${mcpKey}`} />
        <div style={{ margin: '1rem 0' }}></div>
        <div className={styles.step}>2. Verify your connection</div>
        {getVerifyContent(ide)}
      </div>
    );
  } else {
    return (
      <div>
        {getManualInstructions(ide)}
        <div style={{ margin: '1rem 0' }}></div>
        <strong style={{ marginBottom: '.5rem', fontSize: '14px' }}>macOS / Linux</strong>
        <CodeBlock language="json" fileName="mcp.json" value={getManualJsonContent(ide, mcpKey, true)} />
        <div style={{ margin: '1rem 0' }}></div>
        <strong style={{ marginBottom: '.5rem', fontSize: '14px' }}>Windows</strong>
        <CodeBlock language="json" fileName="mcp.json" value={getManualJsonContent(ide, mcpKey, false)} />
      </div>
    );
  }
}

const MCPSetupModal = ({ closeModal, context }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIDE, setSelectedIDE] = useState(null);
  const [automatic, setAutomatic] = useState(true);
  const [mcpKey, setMcpKey] = useState('YOUR_ACCOUNT_KEY');

  const handleIDEClick = (ide) => {
    setSelectedIDE(ide);
    setCurrentStep(1);
  };

  useEffect(() => {
    const getMcpKey = async () => {
      try {
        const data = await context.getMcpKey();
        setMcpKey(data.key.key);
      } catch (error) {
        console.error('Failed to get MCP key: ', error);
      }
    };
    getMcpKey();
  }, []);

  let content = null;

  if (currentStep === 0) {
    content = (
      <div className={styles.mcpModalStep1}>
        <div className={styles.mcpModalTitle}>Select Your IDE</div>
        <div className={styles.mcpModalDescription}>Pick the IDE you want to use with the back4app MCP</div>
        <div className={styles.mcpChoiceList}>
          <div className={styles.mcpChoice} onClick={() => handleIDEClick('cursor')}>
            <Icon name="b4a-cursor-icon" width={60} height={60} />
            <div className={styles.mcpChoiceTitle}>Cursor</div>
          </div>
          <div className={styles.mcpChoice} onClick={() => handleIDEClick('windsurf')}>
            <Icon name="b4a-windsurf-icon" width={60} height={60} />
            <div className={styles.mcpChoiceTitle}>Windsurf</div>
          </div>
          <div className={styles.mcpChoice} onClick={() => handleIDEClick('vscode')}>
            <Icon name="b4a-vscode-icon" width={60} height={60} />
            <div className={styles.mcpChoiceTitle}>VSCode</div>
          </div>
        </div>
      </div>
    );
  } else if (currentStep === 1) {
    content = (
      <div className={styles.mcpModalStep2}>
        <div className={styles.mcpModalStep2Header}>
          <Icon name={`b4a-${selectedIDE}-icon`} width={26} height={30} fill="#C1E2FF" />
          <div className={styles.mcpModalStep2Title}>Install  MCP on {selectedIDE}</div>
        </div>
        <div className={styles.mcpModalStep2Description}>Follow the steps below to get MCP working with {selectedIDE}.</div>
        <div className={styles.mcpTabButtons}>
          <B4aTabToggle
            value={automatic ? 'Automatic' : 'Manual'}
            onChange={val => setAutomatic(val === 'Automatic')}
            optionLeft="Automatic"
            optionRight="Manual"
          />
        </div>
        {/* Step instructions go here */}
        {getIDEContent(selectedIDE, automatic, mcpKey)}

        <div className={styles.mcpModalStep2Footer} style={{ marginTop: '2rem' }}>
          <Button
            primary={true}
            value="Continue"
            onClick={() => setCurrentStep(2)}
          />
        </div>
      </div>
    );
  } else if (currentStep === 2) {
    content = (
      <div className={styles.mcpModalStep2}>
        <div className={styles.mcpModalStep2Header}>
          <div className={styles.mcpModalStep2Title}>Test your connection</div>
        </div>
        <div className={styles.mcpModalStep2Description}>Let's test your connection with back4app MCP.</div>
        <div style={{ marginTop: '2rem' }}>
          <div className={styles.step}>1. Tell your agent what you need</div>
          <div className={styles.text}>In your AI agent chat, You can use Back4App MCP to interact with your Back4App account.</div>
          <div className={styles.text} style={{ marginBottom: '.5rem' }}>Here is an example to get a list of your apps: </div>
          <CodeBlock inline={true} value={'List all of the apps in my Back4App account'} />
          <div style={{ margin: '2rem 0' }}></div>
          <div className={styles.step}>2. Refer to docs for more information</div>
          <div className={styles.text}> <a className={styles.link} href="https://www.back4app.com/docs/mcp" target="_blank" rel="noopener noreferrer">https://www.back4app.com/docs/mcp</a></div>

          <div style={{ margin: '2rem 0'}}>
            <Button
              primary={true}
              value={'Close'}
              onClick={closeModal}
            />
          </div>
        </div>
      </div>
    );
  } else {content = <div>Invalid step</div>;}

  return (
    <Popover fadeIn={true} fixed={true} position={origin} modal={true} color="rgba(17,13,17,0.8)">
      <div className={styles.mcpModal}>
        <div className={styles.closeIcon} onClick={closeModal}>
          <Icon name="close" fill="#f9f9f9" width={14} height={14} />
        </div>
        <div className={styles.mcpModalContent}>
          {content}
        </div>
      </div>
    </Popover>
  );
};

export default MCPSetupModal;

