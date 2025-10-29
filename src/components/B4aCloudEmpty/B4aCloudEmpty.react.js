import React, { useState, useEffect } from 'react';
// import Icon from 'components/Icon/Icon.react';
import ghostImg from './ghost.png';
import styles from 'components/B4aCloudEmpty/B4aCloudEmpty.scss';
import CloudCodeSampleModal from 'components/B4ACodeTree/CloudCodeSampleModal.react';
import Icon from 'components/Icon/Icon.react';
import ReactMarkdown from 'react-markdown';
import Button from 'components/Button/Button.react';


// Import Prism Line Numbers plugin
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';

import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'

// eslint-disable-next-line no-unused-vars
import customPrisma from 'stylesheets/b4a-prisma.css';

const CodeBlock = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const codeText = content.trim();

  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [codeText]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.codeBlockContainer}>
        <pre className="line-numbers" style={{ backgroundColor: 'rgba(17,13,17,0.8)' }}>
            <code className="language-javascript">{codeText}</code>
        </pre>
        <div className={styles.copyButtonWrapper}>
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
    </div>
  );
};


const B4aCloudEmpty = ({ imgSrc = ghostImg, dark = true, selectMainJs, currentApp }) => {
  const [openCloudCodeSample, setOpenCloudCodeSample] = useState(false);

  const handleCloudCodeSample = () => {
    if(openCloudCodeSample == false) setOpenCloudCodeSample(true); else setOpenCloudCodeSample(false)      
  }

  return (
    <div className={styles.content + ` ${!dark ? styles.light : ''}`}>
        <img src={imgSrc} alt="empty state" />
        <div className={styles.titleSection}>
            <h1 className={styles.title}>Cloud Code — Extend Your App Backend with JavaScript</h1>
            <h2 className={styles.description}>Cloud Code lets you run JavaScript functions on the server, together with your app's backend. Use it for backend logic, database triggers, and integrations with external services.</h2>
        </div>
        <div className={styles.cardSection}>
            <h1>How it works</h1>
            <ul className={styles.cardList}>
                <li>
                    <div className={styles.numberList}>1</div>
                    <div className={styles.contentList}>
                        <div>
                            <b>Write your function</b> — Use the Cloud Code syntax. <span onClick={() => handleCloudCodeSample()} className={styles.mainJsText}>See examples →</span>
                        </div>
                        <div className={styles.cardCode}>
                            <ReactMarkdown
                                renderers={{
                                    code: ({ value }) => <CodeBlock content={value} />
                                }}
                            >
{`\`\`\`js
Parse.Cloud.define("hello", () => {
    return "Hello from Cloud Code!";
});
`}
                            </ReactMarkdown>

                            {/* <pre>Parse.Cloud.define("hello", () = "Hello from Cloud Code!");</pre> */}
                        </div>
                    </div>
                </li>
                <li>
                    <div className={styles.numberList}>2</div>
                    <div className={styles.contentList}>
                        <div><b>Add it to <span onClick={() => selectMainJs()} className={styles.mainJsText}>main.js</span> and Deploy </b>— All Cloud Code must be defined in <span onClick={() => selectMainJs()} className={styles.mainJsText}>main.js</span>. If you use other files, import them into <span onClick={() => selectMainJs()} className={styles.mainJsText}>main.js</span>, then click Deploy.
                        </div>
                    </div>
                </li>
                <li>
                    <div className={styles.numberList}>3</div>
                    <div className={styles.contentList}>
                        <div><b>Call it via API or SDK </b>— After deployment, your function is live and callable:</div>
                        <div className={styles.cardCode}>
                            <ReactMarkdown
                                renderers={{
                                    code: ({ value }) => <CodeBlock content={value} />
                                }}
                            >
{`\`\`\`bash
curl -X POST ${currentApp.serverURL}/functions/hello \\
    -H "X-Parse-Application-Id: ${currentApp && currentApp.applicationId ? currentApp.applicationId : 'YOUR_APP_ID'}" \\
    -H "X-Parse-REST-API-Key: ${currentApp && currentApp.restKey ? currentApp.restKey : 'YOUR_REST_KEY'}"
`}
                            </ReactMarkdown>

                        </div>
                    </div>
                    {/* <pre>curl -X POST https://YOUR_APP_URL/functions/hello</pre> */}
                </li>
            </ul>
        </div>
        <div className={styles.openMainButton}>
            <Button 
                value="</> Open main.js" 
                className={styles.mainJsButton} 
                onClick={() => selectMainJs()}
            />
        </div>
        <div className={styles.viewCloudCodeSamples}>
            <span onClick={() => handleCloudCodeSample()}>View Cloud Code examples →</span>
        </div>
        { openCloudCodeSample && 
          <div>
            <CloudCodeSampleModal 
                closeModal={handleCloudCodeSample}
                currentApp={currentApp}
            />             
          </div>
        }
    </div>
  )
}

export default B4aCloudEmpty;
