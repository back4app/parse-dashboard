/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { ActionTypes }            from 'lib/stores/SchemaStore';
import DashboardView              from 'dashboard/DashboardView.react';
import Dropdown                   from 'components/Dropdown/Dropdown.react';
import Field                      from 'components/Field/Field.react';
import Fieldset                   from 'components/Fieldset/Fieldset.react';
import Icon                       from 'components/Icon/Icon.react';
import Label                      from 'components/Label/Label.react';
import LoaderContainer            from 'components/LoaderContainer/LoaderContainer.react';
import Option                     from 'components/Dropdown/Option.react';
import ParseApp                   from 'lib/ParseApp';
import PropTypes                  from 'lib/PropTypes';
import React                      from 'react';
import TextInput                  from 'components/TextInput/TextInput.react';
import Toolbar                    from 'components/Toolbar/Toolbar.react';
import styles                     from './BlockChainPage.scss' ;
import subscribeTo                from 'lib/subscribeTo';
import MoveToBlockchainModal      from './MoveToBlockchainModal.react';
import RemoveFromBlockchainModal  from './RemoveFromBlockchainModal.react';
import Notification               from '../Data/Browser/Notification.react';

const sortClasses = (classes) => {
  return classes.sort((a, b) => {
    if (a[0] === '_' && b[0] !== '_') {
      return -1
    }
    if (b[0] === '_' && a[0] !== '_') {
      return 1
    }
    return a.toUpperCase() < b.toUpperCase() ? -1 : 1
  })
}

@subscribeTo("Schema", "schema")
class BlockChainPage extends DashboardView {
  constructor() {
    super();
    this.section = "Database";
    this.subsection = "Blockchain";

    this.state = {
      loading: true,
      appBalanceLoading: true,
      blockChainClassesLoading: true,
      classes: [],
      appBalance: "",
      blockChainClasses: [],
      selectedClass: "",
      showAddClassModal: false,
      showRemoveClassModal: false,
      inProgress: false,
      lastError: "",
      lastNote: "",
    };
    this.moveClassToBlockChain = this.moveClassToBlockChain.bind(this);
    this.removeClassFromBlockChain = this.removeClassFromBlockChain.bind(this);
    this.showNote = this.showNote.bind(this);
  }

  componentWillMount() {
    this.props.schema.dispatch(ActionTypes.FETCH).then(() => {
      if (this.props.schema.data.get("classes")) {
        let classes = this.props.schema.data.get("classes").keySeq().toArray();
        this.setState({ loading: false, classes: sortClasses(classes) });
      }
    });

    this.context.currentApp.getAppBalance().then(({ balance }) => {
      this.setState({ appBalanceLoading: false, appBalance: balance });
    });

    this.context.currentApp.getBlockchainClassNames().then(({ classNames }) => {
      this.setState({
        blockChainClassesLoading: false,
        blockChainClasses: sortClasses(classNames),
      });
    });
  }

  showNote(message, isError) {
    if (!message) {
      return;
    }

    clearTimeout(this.noteTimeout);

    if (isError) {
      this.setState({ lastError: message, lastNote: null });
    } else {
      this.setState({ lastNote: message, lastError: null });
    }

    this.noteTimeout = setTimeout(() => {
      this.setState({ lastError: null, lastNote: null });
    }, 3500);
  }

  moveClassToBlockChain() {
    let selectedClassName = this.state.selectedClass;
    this.setState({
      inProgress: true,
    });
    this.context.currentApp
      .moveClassToBlockchain(selectedClassName)
      .then(() => {
        let newClassArray = [ ...this.state.blockChainClasses, selectedClassName ];
        this.setState({
          blockChainClasses: sortClasses(newClassArray),
          classes: this.state.classes.filter(name => name !== selectedClassName)
        });
      })
      .catch((err) => {
        console.log(err);
        this.showNote(err.response?.data || err.message, true);
      })
      .finally(() => {
        this.setState({
          inProgress: false,
          showAddClassModal: false,
          selectedClass: ''
        });
      })
  }

  removeClassFromBlockChain() {
    let selectedClassName = this.state.selectedClass;
    this.setState({
      inProgress: true,
    });
    this.context.currentApp
      .removeFromBlockchain(selectedClassName)
      .then(() => {
        this.setState({
          blockChainClasses: this.state.blockChainClasses.filter(name => name !== selectedClassName),
        });
      })
      .catch((err) => {
        console.log(err);
        this.showNote(err.response?.data || err.message, true);
      })
      .finally(() => {
        this.setState({
          inProgress: false,
          showRemoveClassModal: false,
          selectedClass: ''
        })
      })
  }

