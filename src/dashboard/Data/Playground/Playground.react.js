import React, { Component } from 'react';
import ReactJson from 'react-json-view';
import Parse from 'parse';

import CodeEditor from 'components/CodeEditor/CodeEditor.react';
import Button from 'components/Button/Button.react';
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
      const originalCode = this.editor.value;

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
      const code = this.editor.value;
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
      console.log(initialCode);
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
      <div className={styles['playground-ctn']}>
        <Toolbar section={this.section} subsection={this.subsection} />
        <div style={{ height: 'calc(100vh - 156px)' }}>
          <CodeEditor
            placeHolder={this.state.code}
            ref={editor => (this.editor = editor)}
            fileName={`${this.localKey}.js`}
            onCodeChange={(code) => this.setState({ code })}
          />
          <div className={styles['console-ctn']}>
            <header>
              <h3>Console</h3>
              <div className={styles['buttons-ctn']}>
                <div>
                  <div style={{ marginRight: '15px' }}>
                    {window.localStorage && (
                      <SaveButton
                        state={savingState}
                        primary={false}
                        color="white"
                        onClick={() => this.saveCode()}
                        progress={saving}
                      />
                    )}
                  </div>
                  <Button
                    value={'Run'}
                    primary={false}
                    onClick={() => this.runCode()}
                    progress={running}
                    color="white"
                  />
                </div>
              </div>
            </header>
            <section>
              {results.map(({ log, name }, i) => (
                <ReactJson
                  key={i + `${log}`}
                  src={log}
                  collapsed={1}
                  theme="solarized"
                  name={name}
                />
              ))}
            </section>
          </div>
        </div>
      </div>
    );
  }
}
