import React, { useState, useEffect } from 'react';
import Popover from 'components/Popover/Popover.react';
import ReactMarkdown from 'react-markdown';
import Position from 'lib/Position';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/B4ACodeTree/B4ACodeTree.scss';

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

const CloudCodeSample = {
    'js-browser': {
      icon: 'js-icon',
      name: 'JavaScript (Browser)',
      iconColor: '#f7df1c',
      blocks: [
        {
          title: 'Cloud Functions',
          content: `~~~javascript
Parse.Cloud.define("averageStars", async (request) => {
    const query = new Parse.Query("Review");
    query.equalTo("movie", request.params.movie);
    const results = await query.find();
    let sum = 0;
    for (let i = 0; i < results.length; ++i) {
        sum += results[i].get("stars");
    }
    return sum / results.length;
});
~~~`
        },
        {
            title: 'Here is how you have to call it via REST API.',
            content: String.raw`~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: YOUR_APPLICATION_ID" \
    -H "X-Parse-REST-API-Key: YOUR_REST_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{ "movie": "The Matrix" }' \
    https://YOUR.PARSE-SERVER.HERE/parse/functions/averageStars
~~~`
        },
        {
          title: 'Cloud Jobs',
          content: `~~~javascript
Parse.Cloud.job("myJob", (request) =>  {
    // params: passed in the job call
    // headers: from the request that triggered the job
    // log: the ParseServer logger passed in the request
    // message: a function to update the status message of the job object
    const { params, headers, log, message } = request;
    message("I just started");
    return doSomethingVeryLong(request);
});
~~~`
        },
        {
            title: 'Here is how you have to call it via REST API.',
            content: String.raw`~~~bash
curl -X POST \
    -H 'X-Parse-Application-Id: YOUR_APPLICATION_ID' \
    -H 'X-Parse-Master-Key: YOUR_MASTER_KEY' \
    https://YOUR.PARSE-SERVER.HERE/parse/jobs/myJob
~~~`
        },
        {
          title: 'Cloud Triggers',
          content: `~~~javascript
Parse.Cloud.beforeSave("Review", (request) => {
    const comment = request.object.get("comment");
    if (comment.length > 140) {
        // Truncate and add a ...
        request.object.set("comment", comment.substring(0, 137) + "...");
    }
});
~~~`
        },
        
      ]
    }
};
  

const origin = new Position(0, 0);

const CodeBlock = ({ title, content }) => {
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
            <div className={styles.codeBlockHeader}>
                <div className={styles.languageLabel}>{title}</div>
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
    
            <pre
                className="line-numbers"
                style={{ backgroundColor: 'rgba(17,13,17,0.8)' }}
            >
                <code className="language-javascript">{codeText}</code>
            </pre>
        </div>
    );
};
  
const CloudCodeSampleModal = ({ closeModal }) => {
    const sample = CloudCodeSample['js-browser'];

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };
  
    return (
        <Popover fadeIn fixed position={origin} modal color="rgba(17,13,17,0.8)">
            <div 
                onClick={handleOverlayClick} 
                style={{ position: 'relative', width: '100%', height: '100%' }}
            >
                <div className={styles.cloudCodeSampleModal}>
                    <div className={styles.cloudCodeSampleModalTitle}>
                        <h1>The examples below shows you how a Cloud Code looks like.</h1>
                        <div className={styles.closeIcon} onClick={closeModal}>
                            <Icon name="close" fill="#f9f9f9" width={14} height={14} />
                        </div>
                    </div>
                    {sample.blocks.map((block) => (
                        <ReactMarkdown
                            children={block.content}
                            renderers={{
                                code: ({ value }) => (
                                    <CodeBlock title={block.title} content={value} />
                                )
                            }}
                        />
                    ))}
                    <div className={styles.docsLink}>
                        You can check docs in <a href='https://docs.parseplatform.org/cloudcode/guide' target='_blank'>
                            docs.parseplatform.org/cloudcode/guide
                        </a>.    
                    </div>
                </div>
            </div>
        </Popover>
    );
};

export default CloudCodeSampleModal;
