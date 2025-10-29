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

const getCloudCodeSample = (currentApp) => {
    return {
        'js-browser': {
            icon: 'js-icon',
            name: 'JavaScript (Browser)',
            iconColor: '#f7df1c',
            blocks: [
              {
                  title: '<b>Cloud Functions:</b> Are custom functions that allow to execute logic on the backend.',
                  content: `
~~~javascript
Parse.Cloud.define("hello", async (request) => {
    console.log("Hello from Cloud Code!");
    return "Hello from Cloud Code!";
});
~~~`
              },
              {
                  title: 'Here is how you have to call it via REST API.',
                  content: String.raw`
~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: ${currentApp.applicationId}" \
    -H "X-Parse-REST-API-Key: ${currentApp.restKey}" \
    ${currentApp.serverURL}/functions/hello
~~~`
              },
              {
                title: '<b>Cloud Functions (Data Manipulation):</b> Are functions to create, edit, or retrieve objects in your database.',
                content: `
~~~javascript
Parse.Cloud.define("createObject", async (request) => {
    const b4aClass = new Parse.Object("B4aSampleClass");
    b4aClass.set("name", request.params.name);
    b4aClass.set("value", request.params.value);
    await b4aClass.save(null, { useMasterKey: true });
    return "Object created successfully!";
});
~~~`
              },
              {
                  title: 'Here is how you have to call it via REST API.',
                  content: String.raw`
~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: ${currentApp.applicationId}" \
    -H "X-Parse-REST-API-Key: ${currentApp.restKey}" \
    -H "Content-Type: application/json" \
    -d '{"name":"b4aObject1","value": 27}' \
    ${currentApp.serverURL}/functions/createObject
~~~`
              },
              {
                title: 'Now we can retrieve that object with this function:',
                content: `
~~~javascript
Parse.Cloud.define("getObjects", async (request) => {
    const query = new Parse.Query("B4aSampleClass");
    const objects = await query.find({ useMasterKey: true });

    return objects.map(obj => ({
        id: obj.id,
        name: obj.get("name"),
        value: obj.get("value"),
    }));
});
~~~`
              },
              {
                  title: 'Here is how you have to call it via REST API.',
                  content: String.raw`
~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: ${currentApp.applicationId}" \
    -H "X-Parse-REST-API-Key: ${currentApp.restKey}" \
    -H "Content-Type: application/json" \
    ${currentApp.serverURL}/functions/getObjects
~~~`
              },
              {
                  title: '<b>Cloud Triggers:</b> Are specific functions that run automatically before or after certain database actions.',
                  content: `
~~~javascript
Parse.Cloud.beforeSave("B4aSampleClass", (request) => {
    // Set value property to 0 if not send 
    if (request.object.get("value") === undefined) {
        request.object.set("value", 0);
    }
});
~~~`
              },
              {
                  title: 'To see this trigger in action, you need to perform a save operation on the database. You can use the createObject function created earlier.',
                  content: String.raw`
~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: ${currentApp.applicationId}" \
    -H "X-Parse-REST-API-Key: ${currentApp.restKey}" \
    -H "Content-Type: application/json" \
    -d '{"name":"b4aObject2"}' \
    ${currentApp.serverURL}/functions/createObject
~~~`
              },
              {
                  title: '<b>Cloud Jobs:</b> Are background tasks that you can schedule or run manually from your dashboard.',
                  content: `
~~~javascript
Parse.Cloud.job("activeAllObjects", async (request) => {
    const query = new Parse.Query("B4aSampleClass");
    const objects = await query.find({ useMasterKey: true });

    for (const obj of objects) {
        obj.set("isActive", true);
        await obj.save(null, { useMasterKey: true });
    }
});
~~~`
              },
              {
                  title: 'Here is how you have to call it. Jobs can be only excute with the Master Key.',
                  content: String.raw`
~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: ${currentApp.applicationId}" \
    -H "X-Parse-Master-Key: ${currentApp.masterKey}" \
    ${currentApp.serverURL}/jobs/activeAllObjects
~~~`
              },     
            ]
        }
    }
}
 

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
            <div
                className={styles.languageLabel}
                dangerouslySetInnerHTML={{ __html: title }}
            />
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
  
const CloudCodeSampleModal = ({ closeModal, currentApp }) => {
    console.log("current in cloud", currentApp)
    const sample = getCloudCodeSample(currentApp)['js-browser'];

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
                        <h1>The examples below show you what Cloud Code looks like.</h1>
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
                        You can check docs in <a href='https://www.back4app.com/docs/get-started/read-and-write-data' target='_blank'>
                            back4app.com/docs/get-started/read-and-write-data
                        </a>.
                    </div>
                </div>
            </div>
        </Popover>
    );
};

export default CloudCodeSampleModal;
