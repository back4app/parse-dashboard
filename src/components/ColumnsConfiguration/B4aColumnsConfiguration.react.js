import React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import B4aColumnConfigurationItem from 'components/ColumnsConfiguration/B4aColumnConfigurationItem.react';
import styles from 'components/ColumnsConfiguration/B4aColumnsConfiguration.scss';
import Icon from 'components/Icon/Icon.react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';

const POPOVER_CONTENT_ID = 'b4aColumnsConfigurationPopover';

export default class B4aColumnsConfiguration extends React.Component {
  constructor() {
    super();

    this.state = {
      open: false,
    };

    this.entryRef = React.createRef();
  }

  componentWillReceiveProps(props) {
    if (props.schema !== this.props.schema) {
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

  showAll() {
    let shouldReload = false;
    const updatedOrder = this.props.order.map(field => {
      if (!shouldReload && !field.cached) {
        shouldReload = true;
      }
      return { ...field, visible: true };
    });
    this.props.handleColumnsOrder(updatedOrder, shouldReload);
  }

  hideAll() {
    this.props.handleColumnsOrder(this.props.order.map(order => ({ ...order, visible: false })));
  }

  autoSort() {
    const defaultOrder = ['objectId', 'createdAt', 'updatedAt', 'ACL'];
    const order = {
      default: [],
      other: [],
    };
    for (const column of this.props.order) {
      const index = defaultOrder.indexOf(column.name);
      if (index !== -1) {
        order.default[index] = column;
      } else {
        order.other.push(column);
      }
    }
    this.props.handleColumnsOrder([
      ...order.default.filter(column => column),
      ...order.other.sort((a, b) => a.name.localeCompare(b.name)),
    ]);
  }

  render() {
    const { handleColumnDragDrop, handleColumnsOrder, order, disabled } = this.props;
    const title = (
      <div className={styles.title} onClick={this.toggle.bind(this)}>
        <Icon name='b4a-visibility-icon' width={18} height={18} />
      </div>
    );

    let entry = (
      <div className={`${styles.entry} ${styles.toolbarButton}`} onClick={this.toggle.bind(this)} ref={this.entryRef}>
        <Icon name='b4a-visibility-icon' width={18} height={18} />
      </div>
    );

    if (disabled) {
      entry = <div className={styles.toolbarButton + ' ' + styles.disabled} onClick={null}>
        <Icon name='b4a-visibility-icon' width={18} height={18} />
      </div>;
    }

    let popover = null;
    if (this.state.open) {
      popover = (
        <Popover
          fixed={true}
          position={Position.inDocument(this.entryRef.current)}
          onExternalClick={this.toggle.bind(this)}
          contentId={POPOVER_CONTENT_ID}
        >
          <div className={styles.popover} id={POPOVER_CONTENT_ID}>
            {title}
            <div className={styles.body}>
              <div className={styles.columnConfigContainer}>
                <DndProvider backend={HTML5Backend}>
                  {order.map(({ name, visible, ...rest }, index) => {
                    return (
                      <B4aColumnConfigurationItem
                        key={index}
                        index={index}
                        name={name}
                        visible={visible}
                        onChangeVisible={visible => {
                          const updatedOrder = [...order];
                          updatedOrder[index] = {
                            ...rest,
                            name,
                            visible,
                          };
                          let shouldReload = visible;
                          // these fields are always cached as they are never excluded from server
                          // therefore no need to make another request.
                          if (
                            name === 'objectId' ||
                            name === 'createdAt' ||
                            name === 'updatedAt' ||
                            name === 'ACL'
                          ) {
                            shouldReload = false;
                          }
                          if (this.props.className === '_User' && name === 'password') {
                            shouldReload = false;
                          }
                          if (updatedOrder[index].cached) {
                            shouldReload = false;
                          }
                          handleColumnsOrder(updatedOrder, shouldReload);
                        }}
                        handleColumnDragDrop={handleColumnDragDrop}
                      />
                    );
                  })}
                </DndProvider>
              </div>
              <div className={styles.footer}>
                <button onClick={this.hideAll.bind(this)}><Icon width={16} height={16} name="b4a-visibility-off-icon" /> Hide all</button>
                <button onClick={this.showAll.bind(this)}><Icon width={16} height={16} name="b4a-visibility-icon" /> Show all</button>
                <button onClick={this.autoSort.bind(this)}>Auto-sort</button>
              </div>
            </div>
          </div>
        </Popover>
      );
    }
    return (
      <>
        {entry}
        {popover}
      </>
    );
  }
}
