/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import { ActionTypes } from 'lib/stores/JobsStore';
import Button from 'components/Button/Button.react';
import * as DateUtils from 'lib/DateUtils';
import CategoryList from 'components/CategoryList/CategoryList.react';
import EmptyGhostState from 'components/EmptyGhostState/EmptyGhostState.react';
import ChromeDropdown from 'components/ChromeDropdown/ChromeDropdown.react';
import Icon from 'components/Icon/Icon.react';
import JobScheduleReminder from 'dashboard/Data/Jobs/JobScheduleReminder.react';
import Modal from 'components/Modal/Modal.react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import React from 'react';
import ReleaseInfo from 'components/ReleaseInfo/ReleaseInfo';
import RunNowButton from 'dashboard/Data/Jobs/RunNowButton.react';
import SidebarAction from 'components/Sidebar/SidebarAction';
import B4aStatusIndicator from 'components/StatusIndicator/B4aStatusIndicator.react';
import styles from 'dashboard/Data/Jobs/Jobs.scss';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';
import filterStyles from 'components/SlowQueriesFilter/SlowQueriesFilter.scss';
import tableStyles from 'dashboard/TableView.scss';
import subscribeTo from 'lib/subscribeTo';
import TableHeader from 'components/Table/TableHeader.react';
import TableView from 'dashboard/TableView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import generatePath from 'lib/generatePath';
import { withRouter } from 'lib/withRouter';

const subsections = {
  all: 'All Jobs',
  // scheduled: 'Scheduled Jobs',
  status: 'Job Status',
};

const statusColors = {
  succeeded: 'green',
  failed: 'red',
  running: 'blue',
};

function scheduleString(data) {
  let schedule = '';
  if (data.repeatMinutes) {
    if (data.repeatMinutes === 1440) {
      schedule += 'Every day, ';
    } else if (data.repeatMinutes > 60) {
      schedule += 'Each day, every ' + ((data.repeatMinutes / 60) | 0) + ' hours, ';
    } else {
      schedule += 'Each day, every ' + data.repeatMinutes + ' minutes, ';
    }
    schedule += 'after ' + data.timeOfDay.substr(0, 5) + ', ';
    schedule += 'starting ';
  } else {
    schedule = 'On ';
  }
  const runAt = new Date(data.startAfter);
  schedule +=
    runAt.getUTCMonth() + '/' + runAt.getUTCDate() + '/' + String(runAt.getUTCFullYear()).substr(2);
  schedule +=
    ' at ' +
    (runAt.getUTCHours() < 10 ? '0' : '') +
    runAt.getUTCHours() +
    ':' +
    (runAt.getUTCMinutes() < 10 ? '0' : '') +
    runAt.getUTCMinutes() +
    '.';
  return <div style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: '16px' }}>{schedule}</div>;
}

// TODO: create scrollable view component that handles lazy fetch container on scroll
@subscribeTo('Jobs', 'jobs')
@withRouter
class Jobs extends TableView {
  constructor() {
    super();
    this.section = 'Cloud Code';
    this.subsection = 'Jobs';

    this.state = {
      toDelete: null,
      jobStatus: undefined,
      loading: true,
      // Properties used to control data access
      hasPermission: true,
      errorMessage: '',
      // Job Status section filters (client-side)
      filterStatus: undefined,
      filterJobName: undefined,
      filterOpen: false,
    };
    this.filterWrapRef = React.createRef();
  }

