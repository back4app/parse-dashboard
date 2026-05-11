import React, { useMemo, useState } from 'react';
import B4aCodeEditor from 'components/CodeEditor/B4aCodeEditor.react';
import Icon from 'components/Icon/Icon.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';

const getEditorHeight = code => {
  const lineCount = code.split('\n').length;
  return Math.min(Math.max(lineCount * 19 + 16, 96), 420);
};

const AppOverviewCodeEditorBlock = ({ language, value, fileName, inline = false }) => {
  const [copied, setCopied] = useState(false);
  const codeText = useMemo(() => String(value || '').trim(), [value]);
  const mode = language || 'plaintext';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (inline) {
    return (
      <div className={styles.inlineCode}>
        {codeText}
        <button className={styles.copyButton} onClick={copyToClipboard} title="Copy to clipboard">
          <Icon
            name={copied ? 'b4a-check-icon' : 'b4a-copy-icon'}
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
        <div className={styles.languageLabel}>{fileName || mode}</div>
        <div className={styles.copyButtonWrapper}>
          {copied && <div className={styles.copyTooltip}>Copied!</div>}
          <button className={styles.copyButton} onClick={copyToClipboard} title="Copy to clipboard">
            <Icon
              name={copied ? 'b4a-check-icon' : 'b4a-copy-icon'}
              fill={copied ? '#27AE60' : '#C1E2FF'}
              width={14}
              height={14}
            />
          </button>
        </div>
      </div>
      <div className={styles.codeEditorBlock} style={{ height: getEditorHeight(codeText) }}>
        <B4aCodeEditor code={codeText} mode={mode} readOnly={true} fontSize={13} />
      </div>
    </div>
  );
};

export default AppOverviewCodeEditorBlock;
