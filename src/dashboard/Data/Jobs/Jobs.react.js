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
import B4aModal from 'components/B4aModal/B4aModal.react';
import EditScheduledJobModal from 'dashboard/Data/Jobs/EditScheduledJobModal.react';
import FormNote from 'components/FormNote/FormNote.react';
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
  scheduled: 'Scheduled Jobs',
  'scheduled-jobs': 'Scheduled Jobs',
  status: 'Job Status',
};

const statusColors = {
  succeeded: 'green',
  failed: 'red',
  running: 'blue',
};

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatScheduleDate(date) {
  const month = MONTH_ABBREVS[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = (date.getUTCHours() < 10 ? '0' : '') + date.getUTCHours();
  const minutes = (date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes();
  return `${month} ${day} at ${hours}:${minutes}`;
}

function scheduleString(data) {
  const runAt = new Date(data.startAfter);
  if (Number.isNaN(runAt.getTime())) {
    return <div style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: '16px' }}>-</div>;
  }

  let schedule = '';
  if (data.repeatMinutes) {
    if (data.repeatMinutes === 1440) {
      schedule += 'Every day, ';
    } else if (data.repeatMinutes > 60) {
      schedule += 'Each day, every ' + ((data.repeatMinutes / 60) | 0) + ' hours, ';
    } else {
      schedule += 'Each day, every ' + data.repeatMinutes + ' minutes, ';
    }
    if (data.timeOfDay) {
      schedule += 'after ' + data.timeOfDay.substr(0, 5) + ', ';
    }
    schedule += 'starting ';
  }
  schedule += formatScheduleDate(runAt);
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
      deleteInProgress: false,
      deleteError: null,
      toEdit: null,
      toCreate: false,
      jobStatus: undefined,
      loading: true,
      // Properties used to control data access
      hasPermission: true,
      errorMessage: '',
      // Job Status section filters (client-side): applied = used in table; draft = selection in popover
      filterStatus: undefined,
      filterJobName: undefined,
      draftFilterStatus: undefined,
      draftFilterJobName: undefined,
      filterOpen: false,
      // Job Status pagination (botão "Carregar mais")
      jobStatusHasMore: true,
      jobStatusLoadingMore: false,
      // Job limit enforcement
      jobLimitReached: false,
      maxJobAmount: undefined,
    };
    this.filterWrapRef = React.createRef();
    this.JOB_STATUS_PAGE_SIZE = 100;
  }

  handleScheduleClick() {
    const { maxJobAmount } = this.state;
    if (maxJobAmount === undefined) {
      // Plan data not yet loaded — proceed and let the backend enforce the limit
      this.setState({ toCreate: true });
      return;
    }
    const currentCount = (this.tableData() || []).length;
    if (currentCount >= maxJobAmount) {
      this.setState({ jobLimitReached: true });
    } else {
      this.setState({ toCreate: true });
    }
  }

  componentWillMount() {
    this.loadData();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.availableJobs) {
      if (nextProps.availableJobs.length > 0) {
        this.action = new SidebarAction(<span><Icon width={16} height={16} name="b4a-add-outline-circle" />Schedule job</span>, this.navigateToNew.bind(this));
      }
    } else {
      this.action = null;
    }

    const sectionChanged = nextProps.params.section !== this.props.params.section;
    const appChanged = nextProps.params.appId !== this.props.params.appId;
    let appStatusChanged = false;

    if (this.props.apps !== nextProps.apps) {
      const updatedCurrentApp = nextProps.apps.find(ap => ap.slug === nextProps.params.appId);
      const prevCurrentApp = this.props.apps.find(ap => ap.slug === this.props.params.appId);
      const updatedStatus = updatedCurrentApp && updatedCurrentApp.serverInfo && updatedCurrentApp.serverInfo.status;
      const prevStatus = prevCurrentApp && prevCurrentApp.serverInfo && prevCurrentApp.serverInfo.status;
      appStatusChanged = updatedStatus !== prevStatus;
    }

    if (!sectionChanged && !appChanged && !appStatusChanged) {
      return;
    }

    this.loadData(nextProps.params.section);
  }

  navigateToNew() {
    this.props.navigate(generatePath(this.context, 'jobs/new'));
  }

  navigateToJob(jobId) {
    this.props.navigate(generatePath(this.context, `jobs/edit/${jobId}`));
  }

  getCurrentSection() {
    return this.props.params.section || 'all';
  }

  isScheduledSection(section) {
    const s = section || this.getCurrentSection();
    return s === 'scheduled' || s === 'scheduled-jobs';
  }

  loadData(section) {
    const currentSection = section || this.getCurrentSection();
    this.setState({
      loading: true,
      errorMessage: '',
      hasPermission: true,
      jobLimitReached: false,
      ...(this.isScheduledSection(currentSection) ? { maxJobAmount: undefined } : {}),
      ...(currentSection === 'status' ? { jobStatus: undefined } : {}),
    });

    if (this.isScheduledSection(currentSection)) {
      this.context.getAppPlanData()
        .then(planData => {
          this.setState({ maxJobAmount: (planData && planData.maxJobAmount) || null });
        })
        .catch(() => {
          this.setState({ maxJobAmount: null });
        });
    }

    this.props.jobs.dispatch(ActionTypes.FETCH, { section: currentSection }).finally(() => {
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
    });
    if (currentSection === 'status') {
      this.context.getJobStatus(0, this.JOB_STATUS_PAGE_SIZE).then(status => {
        this.setState({ jobStatus: status, jobStatusHasMore: status.length === this.JOB_STATUS_PAGE_SIZE });
      }).catch(() => {
        this.setState({ jobStatus: [], jobStatusHasMore: false });
      });
    }
  }

  loadMoreJobStatus() {
    if (this.props.params.section !== 'status' || !this.state.jobStatusHasMore || this.state.jobStatusLoadingMore) {
      return;
    }
    const current = this.state.jobStatus || [];
    if (current.length === 0) {
      return;
    }
    this.setState({ jobStatusLoadingMore: true });
    const skip = current.length;
    this.context.getJobStatus(skip, this.JOB_STATUS_PAGE_SIZE)
      .then(nextPage => {
        this.setState(prev => ({
          jobStatus: [...(prev.jobStatus || []), ...nextPage],
          jobStatusHasMore: nextPage.length === this.JOB_STATUS_PAGE_SIZE,
          jobStatusLoadingMore: false,
        }));
      })
      .catch(() => this.setState({ jobStatusLoadingMore: false }));
  }

  renderSidebar() {
    const current = this.props.params.section || '';
    return (
      <CategoryList
        current={current}
        linkPrefix={'jobs/'}
        categories={[
          { name: 'All Jobs', id: 'all' },
          { name: 'Scheduled Jobs', id: 'scheduled-jobs' },
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
    } else if (this.isScheduledSection()) {
      const openEdit = () => this.setState({ toEdit: data });
      const openDelete = () => this.setState({ toDelete: data, deleteError: null });
      return (
        <tr key={data.objectId}>
          <td style={{ width: '25%', cursor: 'pointer' }} onClick={openEdit}>{data.description}</td>
          <td style={{ width: '25%', cursor: 'pointer' }} onClick={openEdit}>{data.jobName}</td>
          <td style={{ width: '25%', cursor: 'pointer' }} onClick={openEdit}>{scheduleString(data)}</td>
          <td className={styles.buttonCell} style={{ width: '15%', cursor: 'pointer' }} onClick={openEdit}>
            <span onClick={e => e.stopPropagation()}>
              <RunNowButton job={data} width={'100px'} />
            </span>
          </td>
          <td style={{ textAlign: 'center' }}>
            <a style={{ cursor: 'pointer' }} onClick={openDelete}>
              <Icon name="b4a-delete-icon" width={16} height={16} fill="#E85C3E" />
            </a>
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
    } else if (this.isScheduledSection()) {
      return [
        <TableHeader key="name" width={25}>
          Name
        </TableHeader>,
        <TableHeader key="func" width={25}>
          Function
        </TableHeader>,
        <TableHeader key="schedule" width={25}>
          Schedule (UTC)
        </TableHeader>,
        <TableHeader key="actions" width={25}>
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
    if (this.props.params.section === 'status' && this.state.jobStatus && this.state.jobStatus.length > 0) {
      const { jobStatusHasMore, jobStatusLoadingMore } = this.state;
      return (
        <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid rgba(249,249,249,0.06)' }}>
          {jobStatusLoadingMore ? (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Loading more…</span>
          ) : jobStatusHasMore ? (
            <Button
              value="Load more"
              onClick={this.loadMoreJobStatus.bind(this)}
            />
          ) : null}
        </div>
      );
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
    } else if (this.isScheduledSection()) {
      return (
        <EmptyGhostState
          title="Cloud Jobs"
          description="There are no scheduled jobs to show at this time."
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
    const { toDelete, deleteInProgress, deleteError, toEdit, toCreate, jobLimitReached } = this.state;

    if (jobLimitReached) {
      return (
        <B4aModal
          type={B4aModal.Types.INFO}
          title="Job limit reached"
          subtitle="You've reached the maximum number of scheduled jobs allowed on your current plan."
          confirmText="Upgrade plan"
          cancelText="Cancel"
          buttonsInCenter={false}
          onCancel={() => this.setState({ jobLimitReached: false })}
          onConfirm={() => {
            this.props.navigate(generatePath(this.context, 'plan-usage'));
          }}
        >
          <div style={{ padding: '0 1rem 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.5' }}>
            Upgrade your plan to schedule additional background jobs.
          </div>
        </B4aModal>
      );
    }

    if (toCreate) {
      return (
        <EditScheduledJobModal
          job={null}
          context={this.context}
          onCancel={() => this.setState({ toCreate: false })}
          onSuccess={() => {
            this.setState({ toCreate: false });
            this.loadData();
          }}
        />
      );
    }
    if (toEdit) {
      return (
        <EditScheduledJobModal
          job={toEdit}
          context={this.context}
          onCancel={() => this.setState({ toEdit: null })}
          onSuccess={() => {
            this.setState({ toEdit: null });
            this.loadData();
          }}
        />
      );
    }
    if (!toDelete) {
      return null;
    }
    return (
      <B4aModal
        type={B4aModal.Types.DANGER}
        title="Delete scheduled job?"
        subtitle="This action cannot be undone!"
        confirmText={deleteInProgress ? 'Please wait...' : 'Delete'}
        cancelText="Cancel"
        disableConfirm={deleteInProgress}
        disableCancel={deleteInProgress}
        buttonsInCenter={false}
        onCancel={() => this.setState({ toDelete: null, deleteError: null })}
        onConfirm={() => {
          this.setState({ deleteInProgress: true, deleteError: null });
          this.context.deleteScheduledJob(toDelete.objectId)
            .then(() => {
              this.setState({ toDelete: null, deleteInProgress: false, deleteError: null });
              this.loadData();
            })
            .catch(err => {
              this.setState({
                deleteInProgress: false,
                deleteError: (err && err.error) || 'Failed to delete job. Please try again.',
              });
            });
        }}
      >
        {deleteError ? (
          <FormNote show={true} color="red">{deleteError}</FormNote>
        ) : null}
      </B4aModal>
    );
  }

  tableData() {
    // Return a empty array if user don't have permission to read scheduled jobs
    if (!this.state.hasPermission) {return []}
    const currentSection = this.getCurrentSection();
    const jobsState = this.props.jobs.data;
    if (jobsState) {
      const fetchedSection = jobsState.get('section');
      // While loading data for the new section, return undefined so TableView shows
      // the loader instead of the empty state.
      if (fetchedSection && fetchedSection !== currentSection) {
        return undefined;
      }
    }
    let data = undefined;
    if (this.isScheduledSection() || currentSection === 'all') {
      if (jobsState) {
        const jobs = jobsState.get('jobs');
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
    const names = [...new Set(jobStatus.map(job => job.jobName).filter(Boolean))].sort();
    // First option = "all"; key same as value so label shows "Job name" without keyValueMap
    return [{ key: 'Job name', value: 'Job name' }, ...names.map(n => ({ key: n, value: n }))];
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
    this.setState({
      filterOpen: false,
      filterStatus: undefined,
      filterJobName: undefined,
      draftFilterStatus: undefined,
      draftFilterJobName: undefined,
    });
  }

  runJobStatusFilter() {
    this.setState({
      filterStatus: this.state.draftFilterStatus,
      filterJobName: this.state.draftFilterJobName,
      filterOpen: false,
    });
  }

  renderJobStatusFilter() {
    // First option = "all" so dropdown shows default label and can clear independently
    const JOB_STATUS_OPTIONS = ['Status', 'succeeded', 'failed', 'running'];
    const { filterStatus, filterJobName, draftFilterStatus, draftFilterJobName, filterOpen } = this.state;
    const appliedActive = filterStatus || filterJobName;
    const draftActive = draftFilterStatus || draftFilterJobName;
    const mutated = draftFilterStatus !== filterStatus || draftFilterJobName !== filterJobName;
    let popover = null;

    if (filterOpen && this.filterWrapRef.current) {
      const position = Position.inDocument(this.filterWrapRef.current);
      const popoverStyle = [filterStyles.popover];
      if (draftActive) {
        popoverStyle.push(filterStyles.active);
      }
      popover = (
        <Popover fixed={false} position={position}>
          <div className={popoverStyle.join(' ')}>
            <div className={filterStyles.title} onClick={() => this.setState({ filterOpen: false })}>
              <Icon name="b4a-browser-filter-icon" width={18} height={18} />
            </div>
            <div className={filterStyles.body}>
              <div className={filterStyles.row}>
                <ChromeDropdown
                  color={draftActive ? '' : 'purple'}
                  value={draftFilterJobName ?? 'Job name'}
                  options={this.getJobNameOptions()}
                  onChange={jobName => this.setState({ draftFilterJobName: jobName === 'Job name' ? undefined : jobName })}
                  width={200}
                />
                <ChromeDropdown
                  color={draftActive ? '' : 'purple'}
                  value={draftFilterStatus || 'Status'}
                  options={JOB_STATUS_OPTIONS}
                  onChange={status => this.setState({ draftFilterStatus: status === 'Status' ? undefined : status })}
                />
              </div>
              <div className={filterStyles.footer}>
                <Button
                  color="white"
                  value="Clear all"
                  disabled={!draftActive}
                  dark={true}
                  onClick={this.clearJobStatusFilter.bind(this)}
                />
                <Button
                  color="green"
                  primary={true}
                  value="Run query"
                  disabled={!mutated}
                  onClick={this.runJobStatusFilter.bind(this)}
                />
              </div>
            </div>
          </div>
        </Popover>
      );
    }

    const buttonStyle = [filterStyles.entry];
    if (appliedActive) {
      buttonStyle.push(filterStyles.active);
    }
    return (
      <div className={filterStyles.wrap} ref={this.filterWrapRef}>
        <div
          className={buttonStyle.join(' ')}
          onClick={() => this.setState({
            filterOpen: true,
            draftFilterStatus: this.state.filterStatus,
            draftFilterJobName: this.state.filterJobName,
          })}
        >
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
          {this.props.params.section === 'status' ? this.renderJobStatusFilter() : null}
          <a className={browserStyles.toolbarButton} style={{ color: 'white', border: 'none', margin: 0, padding: 0 }} onClick={this.onRefresh.bind(this)}>
            <Icon name="b4a-refresh-icon" width={18} height={18} />
          </a>
          {this.isScheduledSection() ? (
            <Button
              primary={true}
              value={
                <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" />Schedule a job</span>
              }
              color="green"
              width="auto"
              additionalStyles={{ marginLeft: '1rem', padding: '0 0.5rem', fontSize: '12px', position: 'relative' }}
              onClick={this.handleScheduleClick.bind(this)}
            />
          ) : (this.props.availableJobs && this.props.availableJobs.length > 0 ? (
            <Button
              primary={true}
              value={
                <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icon width={16} height={16} name="b4a-add-outline-circle" fill="#f9f9f9" />Schedule a job</span>
              }
              color="green"
              width="auto"
              additionalStyles={{ marginLeft: '1rem', padding: '0 0.5rem', fontSize: '12px', position: 'relative' }}
              onClick={this.navigateToNew.bind(this)}
            />
          ) : null)}
        </Toolbar>
      );
    }
    return null;
  }
}

export default Jobs;
