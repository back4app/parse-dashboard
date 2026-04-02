import React from 'react';
import BaseLabelSettings from 'components/LabelSettings/LabelSettings.react';
import styles from './EmailSettings.scss';

export default function EmailLabelSettings({ description, ...props }) {
  const leftAlignedText = props.text ? <span className={styles.labelTextLeft}>{props.text}</span> : props.text;
  const leftAlignedDescription = description
    ? <span className={styles.labelDescriptionLeft}>{description}</span>
    : description;

  return (
    <BaseLabelSettings
      {...props}
      text={leftAlignedText}
      description={leftAlignedDescription}
    />
  );
}
