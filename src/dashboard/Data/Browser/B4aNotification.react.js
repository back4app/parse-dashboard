/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import React from 'react';
import styles from 'dashboard/Data/Browser/Browser.scss';
import Icon from 'components/Icon/Icon.react';

export default class B4aNotification extends React.Component {
  constructor(props) {
    super();

    this.state = {
      lastNote: props.note,
      isErrorNote: props.isErrorNote,
      hiding: false,
      pos: new Position((window.innerWidth / 2), 0),
    };

    this.timeout = null;
    this.notificationRef = React.createRef();
  }

  componentDidMount() {
    const node = this.notificationRef.current;
    const { width, height } = node.getBoundingClientRect();
    console.log(node.getBoundingClientRect());
    console.log(width, height, height + 28);
    this.setState({
      pos: new Position((window.innerWidth / 2) + width, height + 32)
    })
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.lastNote !== nextProps.note) {
      clearTimeout(this.timeout);
      if (this.state.hiding) {
        this.setState({
          lastNote: nextProps.note,
          isErrorNote: nextProps.isErrorNote,
          hiding: false,
        });
      } else {
        this.setState({
          lastNote: nextProps.note,
          isErrorNote: nextProps.isErrorNote,
        });
      }
    }
    if (!nextProps.note) {
      return;
    }
    this.timeout = setTimeout(() => {
      this.setState({ hiding: true });
      this.timeout = setTimeout(() => {
        this.setState({ lastNote: null });
      }, 190);
    }, 3000);
  }

  render() {
    if (!this.state.lastNote) {
      return null;
    }
    const classes = [];

    if (this.state.isErrorNote) {
      classes.push(styles.b4aNotificationError);
    } else {
      classes.push(styles.b4aNotificationMessage);
    }

    if (this.state.hiding) {
      classes.push(styles.b4aNotificationHide);
    }
    return (
      <Popover fixed={true} position={this.state.pos}>
        <div className={classes.join(' ')} ref={this.notificationRef}>
          {this.props.isErrorNote ? <Icon width={24} height={34} name="b4a-error-cross" /> : <Icon width={24} height={34} name="b4a-success-check" />}
          {this.state.lastNote}
        </div>
      </Popover>
    );
  }
}
