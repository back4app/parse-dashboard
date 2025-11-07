import React, { useEffect, useRef, Suspense, lazy } from 'react';
import ReactMarkdown from 'react-markdown';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/B4ACodeTree/B4ACodeTree.scss';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';

const CodeBlock = lazy(() => import('components/CodeBlock/CodeBlock.react'));

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
                    title: 'This example creates an object in your class.',
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
                    title: '<b>Cloud Triggers:</b> Is a function that automatically runs when certain events happen in your database classes. — such as when an object is saved, updated, deleted, or queried.',
                    content: `
~~~javascript
Parse.Cloud.beforeSave("B4aSampleClass", (request) => {
    if (request.object.get("value") === undefined) {
        request.object.set("value", 0);
    }
});
~~~`
                },
                {
                    title: 'You can use the createObject function created earlier and omit the value property to see the trigger in action.',
                    content: String.raw`
~~~bash
curl -X POST \
    -H "X-Parse-Application-Id: ${currentApp.applicationId}" \
    -H "X-Parse-REST-API-Key: ${currentApp.restKey}" \
    -H "Content-Type: application/json" \
    -d '{"name":"b4aObject"}' \
    ${currentApp.serverURL}/functions/createObject
~~~`
                },
                {
                    title: 'Now we can retrieve the object created with this function:',
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
                    title: `<b>Cloud Jobs:</b> Are background routines that can be scheduled or triggered to run automatically, ideal for long-running or maintenance tasks.`,
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

const origin = new Position(0, 0)
 
const CloudCodeSampleModal = ({ closeModal, currentApp }) => {
    const sample = getCloudCodeSample(currentApp)['js-browser'];

    const startRef = useRef(null);
    const overlayRef = useRef(null);

    const handlePointerDown = (e) => {
        startRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e) => {
        if (!overlayRef.current) return;
        
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5 && e.target === overlayRef.current) {
        closeModal();
        }
    };

    useEffect(() => {
        const toolbar = document.querySelector('#toolbar');
        const sidebar = document.querySelector('#sidebar');
        const codeContainer = document.querySelector('#codeContainer');
        const navbar = document.querySelector('nav');
    
        if (toolbar) toolbar.style.userSelect = 'none';
        if (sidebar) sidebar.style.userSelect = 'none';
        if (codeContainer) codeContainer.style.userSelect = 'none';
        if (navbar) navbar.style.userSelect = 'none'
    
        return () => {
            if (toolbar) toolbar.style.userSelect = '';
            if (sidebar) sidebar.style.userSelect = '';
            if (codeContainer) codeContainer.style.userSelect = '';
            if (navbar) navbar.style.userSelect = '';
        };
    }, []);

    return (
        <Popover 
            fadeIn 
            position={origin} 
            modal 
            color="rgba(17,13,17,0.8)"
            contentId="cloud-code-sample-modal"
        >
             <div 
                ref={overlayRef}
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                style={{ position: 'relative', width: '100%', height: '100%' }}
            >
                <div className={styles.cloudCodeSampleModal} id="cloud-code-sample-modal">
                    <div className={styles.cloudCodeSampleModalTitle}>
                        <h1>The examples below show you what Cloud Code looks like.</h1>
                        <div className={styles.closeIcon} onClick={closeModal}>
                            <Icon name="close" fill="#f9f9f9" width={14} height={14} />
                        </div>
                    </div>
                    <Suspense fallback={<div>Loading...</div>}>
                        {sample.blocks.map((block, i) => (
                            <ReactMarkdown
                                key={i}
                                children={block.content}
                                renderers={{
                                    code: ({ value }) => (
                                        <CodeBlock
                                            title={block.title}
                                            content={value}
                                        />
                                    )
                                }}
                            />
                        ))}
                    </Suspense>
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
