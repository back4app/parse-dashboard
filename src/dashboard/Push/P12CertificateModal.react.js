import React, { useState, useCallback } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import FileInput from 'components/FileInput/FileInput.react';
import Dropdown from 'components/Dropdown/Dropdown.react';
import Option from 'components/Dropdown/Option.react';
import RadioButton from 'components/RadioButton/RadioButton.react';
import FormNote from 'components/FormNote/FormNote.react';
import styles from './PushiOSSettings.scss';

function validate(fields) {
  const errors = {};

  if (!fields.file) {
    errors.file = 'APNs certificate file is required.';
  } else if (!fields.file.name.endsWith('.p12')) {
    errors.file = 'File must have a .p12 extension.';
  }

  if (!fields.deviceType) {
    errors.deviceType = 'Device type is required.';
  }

  return errors;
}

const P12CertificateModal = ({ deviceTypes, onSave, onClose }) => {
  const [file, setFile] = useState(null);
  const [deviceType, setDeviceType] = useState('ios');
  const [production, setProduction] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleSubmit = useCallback(async () => {
    const fields = { file, deviceType };
    const validationErrors = validate(fields);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    setServerError(null);
    try {
      await onSave(file, deviceType, production);
      setSaving(false);
      onClose();
    } catch (err) {
      const msg = typeof err === 'string' ? err
        : (err && err.error) || (err && err.message) || 'Failed to save certificate.';
      setServerError(msg);
      setSaving(false);
    }
  }, [file, deviceType, production, onSave]);

  const firstError = Object.values(errors).find(Boolean);

  return (
    <B4aModal
      type={B4aModal.Types.DEFAULT}
      title="APNs Certificate"
      width={700}
      confirmText={saving ? 'Saving\u2026' : 'Save'}
      cancelText="Cancel"
      onConfirm={handleSubmit}
      onCancel={onClose}
      disabled={saving}
      progress={saving}
      canCancel={!saving}
    >
      <Field
        label={<Label text="APNs Certificate File" description="Upload your .p12 certificate file" />}
        input={
          <div className={styles.fileInputField}>
            <FileInput
              onChange={f => { setFile(f); setErrors(prev => ({ ...prev, file: undefined })); setServerError(null); }}
              accept=".p12,application/x-pkcs12"
              value={file ? { name: file.name } : undefined}
            />
          </div>
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
            <label htmlFor="p12_development" className={styles.radioOption}>
              <RadioButton
                dark={true}
                id="p12_development"
                name="p12Production"
                checked={!production}
                onChange={() => setProduction(false)}
              />Development
            </label>
            <label htmlFor="p12_production" className={styles.radioOption}>
              <RadioButton
                dark={true}
                id="p12_production"
                name="p12Production"
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

export default P12CertificateModal;
