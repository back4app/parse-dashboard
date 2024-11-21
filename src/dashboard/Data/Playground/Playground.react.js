import React, { Component } from 'react';
import ReactJson from 'react-json-view';
import Parse from 'parse';

import B4aCodeEditor from 'components/CodeEditor/B4aCodeEditor.react';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import SaveButton from 'components/SaveButton/SaveButton.react';
import Swal from 'sweetalert2';
import Toolbar from 'components/Toolbar/Toolbar.react';
import { CurrentApp } from 'context/currentApp';

import styles from './Playground.scss';

const placeholderCode = 'const myObj = new Parse.Object(\'MyClass\');\nmyObj.set(\'myField\', \'Hello World!\');\nawait myObj.save();\nconsole.log(myObj);';
export default class Playground extends Component {
  static contextType = CurrentApp;
  constructor() {
    super();
    this.section = 'API';
    this.subsection = 'JS Console';
    this.localKey = 'parse-dashboard-playground-code';
    this.state = {
      code: '',
      results: [],
      running: false,
      saving: false,
      savingState: SaveButton.States.WAITING,
    };
  }

  overrideConsole() {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      this.setState(({ results }) => ({
        results: [
          ...results,
          ...args.map(arg => ({
            log:
              typeof arg === 'object'
                ? Array.isArray(arg)
                  ? arg.map(this.getParseObjectAttr)
                  : this.getParseObjectAttr(arg)
                : { result: arg },
            name: 'Log',
          })),
        ],
      }));

      originalConsoleLog.apply(console, args);
    };
    console.error = (...args) => {
      this.setState(({ results }) => ({
        results: [
          ...results,
          ...args.map(arg => ({
            log:
              arg instanceof Error
                ? { message: arg.message, name: arg.name, stack: arg.stack }
                : { result: arg },
            name: 'Error',
          })),
        ],
      }));

      originalConsoleError.apply(console, args);
    };

    return [originalConsoleLog, originalConsoleError];
  }

  async runCode() {
    const [originalConsoleLog, originalConsoleError] = this.overrideConsole();

    try {
      const { applicationId, masterKey, serverURL, javascriptKey } = this.context;
      const originalCode = this.state.code;

      const finalCode = `return (async function(){
        try{
          Parse.initialize('${applicationId}', ${javascriptKey ? `'${javascriptKey}'` : undefined});
          Parse.masterKey = '${masterKey}';
          Parse.serverUrl = '${serverURL}';

          ${originalCode}
        } catch(e) {
          console.error(e);
        }
      })()`;

      this.setState({ running: true, results: [] });

      await new Function('Parse', finalCode)(Parse);
    } catch (e) {
      console.error(e);
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      this.setState({ running: false });
    }
  }

  saveCode() {
    try {
      const code = this.state.code;
      if (!code) {
        Swal.fire({
          title: 'Couldn\'t save latest changes',
          text: 'Please add some code before saving',
          type: 'error',
        });
        return this.setState({ code });
      }

      this.setState({ saving: true, savingState: SaveButton.States.SAVING });
      window.localStorage.setItem(this.localKey, code);
      this.setState({
        code,
        saving: false,
        savingState: SaveButton.States.SUCCEEDED,
      });

      setTimeout(() => this.setState({ savingState: SaveButton.States.WAITING }), 3000);
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, savingState: SaveButton.States.FAILED });
    }
  }

  getParseObjectAttr(parseObject) {
    if (parseObject instanceof Parse.Object) {
      return parseObject.attributes;
    }

    return parseObject;
  }

  componentDidMount() {
    if (window.localStorage) {
      const initialCode = window.localStorage.getItem(this.localKey);
      let code = '';
      if (initialCode) {
        code = initialCode;
      } else {
        code = placeholderCode;
      }
      this.setState({ code });
    }
  }

  render() {
    const { results, running, saving, savingState } = this.state;

    return React.cloneElement(
      <>
        <Toolbar section={this.section} subsection={this.subsection}>
          <div className={styles['buttons-ctn']}>
            <Button
              value={<span className={styles.runBtn}>
                <Icon width={16} height={16} fill="#CCCCCC" name="b4a-play" className={styles.icon} />
                Run
              </span>}
              primary={false}
              onClick={() => this.runCode()}
              progress={running}
              color="white"
              dark={true}
              eventName="JS Console - run button"
            />
            {window.localStorage && (
              <SaveButton
                state={savingState}
                primary={false}
                color="green"
                onClick={() => this.saveCode()}
                progress={saving}
              />
            )}
          </div>
        </Toolbar>
        <div className={styles['playground-ctn']}>
          <div className={styles.playgroundEditor}>
            <B4aCodeEditor
              // fontSize={14}
              code={this.state.code}
              ref={editor => (this.editor = editor)}
              mode='javascript'
              // fileName={`${this.localKey}.js`}
              onCodeChange={(code) => this.setState({ code })}
            />
          </div>
          <div className={styles.console}>
            <div>Console</div>
            <section>
              {!results.length ? '' : (
                results.map(({ log, name }, i) => (
                  <ReactJson
                    key={i + `${log}`}
                    src={log}
                    collapsed={1}
                    theme={{
                      base00: '#0A0B0C', // default background
                      base01: '#111214',
                      base02: '#f9f9f94d',
                      base03: '#F9F9F9',
                      base04: '#c1e2ff',
                      base05: '#f9f9f9',
                      base06: '#f9f9f9',
                      base07: '#f9f9f999',
                      base08: '#f9f9f9',
                      base09: '#27AE60', // Integers, Boolean, Constants, XML Attributes, Markup Link Url
                      base0A: '#f9f9f9',
                      base0B: '#f9f9f9',
                      base0C: '#f9f9f9',
                      base0D: '#f9f9f9b3',
                      base0E: '#f9f9f999',
                      base0F: '#15A9FF'
                    }}
                    name={name}
                  />
                ))
              )}
            </section>
          </div>
        </div>
      </>
    );
  }
}
