/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React     from 'react';
import styles    from './ServerLogsView.scss';
import LogView         from 'components/LogView/LogView.react';
import LogViewEntry    from 'components/LogView/LogViewEntry.react';


const TIMESTAMP_REGEX = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

let isError = (str) => str[0] === 'E';
let getLogEntryInfo = str => {
  let re = getTimestampRegex();
  let time = "";
  let content = "";
  let error = false;

  if (typeof str === "string") {
    time = str.match(re) ? str.match(re)[0] : "";
    content = str.replace(`[${time}]`, "");
    error = isError(str);
  }

  return {
    time,
    content,
    error
  };
};


let getFormattedLogs = (type, text) => {
  let logs = [];
  let delimeter = type === 'access' ? '\n' : '\n\n';
  logs = text.split(delimeter).map(log => {
    return getLogEntryInfo(log);
  });
  return logs;
}

//example timestamp: '2021-06-11T05:14:57.029Z'
let getTimestampRegex = () => new RegExp(TIMESTAMP_REGEX,['i']);

const ServerLogsView = ({ type, logs }) => {

    let formattedLogs = getFormattedLogs(type, logs);

    return (
      <LogView>
        {formattedLogs.map(({ content, time }, idx) => (
          <LogViewEntry key={time+idx} text={content} timestamp={time} />
        ))}
      </LogView>
    );    


}

export default ServerLogsView;