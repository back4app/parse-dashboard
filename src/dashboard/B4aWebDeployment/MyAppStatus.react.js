import React, { useMemo } from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from './B4aWebDeployment.scss'

const StatusError = <Icon name="status-error" width="12px" height="12px" fill="#E85C3E" />;
const StatusSpinner = <Icon name="status-spinner" width="12px" height="12px" fill="#15A9FF" className={styles.spinnerStatus} /> ;
const StatusSuccess = <Icon name="b4a-success-check" width="12px" height="12px" fill="#27AE60" /> ;
const StatusQueued = <Icon name="status-queued" width="12px" height="12px" fill="#FBFF3B" />;

export const TaskStatus = {
  WAITING: 'WAITING',
  DOING: 'DOING',
  DONE: 'DONE',
  FAILED: 'FAILED',
};

export const DeploymentStatus = {
  INITIALIZING: 'INITIALIZING',
  INITIALIZED: 'INITIALIZED',
  DEPLOYING: 'DEPLOYING',
  QUEUED: 'QUEUED',
  READY: 'READY',
  SLEEPY: 'SLEEPY',
  SLEEPING: 'SLEEPING',
  WAKING_UP: 'WAKING_UP',
  RENEWING: 'RENEWING',
  DESTROYING: 'DESTROYING',
  DESTROYED: 'DESTROYED',
  CANCELING: 'CANCELING',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
};

export const AppStatus = {
  INITIALIZING: 'INITIALIZING',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  INITIALIZED: 'INITIALIZED',
  FAILED: 'FAILED',
};


const MyAppStatus = ({ app }) => {
  const appStatus = app.status;
  const mainServiceEnvironment = app.mainService && app.mainService.mainServiceEnvironment;
  const mainServiceEnvironmentExists = !!mainServiceEnvironment;
  const isPendingPayment = mainServiceEnvironment && (mainServiceEnvironment.isPendingPayment || (!mainServiceEnvironment.isFreePlanElegible && mainServiceEnvironment.plan.name.includes('Free')))
  const lastDeployment = mainServiceEnvironment && mainServiceEnvironment.lastDeployment;
  const lastDeploymentStatus = lastDeployment && lastDeployment.status;
  const deployTaskStatus = lastDeployment && lastDeployment.deployTask && lastDeployment.deployTask.status;
  const activeDeployment = mainServiceEnvironment && mainServiceEnvironment.activeDeployment;
  const activeDeploymentExists = !!activeDeployment;

  const { DisplayIcon, text } = useMemo(
    () => {
      let DisplayIcon = StatusError;
      let text = 'Failed';

      if (appStatus === AppStatus.INITIALIZING) {
        DisplayIcon = StatusSpinner;
        text = 'Initializing';
      } else if (appStatus === AppStatus.PENDING_VERIFICATION) {
        DisplayIcon = StatusQueued;
        text = 'Pending Verification';
      } else if (
        appStatus === AppStatus.INITIALIZED &&
        mainServiceEnvironmentExists
      ) {
        if (isPendingPayment) {
          DisplayIcon = StatusQueued;
          text = 'Pending Payment';
        } else if (activeDeploymentExists) {
          DisplayIcon = StatusSuccess;
          text = 'Available';
        } else if (lastDeploymentStatus) {
          if (
            [DeploymentStatus.INITIALIZING, DeploymentStatus.INITIALIZED, DeploymentStatus.DEPLOYING, DeploymentStatus.QUEUED].includes(lastDeploymentStatus) &&
            deployTaskStatus !== TaskStatus.FAILED
          ) {
            DisplayIcon = StatusSpinner;
            text = 'Deploying';
          } else {
            DisplayIcon = StatusError;
            text = 'Unavailable';
          }
        } else {
          DisplayIcon = StatusSpinner;
          text = 'Initialized';
        }
      }

      return { DisplayIcon, text };
    },
    [
      appStatus,
      mainServiceEnvironmentExists,
      lastDeploymentStatus,
      deployTaskStatus,
      activeDeploymentExists,
      isPendingPayment
    ]
  )

  return (<>
    <div style={{ display: 'flex', alignItems: 'center'}}>
      {DisplayIcon}
      <div style={{ marginLeft: '0.3125rem', fontSize: '12px', lineHeight: 1.4, color: '#C1E2FF' }}>
        {text}
      </div>
    </div>
  </>);
}

export default MyAppStatus;
