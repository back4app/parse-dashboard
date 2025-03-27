import Swal                 from 'sweetalert2'
import React                from 'react'
import ReactDOMServer       from 'react-dom/server';
import styles               from 'dashboard/B4aAdminPage/B4aAdminPage.scss';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import modalStyles from 'components/B4aModal/B4aModal.scss';
import buttonStyles from 'components/Button/Button.scss';
import baseStyles from 'stylesheets/base.scss';
import TextInput from 'components/TextInput/TextInput.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import withReactContent from 'sweetalert2-react-content';
import swalStyles from 'stylesheets/b4aCustomSweetalert.scss';

// Modal parameters
const modalOptions = {
  confirmButtonText: 'Next &rarr;',
  showCancelButton: true,
  progressSteps: ['1', '2', '3'],
  reverseButtons: true,
  showCloseButton: true,
  width: '37rem',
  padding: '1.5em',
  customClass: {
    header: '',
    title: `${modalStyles.title} ${swalStyles.sweetalertTitle}`,
    htmlContainer: `${swalStyles.sweetalertContainer}`,
    closeButton: swalStyles.sweetalertCloseBtn,
    icon: swalStyles.sweetalertIcon,
    input: swalStyles.sweetalertInput,
    actions: `${swalStyles.sweetalertActions}`,
    confirmButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.primary, buttonStyles.green].join(' '),
    cancelButton: [buttonStyles.button, baseStyles.unselectable, buttonStyles.white, styles.marginRight].join(' '),
  },
  buttonsStyling: false,
};

const onKeyUp = (event) => {
  if (event.key === 'Enter') {
    Swal.clickConfirm();
  }
}

const renderUserInputs = () => {
  return ReactDOMServer.renderToStaticMarkup(<div className={styles['elements-wrapper']}>
    <Field
      label={<Label
        text={'Username'}
        description={<div style={{ textAlign: 'left'}}>Please enter a username that you would like to use to login</div>} />
      }
      input={<TextInput
        padding={'0 1rem'}
        dark={false}
        height={100}
        id="adminUser"
        placeholder='Enter username'
      />}

    />
    <Field
      label={<Label
        text={'Password'}
        description={<div style={{ textAlign: 'left'}}>Please enter a password that you would like to use to login</div>} />
      }
      input={<TextInput
        padding={'0 1rem'}
        dark={false}
        height={100}
        id="adminPass"
        hidden={true}
        placeholder='Enter password'
      />}

    />
  </div>);
}

const renderHostInput = (domain) => {
  return ReactDOMServer.renderToStaticMarkup(<div className={styles['elements-wrapper']}>
    <input name='adminHost' id='adminHost' type='text' placeholder='Admin Host' autoComplete='off' className={styles.adminHostInput} />
    <span className={styles.adminHostText}>{domain}</span>
  </div>);
}

const renderConfirmStep = (adminURL) => {
  return ReactDOMServer.renderToStaticMarkup(<div className={`${styles['elements-wrapper']} ${styles['congrats-box']}`}>
    <p className={styles['congrats-message']}>Congratulations, your Admin App is active!</p>
    <a className={styles.adminURL} target='_blank' rel="noopener noreferrer" href={adminURL}>{adminURL}</a>
  </div>);
}

const show = async ({domain, setState, createAdmin, createAdminHost, isRoleCreated, createTextIndexes }) => {
  let adminURL = ''

  const Queue = withReactContent(Swal.mixin(modalOptions));

  const modal1 = {
    title: 'Create an Admin User',
    html: renderUserInputs(setState),
    willOpen: () => {
      // Attaches keyUp event listener on password input
      document.getElementById('adminPass').addEventListener('keyup', onKeyUp);

      // If there is a admin user, bypass the first step
      isRoleCreated && Swal.clickConfirm()
    },
    preConfirm: async () => {
      try {
        if (!isRoleCreated){
          Swal.showLoading()

          const username = document.getElementById('adminUser').value.trim();
          const password = document.getElementById('adminPass').value.trim();

          if (!username || !password) {
            throw new Error('Please enter username and Password field!')
          }

          await setState({ username, password })
          await createAdmin()
        }
      } catch(err) {
        Swal.showValidationMessage(
          `Request failed: ${err}`
        )
      }
    }
  }

  const modal2 = {
    title: 'Choose your Admin App subdomain',
    text: '',
    html: renderHostInput(domain, setState),
    onBeforeOpen: () => {
      // Attaches keyUp event listener on admin host input
      document.getElementById('adminHost').addEventListener('keyup', onKeyUp);
    },
    preConfirm: async () => {
      try {
        Swal.showLoading();

        const host = document.getElementById('adminHost').value
        if (!host) {throw new Error('Missing admin host')}
        await setState({host: host.toLowerCase()})
        adminURL = await createAdminHost()
        await setState({ adminURL });
        return adminURL;
      } catch(err) {
        Swal.showValidationMessage(
          `Request failed: ${err}`
        )
      }
    }
  }

  const modal3 = {
    type: 'success',
    showCancelButton: false,
    confirmButtonText: 'Got it!',
    willOpen: () => {
      amplitudeLogEvent('Create Admin Host')
      createTextIndexes();
    }
  }

  return (async () => {
    if (!isRoleCreated) {
      const result = await Queue.fire({
        ...modal1,
        currentProgressStep: 0,
      });
      if (result.isDismissed) {
        return <></>
      }
    }
    const result = await Queue.fire({
      ...modal2,
      currentProgressStep: 1,
    });
    if (result.isConfirmed && result.value) {
      await Queue.fire({
        ...modal3,
        html: renderConfirmStep(result.value),
        currentProgressStep: 2,
        confirmButtonText: 'OK',
      });
    }
  })();
}

const B4aAdminModal = { show }

export default B4aAdminModal