  renderClassesAtBlockchain() {
    if (this.state.blockChainClasses.length === 0) {
      return null;
    }
    return (
      <div>
        <div className={styles.headerRow}>
          <div className={styles.className}>Classes in Blockchain</div>
          <div></div>
        </div>
        {this.state.blockChainClasses.map((name, idx) => (
          <div key={idx} className={styles.row}>
            <div className={styles.className}>{name}</div>
            <a
              className={styles.action}
              onClick={() =>
                this.setState({
                  showRemoveClassModal: true,
                  selectedClass: name,
                })
              }
            >
              <Icon name="delete-icon" fill="#169CEE" width={24} height={20} />
            </a>
          </div>
        ))}
      </div>
    );
  }

  renderForm() {
    const classes = this.state.classes.filter(name => !this.state.blockChainClasses.includes(name));
    let formattedBalance = (
      Number(BigInt(this.state.appBalance) / BigInt(1000000000)) / 1000000000
    ).toFixed(9);
    return (
      <div>
        <div className={styles.fieldset}>
          <div className={styles.legendText}>Blockchain Data Storage</div>
          <div className={styles.descText}>
            Save your App’s data on the Blockchain Network of your choice.
            <br /> NOTE: This feature is on the alpha version.
          </div>
        </div>
        <Fieldset
          legend="Network"
          description="You can only connect to a private Ethereum compatible network in this alpha version. Use this network for development purposes at no cost."
        >
          <Field
            label={<Label text="Blockchain Network" />}
            input={
              <TextInput
                value="Back4App ETH Development"
                disabled
                onChange={() => {}}
              />
            }
          />
          <Field
            label={<Label text="Balance (development eth)" />}
            input={
              this.state.appBalanceLoading ? (
                <div className={styles.spinnerWrapper}>
                  <div className={styles.spinner}></div>
                </div>
              ) : (
                <TextInput
                  value={formattedBalance}
                  disabled
                  onChange={() => {}}
                />
              )
            }
          />
        </Fieldset>
        <Fieldset
          legend="Classes in Blockchain"
          description="Replicate new objects to the Blockchain by selecting their classes below. This operation will add two new fields to these classes (blockchainStatus and blockchainResult), and it is not allowed to update nor modify blockchain objects."
        >
          <Field
            label={<Label text="Add a new class to Blockchain" />}
            input={
              <Dropdown
                placeHolder="Select a class"
                onChange={(value) =>
                  this.setState({
                    selectedClass: value,
                    showAddClassModal: true,
                  })
                }
                value={this.state.selectedClass}
              >
                {classes.map((cls, idx) => (
                  <Option key={idx} value={cls}>
                    {cls}
                  </Option>
                ))}
              </Dropdown>
            }
          />
          {this.renderClassesAtBlockchain()}
        </Fieldset>
      </div>
    );
  }

  renderContent() {
    let extra = null;
    if (this.state.showAddClassModal) {
      extra = (
        <MoveToBlockchainModal
          className={this.state.selectedClass}
          onConfirm={this.moveClassToBlockChain}
          onCancel={() =>
            this.setState({ selectedClass: "", showAddClassModal: false })
          }
          progress={this.state.inProgress}
        />
      );
    } else if (this.state.showRemoveClassModal) {
      extra = (
        <RemoveFromBlockchainModal
          className={this.state.selectedClass}
          onConfirm={this.removeClassFromBlockChain}
          onCancel={() =>
            this.setState({ selectedClass: "", showRemoveClassModal: false })
          }
          progress={this.state.inProgress}
        />
      );
    }

    let notification = null;
    if (this.state.lastError) {
      notification = (
        <Notification note={this.state.lastError} isErrorNote={true} />
      );
    } else if (this.state.lastNote) {
      notification = (
        <Notification note={this.state.lastNote} isErrorNote={false} />
      );
    }

    return (
      <div className={styles.content}>
        <LoaderContainer loading={this.state.loading}>
          {this.renderForm()}
          {extra}
          {notification}
        </LoaderContainer>
        <Toolbar subsection="Blockchain" />
      </div>
    );
  }
}

BlockChainPage.contextTypes = {
  currentApp: PropTypes.instanceOf(ParseApp),
};

export default BlockChainPage