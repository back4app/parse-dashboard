/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React     from 'react';
import ReactDOM  from 'react-dom';
import styles    from 'components/CategoryList/CategoryList.scss';
import { Link }  from 'react-router-dom';
import style from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';

export default class CategoryList extends React.Component {
  componentDidMount() {
    let listWrapper = ReactDOM.findDOMNode(this.refs.listWrapper);
    if (listWrapper) {
      this.highlight = document.createElement('div');
      this.highlight.className = styles.highlight;
      listWrapper.appendChild(this.highlight);
      this._updateHighlight();
    }
  }

  componentDidUpdate() {
    this._updateHighlight();
  }

  componentWillUnmount() {
    if (this.highlight) {
      this.highlight.parentNode.removeChild(this.highlight);
    }
  }

  _updateHighlight() {
    if (this.highlight) {
      for (let i = 0; i < this.props.categories.length; i++) {
        let c = this.props.categories[i];
        let id = c.id || c.name;
        if (id === this.props.current) {
          this.highlight.style.display = 'block';
          this.highlight.style.top = (i * 20) + 'px';
          return;
        }
      }
      this.highlight.style.display = 'none';
    }
  }

  render() {
    if (this.props.categories.length === 0) {
      return null;
    }
    return (
      <div ref='listWrapper' className={styles.class_list}>
        {this.props.categories.map((c) => {
          let id = c.id || c.name;
          let count = c.count;
          let className = id === this.props.current ? styles.active : '';
          let link = this.context.generatePath(
            (this.props.linkPrefix || '') + (c.link || id)
          );
          let categoryActive = c.currentActive;
          let action = c.action;
          if (categoryActive) {
            return (
              <div ref="listWrapper" className={styles.sub_class_list}>
                <div className={styles.action_div} >
                  {c.name}
                  {action
                    ? React.isValidElement(action)
                      ? action
                      : action.renderButton()
                    : null}
                </div>
                {c.subCategories}
              </div>
            );
          }
          return (
            <Link title={c.name} to={{ pathname: link }} className={className} key={id} >
              <span>{count}</span>
              <span>{c.name}</span>
              {c.subCategories}
              <div className={styles.seperatorLg}></div>
            </Link>
          );
        })}
      </div>
    );
  }
}

CategoryList.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.object).describe('Array of categories used to populate list.'),
  current: PropTypes.string.describe('Id of current category to be highlighted.'),
  linkPrefix: PropTypes.string.describe('Link prefix used to generate link path.'),
};

CategoryList.contextTypes = {
  generatePath: PropTypes.func
};
