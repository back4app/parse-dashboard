import React, { useEffect, useState } from 'react';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import FormNote from 'components/FormNote/FormNote.react';
import styles from 'dashboard/Settings/Modals/editParseVersionModal.scss';
import modalStyles from 'components/B4aModal/B4aModal.scss';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';

const origin = new Position(0, 0);

export const EditParseVersionModal = ({ context, setParentState, currentParseVersion }) => {
  const [processing, setProcessing] = useState(false);
  const [parseVersions, setParseVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteColor, setNoteColor] = useState('red');
  const [migrationLinks, setMigrationLinks] = useState([]);

  const isGDPR = !!(context && context.custom && context.custom.isGDPR);

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
    const versionsPromise = context.supportedParseServerVersionsForApp()
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
      });

    // Migration links are best-effort: if they fail we still show the version picker.
    const linksPromise = context.parseServerMigrationLinks()
      .then((data) => {
        const links = Array.isArray(data) ? data : (data?.results || []);
        setMigrationLinks(links);
      })
      .catch(() => {
        setMigrationLinks([]);
      });

    Promise.all([versionsPromise, linksPromise]).finally(() => setProcessing(false));
  }, []);

  const npmModules = parseDependencies(selectedVersion?.dependencies ?? selectedVersion?.npmModules);
  const hasSelectedVersion = !!selectedVersion?.version;

  const visibleMigrations = isGDPR
    ? []
    : (migrationLinks || []).filter((m) => m && m.link && m.version !== selectedVersion?.version);

  const close = () => setParentState({ showEditParseVersionModal: false });

  const save = async () => {
    if (!selectedVersion?.version) {
      return;
    }

    try {
      setProcessing(true);
      setNote('');
      await context.changeParseServerVersion(selectedVersion.version);
      // Force UI refresh so the new parseVersion shows everywhere.
      window.location.reload();
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
    <Popover fadeIn={true} fixed={true} position={origin} modal={true} color="rgba(17,13,17,0.8)">
      <div
        className={[modalStyles.modal, styles.modal].join(' ')}
        style={{ width: '35vw', minWidth: 360 }}
      >
        <Icon onClick={close} width={10} height={10} className={modalStyles.closeIcon} name="close" fill="#10203A" />

        <div className={`${modalStyles.header} ${styles.header}`}>
          <div className={modalStyles.title}>Manage Parse Version</div>
          <div className={modalStyles.subtitle}>Change the Parse Server version by selecting the version you want to use for this app.
          </div>
        </div>

        <div className={styles.modalBody}>
          {visibleMigrations.length > 0 && (
            <div className={styles.migrationCard}>
              {visibleMigrations.map((m) => (
                <div key={m.id || m._id || m.version} className={styles.migrationItem}>
                  <div className={styles.migrationHead}>
                    <span className={styles.migrationTitle}>
                      Upgrade to the latest Parse Server
                    </span>
                    <a
                      className={styles.migrationLink}
                      href={`${m.link}?appId=${context.applicationId}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label='Schedule migration'
                      title='Schedule migration'
                    >
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='#27AE60'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M8 1.5a1 1 0 0 1 1 1V4h6V2.5a1 1 0 1 1 2 0V4h1.5A2.5 2.5 0 0 1 21 6.5V9H3V6.5A2.5 2.5 0 0 1 5.5 4H7V2.5a1 1 0 0 1 1-1ZM3 10.5h18v8A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-8ZM7.25 12.5h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-1.5a.5.5 0 0 1 .5-.5Zm4 0h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-1.5a.5.5 0 0 1 .5-.5Zm4 0h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-1.5a.5.5 0 0 1 .5-.5Zm-8 4h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5V17a.5.5 0 0 1 .5-.5Zm4 0h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5V17a.5.5 0 0 1 .5-.5Zm4 0h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5V17a.5.5 0 0 1 .5-.5Z'
                        />
                      </svg>
                    </a>
                  </div>
                  {m.description && (
                    <p className={styles.migrationDescription}>{m.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className={styles.content}>


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
                        className={`${styles.selectOption} ${selectedVersion?.version === v.version ? styles.selectOptionActive : ''} ${v.version === currentParseVersion ? styles.selectOptionCurrent : ''} ${v.disabled ? styles.selectOptionDisabled : ''}`}
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
            <div style={{ marginBottom: '10px' }}>
              <FormNote show={note !== ''} color={noteColor}>
                {note}
              </FormNote>
            </div>
          )}
        </div>

        <div className={modalStyles.footer} style={{ textAlign: 'right' }}>
          <Button
            color="white"
            width="auto"
            additionalStyles={{ border: '1px solid #ccc', color: '#303338' }}
            value="Cancel"
            onClick={close}
            disabled={processing}
          />
          <Button
            primary={true}
            value={processing ? 'Saving...' : 'Save Changes'}
            color="green"
            disabled={!hasSelectedVersion || processing}
            onClick={save}
            progress={processing}
          />
        </div>
      </div>
    </Popover>
  );
};
