import React, { useState } from 'react';
import Icon from 'components/Icon/Icon.react';
import B4aCodeEditor from 'components/CodeEditor/B4aCodeEditor.react';
import styles from 'components/B4aCloudEmpty/B4aCloudEmpty.scss';

const getEditorHeight = code => {
  const lineCount = code.split('\n').length;
  return Math.min(Math.max(lineCount * 19 + 16, 72), 240);
};

const B4aCloudEmptyCodeBlock = ({ language, content, hideCopyButton = false }) => {
  const [copied, setCopied] = useState(false);
  const code = String(content || '').trim();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.cloudEmptyCodeBlock}>
      <div className={styles.cloudEmptyEditor} style={{ height: getEditorHeight(code) }}>
        <B4aCodeEditor
          code={code}
          mode={language || 'javascript'}
          readOnly={true}
          fontSize={13}
        />
      </div>
      {!hideCopyButton && (
        <div className={styles.cloudEmptyCopy}>
          {copied && <div className={styles.copyTooltip}>Copied!</div>}
          <button
            className={styles.copyButton}
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            <Icon
              name={copied ? 'b4a-check-icon' : 'b4a-copy-icon'}
              fill={copied ? '#27AE60' : '#C1E2FF'}
              width={14}
              height={14}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default B4aCloudEmptyCodeBlock;
