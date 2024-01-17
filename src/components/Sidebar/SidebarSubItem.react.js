/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { Link } from "react-router-dom";
import React from "react";
import styles from "components/Sidebar/Sidebar.scss";
import B4aBadge from "components/B4aBadge/B4aBadge.react";

const sendEvent = () => {
  back4AppNavigation &&
    back4AppNavigation.atApiReferenceIntroEvent &&
    back4AppNavigation.atApiReferenceIntroEvent();
};

let SidebarSubItem = ({ active, name, action, link, children, badge }) => {
  if (active) {
    return (
      <div>
        <div className={styles.subitem + ' subitem'}>
          {name}
          {action
            ? React.isValidElement(action)
              ? action
              : action.renderButton()
            : null}
          {badge ? <B4aBadge {...badge} /> : null}
        </div>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div>
      {link.startsWith("/") ? (
        <Link className={styles.subitem} to={{ pathname: link }}>
          {name}
          {badge ? <B4aBadge {...badge} /> : null}
        </Link>
      ) : (
        <a
          className={styles.subitem}
          href={link}
          target="_blank"
          onClick={() => sendEvent()}
        >
          {name}
          {badge ? <B4aBadge {...badge} /> : null}
        </a>
      )}
    </div>
  );
};

export default SidebarSubItem;
