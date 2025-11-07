import React, { useState, Suspense, lazy } from 'react';
import ghostImg from './ghost.png';
import styles from 'components/B4aCloudEmpty/B4aCloudEmpty.scss';

import Icon from 'components/Icon/Icon.react';
import ReactMarkdown from 'react-markdown';
import Button from 'components/Button/Button.react';

const LazyCloudCodeSampleModal = lazy(() => import('../B4ACodeTree/CloudCodeSampleModal.react'));
const CodeBlock = lazy(() => import('components/CodeBlock/CodeBlock.react'));

const B4aCloudEmpty = ({ imgSrc = ghostImg, dark = true, selectMainJs, currentApp, hasDeployed }) => {
    const [openCloudCodeSample, setOpenCloudCodeSample] = useState(false);

    const handleCloudCodeSample = () => {
        if(!openCloudCodeSample) {
            import('../B4ACodeTree/CloudCodeSampleModal.react')
        }
        setOpenCloudCodeSample(prev => !prev);    
    }

    return (
        <>
        <div className={styles.content + ` ${!dark ? styles.light : ''}`}>
            <img src={imgSrc} alt="empty state" />
            <div className={styles.titleSection}>
                <h1 className={styles.title}>Cloud Code — Extend Your App Backend with JavaScript</h1>
                <h2 className={styles.description}>Cloud Code lets you run JavaScript functions on the server, together with your app's backend. Use it for backend logic, database triggers, and integrations with external services.</h2>
            </div>
            { !hasDeployed && (
                <>    
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
                                    <Suspense fallback={null}>    
                                        <ReactMarkdown
                                            renderers={{
                                                code: ({ language, value }) => (
                                                    <CodeBlock 
                                                        language={language} 
                                                        content={value} 
                                                        hasTitle={false}
                                                    />
                                                ),
                                            }}
                                        >
{`\`\`\`js
Parse.Cloud.define("hello", () => {
    return "Hello from Cloud Code!";
});
`}
                                        </ReactMarkdown>
                                    </Suspense>

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
                                    <Suspense fallback={null}>    
                                        <ReactMarkdown
                                            renderers={{
                                                code: ({ language, value }) => (
                                                    <CodeBlock
                                                        language={language}
                                                        content={value}
                                                        hasTitle={false}
                                                    />
                                                ),
                                            }}
                                        >
{`\`\`\`bash
curl -X POST ${currentApp.serverURL}/functions/hello \\
    -H "X-Parse-Application-Id: ${currentApp && currentApp.applicationId ? currentApp.applicationId : 'YOUR_APP_ID'}" \\
    -H "X-Parse-REST-API-Key: ${currentApp && currentApp.restKey ? currentApp.restKey : 'YOUR_REST_KEY'}"
`}
                                        </ReactMarkdown>
                                    </Suspense>

                                </div>
                            </div>
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
                </>
            )}
            <div className={styles.viewCloudCodeSamples}>
                <span onClick={() => handleCloudCodeSample()}>View Cloud Code examples →</span>
            </div>
        </div>
        {
            openCloudCodeSample && ( 
                <Suspense fallback={null}>
                    <LazyCloudCodeSampleModal 
                        closeModal={() => handleCloudCodeSample()}
                        currentApp={currentApp}
                    />
                </Suspense>
            )
        }
        </>
    )
}

export default B4aCloudEmpty;
