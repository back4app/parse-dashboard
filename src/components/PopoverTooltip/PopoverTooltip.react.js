/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React    from 'react';
import Popover  from "components/Popover/Popover.react";
import Position from "lib/Position";
import ReactDOM from "react-dom";
import styles   from "./PopoverTooltip.scss";

const POPOVER_CONTENT_ID = "DataBrowserHeaderBarTopTooltip";

export default class PopoverTooltip extends React.Component {
  constructor() {
    super();

    this.state = {
      open: false,
    };
    this.closePopoverOnScroll = this.closePopoverOnScroll.bind(this);
  }

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this);
    window.addEventListener('scroll', this.closePopoverOnScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.closePopoverOnScroll);
  }

  closePopoverOnScroll() {
    this.setState({
        open: false
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.visible) {
      this.setState({
        open: true,
      });
    } else {
      this.setState({
        open: false,
      });
    }
  }

  toggle() {
    this.setState({
      open: !this.state.open,
    });
  }

  render() {
    let popover = null;
    if (this.state.open) {
      popover = (
        <Popover
          fixed={true}
          position={Position.topTooltip(this.node, 40)}
          onExternalClick={this.toggle.bind(this)}
          contentId={POPOVER_CONTENT_ID}
        >
          <div className={styles.popover} id={POPOVER_CONTENT_ID}>
            <div className={styles.tooltipContainer}>
              <div className={styles.tooltipContent}>{this.props.tooltip}</div>
              <div className={styles.tooltipArrow}></div>
            </div>
          </div>
        </Popover>
      );
    }
    return (
      <>
        {this.props.children}
        {popover}
      </>
    );
  }
}
