import React, { useState, useCallback } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import TextInput from 'components/TextInput/TextInput.react';
import FileInput from 'components/FileInput/FileInput.react';
import Dropdown from 'components/Dropdown/Dropdown.react';
import Option from 'components/Dropdown/Option.react';
import RadioButton from 'components/RadioButton/RadioButton.react';
import FormNote from 'components/FormNote/FormNote.react';
import styles from './PushiOSSettings.scss';

function validate(fields) {
  const errors = {};

  if (!fields.file) {
    errors.file = 'APNs auth key file is required.';
  } else if (!fields.file.name.endsWith('.p8')) {
    errors.file = 'File must have a .p8 extension.';
  }

  if (!fields.keyId || !fields.keyId.trim()) {
    errors.keyId = 'Key ID is required.';
  } else if (fields.keyId.trim().length !== 10) {
    errors.keyId = 'Key ID must be exactly 10 characters.';
  }

  if (!fields.teamId || !fields.teamId.trim()) {
    errors.teamId = 'Team ID is required.';
  } else if (fields.teamId.trim().length !== 10) {
    errors.teamId = 'Team ID must be exactly 10 characters.';
  }

  if (!fields.bundleId || !fields.bundleId.trim()) {
    errors.bundleId = 'Bundle ID is required.';
  }

  if (!fields.deviceType) {
    errors.deviceType = 'Device type is required.';
  }

  return errors;
}

const P8AuthKeyModal = ({ deviceTypes, onSave, onClose }) => {
  const [file, setFile] = useState(null);
  const [keyId, setKeyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [deviceType, setDeviceType] = useState('ios');
  const [production, setProduction] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleSubmit = useCallback(async () => {
    const fields = { file, keyId, teamId, bundleId, deviceType };
    const validationErrors = validate(fields);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    setServerError(null);
    try {
      await onSave(file, keyId.trim(), teamId.trim(), bundleId.trim(), deviceType, production);
      setSaving(false);
      onClose();
    } catch (err) {
      const msg = typeof err === 'string' ? err
        : (err && err.error) || (err && err.message) || 'Failed to save authentication key.';
      setServerError(msg);
      setSaving(false);
    }
  }, [file, keyId, teamId, bundleId, deviceType, production, onSave]);

  const firstError = Object.values(errors).find(Boolean);

  return (
    <B4aModal
      type={B4aModal.Types.DEFAULT}
      title="APNs Authentication Key"
      width={700}
      confirmText={saving ? 'Saving\u2026' : 'Save'}
      cancelText="Cancel"
      onConfirm={handleSubmit}
      onCancel={onClose}
      disabled={saving}
      progress={saving}
    >
      <Field
        label={<Label text="APNs auth key" description="Upload your .p8 auth key file" />}
        input={
          <div className={styles.fileInputField}>
            <FileInput
              onChange={f => { setFile(f); setErrors(prev => ({ ...prev, file: undefined })); setServerError(null); }}
              accept=".p8"
              value={file ? { name: file.name } : undefined}
            />
          </div>
        }
      />
      <Field
        label={<Label text="Key ID" description="Case sensitive, exactly 10 characters" />}
        input={
          <TextInput
            padding="0 1rem"
            dark={false}
            placeholder="Insert your Key ID"
            value={keyId}
            onChange={value => { if (value.length <= 10) { setKeyId(value); setErrors(prev => ({ ...prev, keyId: undefined })); } }}
          />
        }
      />
      <Field
        label={<Label text="Team ID" description="Case sensitive, exactly 10 characters" />}
        input={
          <TextInput
            padding="0 1rem"
            dark={false}
            placeholder="Insert your Team ID"
            value={teamId}
            onChange={value => { if (value.length <= 10) { setTeamId(value); setErrors(prev => ({ ...prev, teamId: undefined })); } }}
          />
        }
      />
      <Field
        label={<Label text="Bundle ID" description="Case sensitive" />}
        input={
          <TextInput
            padding="0 1rem"
            dark={false}
            placeholder="Insert your Bundle ID"
            value={bundleId}
            onChange={value => { setBundleId(value); setErrors(prev => ({ ...prev, bundleId: undefined })); }}
          />
        }
      />
      <Field
        label={<Label text="Device Type" />}
        input={
          <Dropdown
            value={deviceType}
            onChange={value => { setDeviceType(value); setErrors(prev => ({ ...prev, deviceType: undefined })); }}
            placeHolder="Select device type"
            dark={false}
            fixed={true}
          >
            {deviceTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Dropdown>
        }
      />
      <Field
        label={<Label text="Certificate type" description="Development or production" />}
        input={
          <div className={styles.radiobuttonWrapper}>
            <label htmlFor="p8_development" className={styles.radioOption}>
              <RadioButton
                dark={true}
                id="p8_development"
                name="p8Production"
                checked={!production}
                onChange={() => setProduction(false)}
              />Development
            </label>
            <label htmlFor="p8_production" className={styles.radioOption}>
              <RadioButton
                dark={true}
                id="p8_production"
                name="p8Production"
                checked={production}
                onChange={() => setProduction(true)}
              />Production
            </label>
          </div>
        }
      />
      <FormNote show={!!firstError} color="red">
        {firstError}
      </FormNote>
      <FormNote show={!!serverError && !firstError} color="red">
        {serverError}
      </FormNote>
    </B4aModal>
  );
};

export default P8AuthKeyModal;
