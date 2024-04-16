import Swal                 from 'sweetalert2'
import React                from 'react'
import ReactDOMServer       from 'react-dom/server';
import styles               from 'dashboard/B4aAdminPage/B4aAdminPage.scss';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';

// Modal parameters
const modalOptions = {
  confirmButtonText: 'Next &rarr;',
  showCancelButton: true,
  progressSteps: ['1', '2', '3'],
  reverseButtons: true,
  width: '42rem',
  padding: '2.5em'
}

const onKeyUp = (event) => {
  if (event.key === 'Enter') {
    Swal.clickConfirm();
  }
}

const renderUserInputs = () => {
  return ReactDOMServer.renderToStaticMarkup(<div className={styles['elements-wrapper']}>
    <input name='adminUser' id='adminUser' type='text' placeholder='username' autoComplete='off' className={[`swal2-input ${styles['inline-elements']}`].join('')} />
    <input name='adminPass' id='adminPass' type='password' placeholder='password' autoComplete='off' className={[`swal2-input ${styles['inline-elements']}`].join('')} />
  </div>);
}

const renderHostInput = (domain) => {
  return ReactDOMServer.renderToStaticMarkup(<div className={styles['elements-wrapper']}>
    <input name='adminHost' id='adminHost' type='text' placeholder='Admin Host' autoComplete='off' className={[`swal2-input ${styles['inline-elements']}`].join('')} />
    <span className={styles['inline-elements']}>{domain}</span>
  </div>);
}

const renderConfirmStep = () => {
  return ReactDOMServer.renderToStaticMarkup(<div className={`${styles['elements-wrapper']} ${styles['congrats-box']}`}>
    <p className={styles['congrats-message']}>Congratulations, your Admin App is active!</p>
    <a className={styles['anchor-url']} target='_blank'></a>
  </div>);
}

const show = async ({domain, setState, createAdmin, createAdminHost, isRoleCreated, createTextIndexes }) => {
  let adminURL = ''

  const steps = await Swal.mixin(modalOptions).queue([
    {
      title: 'Create an Admin User',
      html: renderUserInputs(setState),
      onBeforeOpen: () => {
        // Attaches keyUp event listener on password input
        document.getElementById('adminPass').addEventListener('keyup', onKeyUp);

        // If there is a admin user, bypass the first step
        isRoleCreated && Swal.clickConfirm()
      },
      preConfirm: async () => {
        try {
          if (!isRoleCreated){
            Swal.showLoading()

            const username = document.getElementById('adminUser').value
            const password = document.getElementById('adminPass').value

            await setState({ username, password })
            await createAdmin()
          }
        } catch(err) {
          Swal.showValidationMessage(
            `Request failed: ${err}`
          )
        }
      }
    },
    {
      title: 'Choose your Admin App subdomain',
      text: '',
      html: renderHostInput(domain, setState),
      onBeforeOpen: () => {
        // Attaches keyUp event listener on admin host input
        document.getElementById('adminHost').addEventListener('keyup', onKeyUp);
      },
      preConfirm: async () => {
        try {
          Swal.showLoading()

          const host = document.getElementById('adminHost').value
          if (!host) throw new Error("Missing admin host")
          await setState({host: host.toLowerCase()})
          adminURL = await createAdminHost()
          await setState({ adminURL })
        } catch(err) {
          Swal.showValidationMessage(
            `Request failed: ${err}`
          )
        }
      }
    },
    {
      type: 'success',
      html: renderConfirmStep(),
      showCancelButton: false,
      confirmButtonText: 'Got it!',
      onBeforeOpen: () => {
        const a = Swal.getContent().querySelector('a')
        if (a) a.href = a.text = adminURL
        // if (typeof back4AppNavigation !== 'undefined' && typeof back4AppNavigation.onCreateAdminHostEvent === 'function')
        //   back4AppNavigation.onCreateAdminHostEvent()
        amplitudeLogEvent('Create Admin Host')

        // Dispatches the request to the back-end in order to create the text indexes
        // and enable the full-text search
        createTextIndexes()
      }
    }
  ])

  return steps.value && steps.value[0] && steps.value[1] && steps.value[2]
}

const B4aAdminModal = { show }

export default B4aAdminModal
