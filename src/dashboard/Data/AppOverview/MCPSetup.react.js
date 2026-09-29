import React, { useEffect, useState } from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';
import Button from 'components/Button/Button.react';
import B4aTabToggle from 'components/Toggle/B4aTabToggle.react';
import AppOverviewCodeEditorBlock from './AppOverviewCodeEditorBlock.react';

const IDES = [
  { key: 'cursor', name: 'Cursor' },
  { key: 'vscode', name: 'VSCode' },
  { key: 'windsurf', name: 'Windsurf' },
];

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

const generateDeeplink = (ide, mcpKey) => {
  if (ide === 'cursor') {
    const config = {
      command: 'npx',
      args: [
        '-y',
        '@back4app/mcp-server-back4app@latest',
        '--account-key',
        mcpKey
      ]
    };

    const base64Config = btoa(JSON.stringify(config));
    return `cursor://anysphere.cursor-deeplink/mcp/install?name=back4app&config=${encodeURIComponent(base64Config)}`;
  } else if (ide === 'vscode') {
    const config = {
      name: 'back4app',
      command: 'npx',
      args: [
        '-y',
        '@back4app/mcp-server-back4app@latest',
        '--account-key',
        mcpKey
      ]
    };

    const encoded = encodeURIComponent(JSON.stringify(config));
    return `vscode:mcp/install?${encoded}`;
  }

  return null;
};

const getVerifyContent = (ide) => {
  if (ide === 'cursor') {
    return <div className={styles.text}><span>Navigate to: </span><strong>Cursor &gt; Full Settings &gt; MCP</strong></div>
  } else if (ide === 'windsurf') {
    return <div className={styles.text}><span>Navigate to: </span><strong>Windsurf &gt; Find the toolbar above the Cascade input and click on refresh</strong></div>
  } else if (ide === 'vscode') {
    return <div className={styles.text}><span>Navigate to: </span><strong>VSCode &gt; Click on configure tools on the Agent Mode (Copilot) and find the back4app MCP tools.</strong></div>
  }
}

const getManualInstructions = (ide) => {
  if (ide === 'cursor') {
    return <>
      <div className={styles.step}><span>1. Open MCP Settings</span></div>
      <div className={styles.text}><span>Navigate to: </span><strong>Cursor-&gt;Settings-&gt;Cursor Settings-&gt;MCP</strong></div>

      <div style={{ margin: '1rem 0' }}></div>

      <div className={styles.step}><span>2. Add MCP Server Configuration</span></div>
      <div className={styles.text}><span>Click </span><strong>&apos;+ Add new global MCP server&apos;</strong><span> button.</span></div>
      <div className={styles.text}><span>Copy &amp; Paste the code below into opened &apos;</span><strong>mcp.json</strong><span>&apos; file</span></div></>
  } else if (ide === 'windsurf') {
    return <>
      <div className={styles.step}><span>1. Open MCP Settings</span></div>
      <div className={styles.text}><span>Navigate to: </span><strong>Windsurf-&gt;Casade assistant</strong></div>

      <div style={{ margin: '1rem 0' }}></div>

      <div className={styles.step}><span>2. Add MCP Server Configuration</span></div>
      <div className={styles.text}><span>Tap on the hammer (MCP) icon, then Configure to open the configuration file</span></div>
      <div className={styles.text} style={{ marginTop: '.5rem' }}><span>Add the following configuration:</span></div>
    </>
  } else if (ide === 'vscode') {
    return <>
      <div className={styles.step}><span>1. Open MCP Settings</span></div>
      <div className={styles.text}><span>Navigate to: </span><strong>VSCode(Copilot)-&gt;Go to root directory of your project</strong></div>
      <div className={styles.text}><span>Create a .vscode folder if it doesn&apos;t exist</span></div>

      <div style={{ margin: '1rem 0' }}></div>

      <div className={styles.step}><span>2. Add MCP Server Configuration</span></div>
      <div className={styles.text}><span>Create a mcp.json file in the .vscode folder</span></div>
      <div className={styles.text} style={{ marginTop: '.5rem' }}><span>Add the following configuration:</span></div>
    </>
  }
}

