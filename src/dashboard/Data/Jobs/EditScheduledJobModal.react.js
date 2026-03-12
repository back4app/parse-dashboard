import React, { useState, useEffect } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import B4aToggle from 'components/Toggle/B4aToggle.react';
import DateTimeInput from 'components/DateTimeInput/DateTimeInput.react';
import Dropdown from 'components/Dropdown/Dropdown.react';
import Field from 'components/Field/Field.react';
import FormNote from 'components/FormNote/FormNote.react';
import IntervalInput from 'components/IntervalInput/IntervalInput.react';
import Label from 'components/Label/Label.react';
import Option from 'components/Dropdown/Option.react';
import TextInput from 'components/TextInput/TextInput.react';
import TimeInput from 'components/TimeInput/TimeInput.react';
import { hoursFrom } from 'lib/DateUtils';

function parseInitialState(job) {
  if (!job) {
    return {
      name: '',
      cloudCodeFunction: '',
      parameter: '',
      startAt: hoursFrom(new Date(), 1),
      repeat: false,
      repeatType: 'Every day',
      intervalCount: 15,
      intervalUnit: 'minute',
      repeatHour: '12',
      repeatMinute: '00',
    };
  }

  const startAfter = job.startAfter ? new Date(job.startAfter) : hoursFrom(new Date(), 1);
  let repeat = false;
  let repeatType = 'Every day';
  let intervalCount = 15;
  let intervalUnit = 'minute';
  let repeatHour = '12';
  let repeatMinute = '00';

  if (job.repeatMinutes) {
    repeat = true;
    if (job.repeatMinutes === 1440) {
      repeatType = 'Every day';
    } else {
      repeatType = 'On an interval';
      if (job.repeatMinutes > 60) {
        intervalCount = (job.repeatMinutes / 60) | 0;
        intervalUnit = 'hour';
      } else {
        intervalCount = job.repeatMinutes;
        intervalUnit = 'minute';
      }
    }
  }

  if (job.timeOfDay) {
    const parts = job.timeOfDay.split(':');
    repeatHour = parts[0] ? parts[0].replace(/^0/, '') || '0' : '12';
    repeatMinute = parts[1] || '00';
  }

  return {
    name: job.description || '',
    cloudCodeFunction: job.jobName || '',
    parameter: job.params || '',
    startAt: startAfter,
    repeat,
    repeatType,
    intervalCount,
    intervalUnit,
    repeatHour,
    repeatMinute,
  };
}

const FIELD_PADDING = { padding: '0 1rem', width: '100%' };

