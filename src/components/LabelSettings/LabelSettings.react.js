/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { centered } from 'components/Field/Field.scss';
import PropTypes    from 'lib/PropTypes';
import React        from 'react';
import styles       from 'components/LabelSettings/LabelSettings.scss';

let LabelSettings = (props) => {
  let padding = (props.padding || 20) + 'px';

  return (
    <div
      className={[styles.label].join(' ')}
      style={{ padding: '0 ' + padding }}>
      <div className={styles.text}>
        {props.text}
        {props.help ? <span className={styles.help}>{props.help}</span> : null}
      </div>
      {props.description ? <div className={styles.description}>{props.description}</div> : null}
    </div>
  );
};

export default LabelSettings;

LabelSettings.propTypes = {
  text: PropTypes.node.describe(
    'The main text/node of the label.'
  ),
  description: PropTypes.node.describe(
    'The secondary text/node of the label.'
  ),
  padding: PropTypes.number.describe(
    'Allows you to override the left-right padding of the label.'
  ),
  help: PropTypes.node.describe(
    'The component to be rendered as a help for this label.'
  )
};