const getIDEContent = (ide, automatic, mcpKey) => {
  if (automatic) {
    const deeplink = generateDeeplink(ide, mcpKey);

    return (
      <div>
        {deeplink && (
          <>
            <div className={styles.step}><span>1. One-click installation (Recommended)</span></div>
            <div className={styles.text}><span>Click the button below to automatically install and configure the MCP server:</span></div>
            <div style={{ margin: '1rem 0' }}>
              <Button
                primary={true}
                value={`Add to ${ide.charAt(0).toUpperCase() + ide.slice(1)}`}
                onClick={() => window.open(deeplink, '_self')}
              />
            </div>
            <div style={{ margin: '1rem 0' }}></div>
            <div className={styles.step}><span>2. Alternative: Terminal installation</span></div>
            <div className={styles.text}><span>Or copy and run the command below in your terminal to install </span><span>{ide}</span><span>:</span></div>
            <AppOverviewCodeEditorBlock inline={true} value={`npx @back4app/mcp-installer install ${ide} --account-key ${mcpKey}`} />
            <div style={{ margin: '1rem 0' }}></div>
            <div className={styles.step}><span>3. Verify your connection</span></div>
            {getVerifyContent(ide)}
          </>
        )}
        {!deeplink && (
          <>
            <div className={styles.step}><span>1. Run the installation command</span></div>
            <div className={styles.text}><span>Copy and run the command below in your terminal to install </span><span>{ide}</span><span>.</span></div>
            <AppOverviewCodeEditorBlock inline={true} value={`npx @back4app/mcp-installer install ${ide} --account-key ${mcpKey}`} />
            <div style={{ margin: '1rem 0' }}></div>
            <div className={styles.step}><span>2. Verify your connection</span></div>
            {getVerifyContent(ide)}
          </>
        )}
      </div>
    );
  } else {
    return (
      <div>
        {getManualInstructions(ide)}
        <div style={{ margin: '1rem 0' }}></div>
        <strong style={{ marginBottom: '.5rem', fontSize: '14px' }}><span>macOS / Linux</span></strong>
        <AppOverviewCodeEditorBlock language="json" fileName="mcp.json" value={getManualJsonContent(ide, mcpKey, true)} />
        <div style={{ margin: '1rem 0' }}></div>
        <strong style={{ marginBottom: '.5rem', fontSize: '14px' }}><span>Windows</span></strong>
        <AppOverviewCodeEditorBlock language="json" fileName="mcp.json" value={getManualJsonContent(ide, mcpKey, false)} />
      </div>
    );
  }
}

/**
 * MCP tab of the Connect modal: pick the IDE, install the Back4App MCP server
 * (one-click / terminal, or a manual mcp.json), then try it. Same content the
 * standalone MCP setup modal had, laid out on one page instead of two steps.
 */
const MCPSetup = ({ context }) => {
  const [ide, setIde] = useState('cursor');
  const [automatic, setAutomatic] = useState(true);
  const [mcpKey, setMcpKey] = useState('YOUR_ACCOUNT_KEY');

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

  return (
    <div className={styles.mcpModalContent}>
      <div className={styles.mcpModalStep2}>
        <div className={styles.mcpModalStep2Description}>
          Your AI agent operates this app from your IDE through the Back4App MCP server.
        </div>
        <div className={styles.connectChips}>
          {IDES.map(option => (
            <button
              key={option.key}
              type="button"
              className={`${styles.connectChip} ${ide === option.key ? styles.selected : ''}`}
              onClick={() => setIde(option.key)}
            >
              <Icon name={`b4a-${option.key}-icon`} width={16} height={16} fill="#C1E2FF" />
              {option.name}
            </button>
          ))}
        </div>
        <div className={styles.mcpTabButtons}>
          <B4aTabToggle
            value={automatic ? 'Automatic' : 'Manual'}
            onChange={val => setAutomatic(val === 'Automatic')}
            optionLeft="Automatic"
            optionRight="Manual"
          />
        </div>
        <div key={`${ide}-${automatic ? 'automatic' : 'manual'}`}>
          {getIDEContent(ide, automatic, mcpKey)}
        </div>

        <div className={styles.connectDivider} />

        <div className={styles.step}>Test your connection</div>
        <div className={styles.text}>In your AI agent chat, You can use Back4App MCP to interact with your Back4App account.</div>
        <div className={styles.text} style={{ marginBottom: '.5rem' }}>Here is an example to get a list of your apps: </div>
        <AppOverviewCodeEditorBlock inline={true} value={'List all of the apps in my Back4App account'} />
        <div className={styles.text} style={{ marginTop: '1rem' }}>
          More in the docs: <a className={styles.link} href="https://www.back4app.com/docs/mcp" target="_blank" rel="noopener noreferrer">https://www.back4app.com/docs/mcp</a>
        </div>
      </div>
    </div>
  );
};

export default MCPSetup;
