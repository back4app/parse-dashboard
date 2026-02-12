import React, { useEffect, useState } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import FormNote from 'components/FormNote/FormNote.react';
import styles from 'dashboard/Settings/Modals/editParseVersionModal.scss';

export const EditParseVersionModal = ({ context, setParentState, currentParseVersion }) => {
  const [processing, setProcessing] = useState(false);
  const [parseVersions, setParseVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteColor, setNoteColor] = useState('red');

  const parseDependencies = (deps) => {
    if (!deps) {
      return [];
    }

    // Future-proofing: sometimes APIs may return an array instead of a string.
    if (Array.isArray(deps)) {
      return deps
        .map((mod) => {
          if (typeof mod === 'string') {
            const name = mod.trim();
            return name ? { name, version: '' } : null;
          }
          if (mod && typeof mod === 'object') {
            const name = String(mod.name ?? mod.packageName ?? mod.package ?? mod.module ?? '').trim();
            const version = String(mod.version ?? mod.requiredVersion ?? mod.range ?? '').trim();
            return name ? { name, version } : null;
          }
          return null;
        })
        .filter(Boolean);
    }

    // Expected format:
    // "parse-server: 6.2.0\n@sendgrid/mail: 7.7.0\n..."
    if (typeof deps === 'string') {
      return deps
        .split(/\r?\n|\\n/g) // handles actual newlines and literal "\n"
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(':');
          if (idx === -1) {
            return { name: line, version: '' };
          }
          return {
            name: line.slice(0, idx).trim(),
            version: line.slice(idx + 1).trim(),
          };
        })
        .filter((row) => row.name);
    }

    // Last resort: unknown format
    return [];
  };

  useEffect(() => {
    setProcessing(true);
    context.supportedParseServerVersionsForApp()
      .then((data) => {
        const versions = Array.isArray(data) ? data : (data.results || []);
        setParseVersions(versions);
        const current = versions.find(v => v.version === currentParseVersion);
        setSelectedVersion(current || (versions.length > 0 ? versions[0] : null));
      })
      .catch((e) => {
        setNote(e.error || 'Failed to load versions');
        console.log('e', e);
        setNoteColor('red');
      })
      .finally(() => setProcessing(false));
  }, []);

  const npmModules = parseDependencies(selectedVersion?.dependencies ?? selectedVersion?.npmModules);
  const hasChanged = selectedVersion && selectedVersion.version !== currentParseVersion;

  const close = () => setParentState({ showEditParseVersionModal: false });

  const save = async () => {
    if (!selectedVersion?.version) {
      return;
    }

    try {
      setProcessing(true);
      setNote('');
      await context.changeParseServerVersion(selectedVersion.version);
      close();
    } catch (e) {
      setNote(e?.error || e?.message || 'Failed to save version');
      setNoteColor('red');
    } finally {
      setProcessing(false);
    }
  };

  const displayVersion = selectedVersion
    ? (selectedVersion.version === currentParseVersion
      ? `${selectedVersion.version} - ${selectedVersion.description || ''} (current)`
      : `${selectedVersion.version} - ${selectedVersion.description || ''}`)
    : (processing ? 'Loading...' : 'Select version');

  return (
    <B4aModal
      type={B4aModal.Types.DEFAULT}
      title='Parse Server Version'
      subtitle='Select a version for your app'
      cancelText='Cancel'
      confirmText={processing ? 'Saving...' : 'Save Changes'}
      disableConfirm={!hasChanged || processing || selectedVersion?.disabled}
      disableCancel={processing}
      onCancel={close}
      onConfirm={save}
    >
      <div className={styles.content}>
        <div className={styles.label}>Select Version</div>

        <div className={styles.selectWrapper}>
          <button
            type='button'
            className={styles.selectBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className={styles.selectBtnText}>{displayVersion}</span>
            <span className={`${styles.chevron} ${dropdownOpen ? styles.chevronUp : ''}`}>
              <Icon name='b4a-chevron-down' width={14} height={14} fill='#10203A' />
            </span>
          </button>

          {dropdownOpen && (
            <div className={styles.selectMenu}>
              {parseVersions.length > 0 ? (
                parseVersions.map((v) => (
                  <button
                    key={v.version}
                    type='button'
                    className={`${styles.selectOption} ${selectedVersion?.version === v.version ? styles.selectOptionActive : ''} ${v.disabled ? styles.selectOptionDisabled : ''}`}
                    onClick={() => {
                      if (!v.disabled) {
                        setSelectedVersion(v);
                        setDropdownOpen(false);
                      }
                    }}
                    disabled={v.disabled}
                  >
                    {v.version === currentParseVersion
                      ? `${v.version} - ${v.description || ''} (current)`
                      : `${v.version} - ${v.description || ''}`}
                  </button>
                ))
              ) : (
                <div className={styles.selectEmpty}>No versions available</div>
              )}
            </div>
          )}
        </div>

        <div className={styles.npmSection}>
          <div className={styles.npmHeader}>Installed npm modules</div>
          <div className={styles.npmList}>
            {npmModules.length > 0 ? (
              npmModules.map(({ name, version }, idx) => (
                <div key={`${name}-${version}-${idx}`} className={styles.npmItem}>
                  <span className={styles.npmName}>{name}</span>
                  <span className={styles.npmVersion}>{version || ''}</span>
                </div>
              ))
            ) : (
              <div className={styles.npmEmpty}>No npm modules installed</div>
            )}
          </div>
        </div>

        {note !== '' && (
          <FormNote show={note !== ''} color={noteColor}>
            {note}
          </FormNote>
        )}
      </div>
    </B4aModal>
  );
};
