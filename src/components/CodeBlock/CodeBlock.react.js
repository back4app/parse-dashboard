import React, { useEffect, useState, useRef } from 'react';
import Prism from 'prismjs';
import Icon from 'components/Icon/Icon.react';
import styles from './CodeBlock.scss';

// Plugins e linguagens suportadas (iguais ao original)
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';

// Mantém o mesmo CSS global
import 'stylesheets/b4a-prisma.css';

const CodeBlock = ({ language, value, title, content, hasTitle = true, hideCopyButton = false, hideLineNumbers = false }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const codeText = value ?? content ?? '';
  const lang = language || 'javascript';
  const isCloudSample = Boolean(title);

  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [codeText, language]);

  const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(codeText.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div 
        className={styles.codeBlockContainer}
        style={{ paddingTop: hasTitle ? '0.5rem' : '0', display: !hasTitle ? 'flex' : 'block' }}
    >
        { hasTitle && (
            <div className={styles.codeBlockHeader}>
                {isCloudSample ? (
                    <div
                        className={styles.languageLabel}
                        dangerouslySetInnerHTML={{ __html: title }}
                    />
                ) : (
                    <div className={styles.languageLabel}>{lang}</div>
                )}
                <div
                    className={styles.copyButtonWrapper}
                >
                    {copied && (
                        <div className={styles.copyTooltip}>
                            Copied!
                        </div>
                    )}
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
            </div>
        )}
        <pre 
            className={`${hideLineNumbers ? styles.hideLineNumbers : 'line-numbers'} ${!hasTitle ? styles.codeBlockHasNoTitle : ''}`}
        >
            <code className={`language-${lang}`}>{codeText.trim()}</code>
        </pre>
        { !hasTitle && !hideCopyButton && (
            <div className={styles.copyButtonCloudEmpty}>
            {copied && <div className={styles.copyTooltipCloudEmpty}>Copied!</div>}
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

export default CodeBlock;