const EditScheduledJobModal = ({ job, context, onCancel, onSuccess }) => {
  const isCreate = !job;
  const initial = parseInitialState(job);

  const [name, setName] = useState(initial.name);
  const [cloudCodeFunction, setCloudCodeFunction] = useState(initial.cloudCodeFunction);
  const [parameter, setParameter] = useState(initial.parameter);
  const [startAt, setStartAt] = useState(initial.startAt);
  const [repeat, setRepeat] = useState(initial.repeat);
  const [repeatType, setRepeatType] = useState(initial.repeatType);
  const [intervalCount, setIntervalCount] = useState(initial.intervalCount);
  const [intervalUnit, setIntervalUnit] = useState(initial.intervalUnit);
  const [repeatHour, setRepeatHour] = useState(initial.repeatHour);
  const [repeatMinute, setRepeatMinute] = useState(initial.repeatMinute);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [paramError, setParamError] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(isCreate);

  useEffect(() => {
    if (!isCreate) {
      return;
    }
    context.getAvailableJobs()
      .then(result => {
        const jobs = (result && result.jobs) || [];
        setAvailableJobs(jobs);
        if (jobs.length > 0) {
          setCloudCodeFunction(jobs[0]);
        }
      })
      .catch(() => setAvailableJobs([]))
      .finally(() => setLoadingJobs(false));
  }, []);

  function buildPayload() {
    let parsedParam = null;
    if (parameter && parameter.trim() !== '') {
      parsedParam = JSON.parse(parameter);
    }

    let dailyRun = null;
    let intervalRun = null;

    if (repeat) {
      const hour = repeatHour.length < 2 ? '0' + repeatHour : repeatHour;
      if (repeatType === 'Every day') {
        dailyRun = `${hour}:${repeatMinute}`;
      } else {
        intervalRun = intervalCount * (intervalUnit === 'hour' ? 60 : 1);
        dailyRun = `${hour}:${repeatMinute}`;
      }
    }

    return {
      job: {
        name,
        cloudCodeFunction,
        parameter: parsedParam,
        schedule: {
          start: startAt.toISOString(),
          dailyRun,
          intervalRun,
        },
      },
    };
  }

  function validateParameter(value) {
    if (!value || value.trim() === '') {
      return null;
    }
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch (e) {
      return 'Parameters must be valid JSON.';
    }
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return 'Parameters must be a JSON object, e.g. { "key": "value" }.';
    }
    return null;
  }

  function validate() {
    if (!name.trim()) {
      return 'A name is required.';
    }
    if (!cloudCodeFunction) {
      return 'A cloud code function is required.';
    }
    const paramErr = validateParameter(parameter);
    if (paramErr) {
      return paramErr;
    }
    return null;
  }

  function handleConfirm() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    const payload = buildPayload();
    const request = isCreate
      ? context.createScheduledJob(payload)
      : context.updateScheduledJob(job.objectId, payload);
    request
      .then(() => {
        setSaving(false);
        onSuccess();
      })
      .catch(err => {
        setSaving(false);
        setError((err && (err.error || err.message)) || `Failed to ${isCreate ? 'create' : 'update'} job. Please try again.`);
      });
  }

  return (
    <B4aModal
      type={B4aModal.Types.INFO}
      title={isCreate ? 'Schedule a job' : 'Edit scheduled job'}
      subtitle={isCreate ? 'Configure a new scheduled job' : 'Update the job configuration below'}
      confirmText={saving ? (isCreate ? 'Scheduling...' : 'Saving...') : (isCreate ? 'Schedule' : 'Save')}
      cancelText="Cancel"
      disableConfirm={saving || loadingJobs || name.trim().length < 3}
      disableCancel={saving}
      buttonsInCenter={false}
      width={700}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <div style={{ borderRadius: '4px', overflow: 'hidden', maxHeight: '50vh', overflowY: 'auto' }}>

        <Field
          label={
            <Label
              text="Name"
              description="Give this schedule a name that describes what it does"
            />
          }
          input={
            <TextInput
              placeholder="Pick a good name"
              dark={false}
              padding="0 1rem"
              value={name}
              onChange={val => { setName(val); setError(null); }}
            />
          }
        />

        <Field
          label={<Label text="Cloud job" description="The cloud code function to run" />}
          input={
            isCreate ? (
              loadingJobs ? (
                <TextInput value="Loading\u2026" dark={false} padding="0 1rem" disabled={true} />
              ) : (
                <Dropdown
                  fixed={true}
                  dark={false}
                  value={cloudCodeFunction}
                  onChange={val => { setCloudCodeFunction(val); setError(null); }}
                >
                  {availableJobs.map(jobName => (
                    <Option key={jobName} value={jobName}>{jobName}</Option>
                  ))}
                </Dropdown>
              )
            ) : (
              <TextInput value={cloudCodeFunction} dark={false} padding="0 1rem" disabled={true} />
            )
          }
        />

        <Field
          label={
            <Label
              text="Parameters"
              description="Specify an optional JSON object to pass to the job"
            />
          }
          input={
            <div style={FIELD_PADDING}>
              <TextInput
                monospace={true}
                multiline={true}
                dark={false}
                placeholder={'{\n  \u2026\n}'}
                value={parameter}
                onChange={val => {
                  setParameter(val);
                  setParamError(validateParameter(val));
                  setError(null);
                }}
              />
              {paramError && (
                <div style={{ color: '#e02020', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                  {paramError}
                </div>
              )}
            </div>
          }
        />

        <Field
          label={<Label text="When should it start?" />}
          input={
            <div style={FIELD_PADDING}>
              <DateTimeInput value={startAt} onChange={setStartAt} />
            </div>
          }
        />

        <Field
          label={
            <Label
              text="Should it repeat?"
              description="Run once every day or on a custom interval"
            />
          }
          input={
            <div style={FIELD_PADDING}>
              <B4aToggle
                type={B4aToggle.Types.YES_NO}
                value={repeat}
                onChange={setRepeat}
                additionalStyles={{ margin: '0' }}
              />
            </div>
          }
        />

        {repeat && (
          <Field
            label={<Label text="How should it repeat?" />}
            input={
              <div style={FIELD_PADDING}>
                <B4aToggle
                  type={B4aToggle.Types.TWO_WAY}
                  value={repeatType}
                  optionLeft="On an interval"
                  optionRight="Every day"
                  onChange={setRepeatType}
                  additionalStyles={{ margin: '0' }}
                />
              </div>
            }
          />
        )}

        {repeat && repeatType === 'On an interval' && (
          <Field
            label={<Label text="Repeat every" />}
            input={
              <div style={FIELD_PADDING}>
                <IntervalInput
                  count={intervalCount}
                  unit={intervalUnit}
                  onChange={(count, unit) => { setIntervalCount(count); setIntervalUnit(unit); }}
                />
              </div>
            }
          />
        )}

        {repeat && (
          <Field
            label={
              <Label text={repeatType === 'Every day' ? 'Run each day at (UTC)' : 'Starting each day at (UTC)'} />
            }
            input={
              <div style={FIELD_PADDING}>
                <TimeInput
                  hours={repeatHour}
                  minutes={repeatMinute}
                  onChange={(h, m) => { setRepeatHour(h); setRepeatMinute(m); }}
                />
              </div>
            }
          />
        )}

      </div>
      {error && (
        <FormNote show={true} color="red">{error}</FormNote>
      )}
    </B4aModal>
  );
};

export default EditScheduledJobModal;
