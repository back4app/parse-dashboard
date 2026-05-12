import React from 'react';
import { useParams } from 'react-router-dom';
// import Icon from 'components/Icon/Icon.react';
import ghostImg from './ghost.png';
import styles from 'components/B4aCloudEmpty/B4aCloudEmpty.scss';
import Icon from 'components/Icon/Icon.react';
import ReactMarkdown from 'react-markdown';
import B4aCloudEmptyCodeBlock from 'components/B4aCloudEmpty/B4aCloudEmptyCodeBlock.react';

const B4aCloudPublicEmpty = ({ imgSrc = ghostImg, dark = true, selectIndex, hasDeployed }) => {
  const { appId } = useParams();
  return (
    <div className={styles.content + ` ${!dark ? styles.light : ''}`}>
      <img src={imgSrc} alt="empty state" />
      <div className={styles.titleSection}>
        <h1 className={styles.title}>Web Hosting — Deploy Static Sites Instantly</h1>
        <h2 className={styles.description}>Deploy your static websites, HTML pages, JavaScript apps, and assets directly to Back4app. Your files are served globally with automatic HTTPS and custom domain support.</h2>
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
                    <b>Upload your files</b> — Drop your HTML, CSS, JavaScript, images, and other static assets into the <span onClick={() => selectIndex()} className={styles.mainJsText}>public </span>folder. You can organize files in subdirectories as needed.
                  </div>
                  <div className={styles.cardCode}>
                    <ReactMarkdown
                      renderers={{
                        code: ({ language, value }) => (
                          <B4aCloudEmptyCodeBlock
                            language={language}
                            content={value}
                            hideCopyButton={true}
                          />
                        ),
                      }}
                    >
                      {`\`\`\`text
    public/
    ├── index.html
    ├── login.html
    └── styles.css`}
                    </ReactMarkdown>
                  </div>
                </div>
              </li>
              <li>
                <div className={styles.numberList}>2</div>
                <div className={styles.contentList}>
                  <div><b>Enable your hosting URL </b>— After uploading files, click Deploy and enable your web hosting URL. Your site will be available instantly at a unique Back4app subdomain:</div>
                  <div className={styles.cardCode}>
                    <ReactMarkdown
                      renderers={{
                        code: ({ language, value }) => (
                          <B4aCloudEmptyCodeBlock
                            language={language}
                            content={value}
                            hideCopyButton={true}
                          />
                        ),
                      }}
                    >
                      {`\`\`\`bash
                                            https://your-app.b4a.app
                                            `}
                    </ReactMarkdown>
                  </div>
                  <div className={styles.enableHostingButton}>
                    <button
                      className={styles.mainJsButton}
                      onClick={() => window.open(
                        // eslint-disable-next-line no-undef
                        `${b4aSettings.BACKEND_DASHBOARD_PATH}/apps/${appId}/domain-settings`,
                        '_blank'
                      )}
                    >
                      <Icon name="b4a-globe-icon" className={styles.globeIcon} width={18} height={18} />
                      <span>Enable Web Hosting</span>
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div className={styles.filesPublicButton}>
            <button
              className={styles.mainJsButton}
              onClick={() => selectIndex()}
            >
              {/* <Icon name="B4a-upload-file-icon" fill="#F9F9F9" width={18} height={18} /> */}
              <span>{'</> Open index.html'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default B4aCloudPublicEmpty;