  componentWillMount() {
    this.loadData();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.availableJobs) {
      if (nextProps.availableJobs.length > 0) {
        this.action = new SidebarAction(<span><Icon width={16} height={16} name="b4a-add-outline-circle" />Schedule job</span>, this.navigateToNew.bind(this));
        return;
      }
    }
    // check if the changes are in currentApp serverInfo status
    // if not return without making any request
    if (this.props.apps !== nextProps.apps) {
      const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === this.props.params.appId);
      const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.params.appId);
      const shouldUpdate = updatedCurrentApp.serverInfo.status !== prevCurrentApp.serverInfo.status;
      if (!shouldUpdate) {return;}
    }
    this.action = null;
    this.loadData();
  }

  navigateToNew() {
    this.props.navigate(generatePath(this.context, 'jobs/new'));
  }

  navigateToJob(jobId) {
    this.props.navigate(generatePath(this.context, `jobs/edit/${jobId}`));
  }

  loadData() {
    this.props.jobs.dispatch(ActionTypes.FETCH).finally(() => {
      const err = this.props.jobs.data && this.props.jobs.data.get('err')
      // Verify error message, used to control collaborators permissions
      if (err && err.code === 403)
      {this.setState({
        loading: false,
        hasPermission: false,
        errorMessage: err.message
      });}
      // incase of any other error, show error message
      if (err) {
        this.setState({
          loading: false,
          errorMessage: 'Something went wrong! Could not fetch jobs, please open a ticket.',
        });
      }
      // If is a unexpected error just finish loading state
      else {this.setState({ loading: false });}
      this.renderEmpty()
    });
    this.context.getJobStatus().then(status => {
      this.setState({ jobStatus: status });
    }).catch(() => {
      this.setState({ jobStatus: [] });
    });
  }

  renderSidebar() {
    const current = this.props.params.section || '';
    return (
      <CategoryList
        current={current}
        linkPrefix={'jobs/'}
        categories={[
          { name: 'All Jobs', id: 'all' },
          // { name: 'Scheduled Jobs', id: 'scheduled' },
          { name: 'Job Status', id: 'status' },
        ]}
      />
    );
  }

  renderRow(data) {
    // Just render rows if user has permission to access data
    if (!this.state.hasPermission) {return}
    if (this.props.params.section === 'all') {
      return (
        <tr key={data.jobName} className={tableStyles.verticalBorderedCell}>
          <td style={{ width: '50%', fontSize: '14px' }}>{data.jobName}</td>
          <td className={styles.buttonCell + ' ' + styles.right}>
            <RunNowButton job={data} />
          </td>
        </tr>
      );
    } else if (this.props.params.section === 'scheduled') {
      return (
        <tr key={data.objectId}>
          <td style={{ width: '20%' }}>{data.description}</td>
          <td style={{ width: '20%' }}>{data.jobName}</td>
          <td style={{ width: '20%' }}>{scheduleString(data)}</td>
          <td className={styles.buttonCell}>
            <RunNowButton job={data} width={'100px'} />
            <Button width={'80px'} value="Edit" onClick={() => this.navigateToJob(data.objectId)} />
            <Button
              width={'80px'}
              color="red"
              value="Delete"
              onClick={() => this.setState({ toDelete: data.objectId })}
            />
          </td>
        </tr>
      );
    } else if (this.props.params.section === 'status') {
      return (
        <tr key={data.objectId}>
          <td style={{ width: '20%' }}>{data.jobName}</td>
          <td style={{ width: '20%' }}>{DateUtils.dateStringUTC(new Date(data.createdAt))}</td>
          <td style={{ width: '20%' }}>
            {data.finishedAt ? DateUtils.dateStringUTC(new Date(data.finishedAt.iso)) : ''}
          </td>
          <td style={{ width: '20%' }}>
            <div style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: '16px' }}>
              {data.message}
            </div>
          </td>
          <td style={{ width: '20%' }}>
            <B4aStatusIndicator text={data.status} color={statusColors[data.status]} />
          </td>
        </tr>
      );
    }
  }

  renderHeaders() {
    if (this.props.params.section === 'all') {
      return [
        <TableHeader key="name" width={50}>
          Name
        </TableHeader>,
        <TableHeader key="actions" width={50} textAlign="right">
          Actions
        </TableHeader>,
      ];
    } else if (this.props.params.section === 'scheduled') {
      return [
        <TableHeader key="name" width={20}>
          Name
        </TableHeader>,
        <TableHeader key="func" width={20}>
          Function
        </TableHeader>,
        <TableHeader key="schedule" width={20}>
          Schedule (UTC)
        </TableHeader>,
        <TableHeader key="actions" width={40}>
          Actions
        </TableHeader>,
      ];
    } else {
      return [
        <TableHeader key="func" width={20}>
          Function
        </TableHeader>,
        <TableHeader key="started" width={20}>
          Started At (UTC)
        </TableHeader>,
        <TableHeader key="finished" width={20}>
          Finished At (UTC)
        </TableHeader>,
        <TableHeader key="message" width={20}>
          Message
        </TableHeader>,
        <TableHeader key="status" width={20}>
          Status
        </TableHeader>,
      ];
    }
  }

  renderFooter() {
    if (this.props.params.section === 'scheduled') {
      return <JobScheduleReminder />;
    }

    return null;
  }

  renderEmpty() {
    if (!this.state.hasPermission || this.state.errorMessage) {
      // Permission denied state or any other error
      return (
        <EmptyGhostState
          title='Cloud Jobs'
          description={this.state.errorMessage}
        />
      )
    }
    if (this.props.params.section === 'all') {
      return (
        <EmptyGhostState
          title="Cloud Jobs"
          description="Define Jobs on parse-server with Parse.Cloud.job()"
        />
      );
    } else if (this.props.params.section === 'scheduled') {
      return (
        <EmptyGhostState
          title="Cloud Jobs"
          description={
            <div>
              <p>{'On this page you can create JobSchedule objects.'}</p>
              <br />
              <JobScheduleReminder />
            </div>
          }
        />
      );
    } else {
      return (
        <EmptyGhostState
          title="Job Status"
          description="There are no active jobs to show at this time."
        />
      );
    }
  }

  renderExtras() {
    if (this.state.toDelete) {
      return (
        <Modal
          type={Modal.Types.DANGER}
          title="Delete job schedule?"
          subtitle="Careful, this action cannot be undone"
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => this.setState({ toDelete: null })}
          onConfirm={() => {
            this.setState({ toDelete: null });
            this.props.jobs.dispatch(ActionTypes.DELETE, {
              jobId: this.state.toDelete,
            });
          }}
        />
      );
    }
  }

  tableData() {
    // Return a empty array if user don't have permission to read scheduled jobs
    if (!this.state.hasPermission) {return []}
    let data = undefined;
    if (this.props.params.section === 'scheduled' || this.props.params.section === 'all') {
      if (this.props.jobs.data) {
        const jobs = this.props.jobs.data.get('jobs');
        if (jobs) {
          if (Array.isArray(jobs)) {
            data = jobs;
          } else
          {data = jobs.toArray();}
        }
        // if (jobs) {
        // data = jobs.toArray();
        // }
      }
    } else if (this.props.params.section === 'status') {
      let statusList = this.state.jobStatus || [];
      if (this.state.filterStatus) {
        statusList = statusList.filter(job => job.status === this.state.filterStatus);
      }
      if (this.state.filterJobName) {
        statusList = statusList.filter(job => job.jobName === this.state.filterJobName);
      }
      return statusList;
    }
    return data;
  }

  getJobNameOptions() {
    const jobStatus = this.state.jobStatus || [];
    const names = [...new Set(jobStatus.map(job => job.jobName).filter(Boolean))];
    return names.sort();
  }

  onRefresh() {
    this.setState({
      toDelete: null,
      jobStatus: undefined,
      loading: true,
    });
    this.loadData();
  }

  clearJobStatusFilter() {
    this.setState(
      { filterOpen: false, filterStatus: undefined, filterJobName: undefined }
    );
  }

  renderJobStatusFilter() {
    const JOB_STATUS_OPTIONS = ['succeeded', 'failed', 'running'];
    const { filterStatus, filterJobName, filterOpen } = this.state;
    const active = filterStatus || filterJobName;
    let popover = null;

    if (filterOpen && this.filterWrapRef.current) {
      const position = Position.inDocument(this.filterWrapRef.current);
      const popoverStyle = [filterStyles.popover];
      if (active) popoverStyle.push(filterStyles.active);
      popover = (
        <Popover fixed={false} position={position}>
          <div className={popoverStyle.join(' ')}>
            <div className={filterStyles.title} onClick={() => this.setState({ filterOpen: false })}>
              <Icon name="b4a-browser-filter-icon" width={18} height={18} />
            </div>
            <div className={filterStyles.body}>
              <div className={filterStyles.row}>
                <ChromeDropdown
                  color={active ? '' : 'purple'}
                  value={filterStatus || 'Status'}
                  options={JOB_STATUS_OPTIONS}
                  onChange={status => this.setState({ filterStatus: status })}
                />
                <ChromeDropdown
                  color={active ? '' : 'purple'}
                  value={filterJobName || 'Job name'}
                  options={this.getJobNameOptions()}
                  onChange={jobName => this.setState({ filterJobName: jobName })}
                  width={200}
                />
              </div>
              <div className={filterStyles.footer}>
                <Button
                  color="white"
                  value="Clear all"
                  disabled={!active}
                  dark={true}
                  onClick={this.clearJobStatusFilter.bind(this)}
                />
              </div>
            </div>
          </div>
        </Popover>
      );
    }

    const buttonStyle = [filterStyles.entry];
    if (active) buttonStyle.push(filterStyles.active);
    return (
      <div className={filterStyles.wrap} ref={this.filterWrapRef}>
        <div className={buttonStyle.join(' ')} onClick={() => this.setState({ filterOpen: true })}>
          <Icon name="b4a-browser-filter-icon" width={18} height={18} />
        </div>
        {popover}
      </div>
    );
  }

  renderToolbar() {
    if (subsections[this.props.params.section]) {
      return (
        <Toolbar
          section="Cloud Code"
          subsection={`Jobs > ${subsections[this.props.params.section]}`}
          details={ReleaseInfo({ release: this.props.release })}
        >
          <a className={browserStyles.toolbarButton} style={{ color: 'white', border: 'none', margin: 0, padding: 0 }} onClick={this.onRefresh.bind(this)}>
            <Icon name="b4a-refresh-icon" width={18} height={18} />
          </a>
          {this.props.params.section === 'status' && !this.state.loading ? this.renderJobStatusFilter() : null}
          {this.props.availableJobs && this.props.availableJobs.length > 0 ? (
            <Button color="white" value="Schedule a job" onClick={this.navigateToNew.bind(this)} />
          ) : null}
        </Toolbar>
      );
    }
    return null;
  }
}

export default Jobs;
