/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes                  from 'lib/PropTypes';
import React                      from 'react';
import styles                     from 'components/DataBrowserHeader/DataBrowserHeader.scss';
import { unselectable }           from 'stylesheets/base.scss';
import { DragSource, DropTarget } from 'react-dnd';
import Tooltip                    from 'components/Tooltip/PopperTooltip.react';

const Types = {
  DATA_BROWSER_HEADER: 'dataBrowserHeader'
};

const dataBrowserHeaderTarget = {
  drop(props, monitor) {
    const item = monitor.getItem();

    if (!item) {
      return;
    }

    const dragIndex = item.index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    props.moveDataBrowserHeader(dragIndex, hoverIndex);
  },
}

const dataBrowserHeaderSource = {
  beginDrag(props) {
    return {
      name: props.name,
      index: props.index,
    };
  }
};

@DropTarget(Types.DATA_BROWSER_HEADER, dataBrowserHeaderTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver()
}))
@DragSource(Types.DATA_BROWSER_HEADER, dataBrowserHeaderSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
class DataBrowserHeader extends React.Component {

  constructor() {
    super();
    this.state = {
      showTooltip: false
    };
  }

  render() {
    let { connectDragSource, connectDropTarget, name, type, targetClass, order, style, isDragging, isOver, required } = this.props;
    let classes = [styles.header, unselectable];
    if (order) {
      classes.push(styles[order]);
    }
    if (isOver && !isDragging) {
      classes.push(styles.over);
    }
    if (isDragging) {
      classes.push(styles.dragging);
    }
    const tooltipContent = (
      <span style={{ fontSize: "12px" }} >
        Format: <span style={{ color: "#169CEE"}} >{targetClass ? `${type} <${targetClass}>` : type}</span>
      </span>
    );
    return connectDragSource(connectDropTarget(
      <div 
        className={classes.join(' ')} 
        style={style} 
        onMouseEnter={() => this.setState({ showTooltip: true })}
        onMouseLeave={() => this.setState({ showTooltip: false })}
      >
        <Tooltip tooltip={tooltipContent} visible={this.state.showTooltip}>
          <div className={styles.name}>{name}</div>
          <div className={styles.type}>{required && <span>*</span>}</div>
        </Tooltip>
      </div>
    ));
  }
}

export default DataBrowserHeader;

DataBrowserHeader.propTypes = {
  name: PropTypes.string.isRequired.describe(
    'The name of the column.'
  ),
  type: PropTypes.string.describe(
    'The type of the column.'
  ),
  targetClass: PropTypes.string.describe(
    'The target class for a Pointer or Relation.'
  ),
  order: PropTypes.oneOf(['ascending', 'descending']).describe(
    'A sort ordering that displays as an arrow in the header.'
  ),
};
