import React from 'react'
import ReactDOMServer from 'react-dom/server'
import CategoryList from "components/CategoryList/CategoryList.react";
import DashboardView from 'dashboard/DashboardView.react'
import Toolbar from 'components/Toolbar/Toolbar.react'
import Fieldset from 'components/Fieldset/Fieldset.react';
import styles from 'dashboard/B4aHubPublishPage/B4aHubPublishPage.scss'
import ReactPlayer from 'react-player';
import Label from 'components/Label/Label.react';
import Button from 'components/Button/Button.react';
import Field from 'components/Field/Field.react';
import B4aHubPublishModal from 'dashboard/B4aHubPublishPage/B4aHubPublishModal'
import B4aHubUnpublishModal from 'dashboard/B4aHubPublishPage/B4aHubUnpublishModal'
import Swal from 'sweetalert2'
import LoaderContainer  from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';


class B4aHubPublishPage extends DashboardView {
  static contextType = CurrentApp;
  constructor() {
    super()
    this.section = 'More',
    this.subsection = 'Database HUB'
    this.state = {
      url: undefined
    }
    this.state = {
      loading: true,
      isDatabasePublic: false,
      publicDatabaseURL: undefined
    }
  }

  async componentDidMount() {
    if (!this.context.custom.isDatabasePublic) {
      this.setState({
        loading: false
      })
      return
    }

    const publicDatabase = await this.context.getPublicDatabase()

    this.setState({
      loading: false,
      isDatabasePublic: true,
      publicDatabaseURL: publicDatabase && publicDatabase.author && `https://www.back4app.com/database/${publicDatabase.author.slug}/${publicDatabase.slug}`
    })
  }

  renderSidebar() {
    const { path } = this.props.match;
    const current = path.substr(path.lastIndexOf("/") + 1, path.length - 1);
    return (
      <CategoryList current={current} linkPrefix={''} categories={[
        { name: 'Connections', id: 'connections' },
        { name: 'Publish', id: 'hub-publish' }
      ]} />
    );
  }


  renderContent() {
    return (
      <LoaderContainer className={styles.loading} loading={this.state.loading} hideAnimation={false} solid={true}>
        <div className={styles['hub-publish-page']}>
          <Toolbar section="Publish on Hub" />
          <Fieldset
            legend="Publish on Hub"
            description="Database Hub is the place where the developers can share, connect, and clone datasets and app templates."
          >
            <ReactPlayer
              url="https://www.youtube.com/watch?v=JKuwDLIrJ-0&t=6s"
              controls
              width="650px"
              style={{
                border: "1px solid #000",
                borderRadius: "4px",
                marginBottom: "20"
              }}
            />
            <Field
              height='120px'
              textAlign='center'
              label={<Label text={this.state.isDatabasePublic ? 'This app is public on Database Hub' : 'Publish this app on Database Hub'} description="By publishing this app on Database Hub you make it public available for other developers to clone or connect." />}
              input={<div className={styles['input']}>
                {this.state.isDatabasePublic ? (
                  <Button
                    onClick={() => {
                      if (!this.context.custom.isOwner) {
                        Swal.queue([{
                          type: 'error',
                          html: ReactDOMServer.renderToStaticMarkup(
                            <div className={`${styles['elements-wrapper']} ${styles['congrats-box']}`}>
                              <p className={styles['congrats-message']}>
                                Sorry, you must be the app owner to unpublish it from Database Hub.
                              </p>
                            </div>
                          )
                        }])
                        return;
                      }
                      B4aHubUnpublishModal.show(this.context, () => {
                        this.setState({
                          isDatabasePublic: false,
                          publicDatabaseURL: undefined
                        })
                      })
                    }}
                    value="Unpublish from Hub"
                    color="red"
                    primary={true}
                    className={styles['input-child']}
                  />
                ) : (
                  <Button
                    onClick={() => {
                      if (!this.context.custom.isOwner) {
                        Swal.queue([{
                          type: 'error',
                          html: ReactDOMServer.renderToStaticMarkup(
                            <div className={`${styles['elements-wrapper']} ${styles['congrats-box']}`}>
                              <p className={styles['congrats-message']}>
                                Sorry, you must be the app owner to publish it on Database Hub.
                              </p>
                            </div>
                          )
                        }])
                        return;
                      }
                      if (this.context.custom.isGDPR) {
                        Swal.queue([{
                          type: 'error',
                          html: ReactDOMServer.renderToStaticMarkup(
                            <div className={`${styles['elements-wrapper']} ${styles['congrats-box']}`}>
                              <p className={styles['congrats-message']}>
                                Sorry, you can not publish a GDPR App.
                              </p>
                            </div>
                          )
                        }])
                        return;
                      }
                      B4aHubPublishModal.show(this.context, result => {
                        this.setState({
                          isDatabasePublic: true,
                          publicDatabaseURL: `https://www.back4app.com/database/${result.author.slug}/${result.database.slug}`
                        })
                      })
                    }}
                    value="Publish on Hub"
                    primary={true}
                    className={styles['input-child']}
                  />
                )}
              </div>}
            />
            {this.state.isDatabasePublic && (
              <Field
                height='120px'
                textAlign='center'
                label={<Label text='Hub URL' description='Use this address to access, customize and share your public app.' />}
                input={<div className={styles['input']}>
                  {this.state.publicDatabaseURL ? (
                    <a target='_blank' href={this.state.publicDatabaseURL} className={styles['input-child']}>{this.state.publicDatabaseURL}</a>
                  ) : (
                    <div className={styles['input-child']}>We could not find your Hub URL</div>
                  )}
                </div>}>
              </Field>
            )}
          </Fieldset>
        </div>
      </LoaderContainer>
    )
  }
}

export default B4aHubPublishPage
