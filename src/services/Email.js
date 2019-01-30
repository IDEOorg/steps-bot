const sendgridClient = require('@sendgrid/mail');

/**
 * This function receives object containing coach and clients data that are
 *  sent to Sendgrid as substitutions.
 *
 * @param {Object} userData - Coach/Client details Object.
 *
 * @returns {void}
 */
const sendCoachEmail = async (userData) => {
  /* eslint-disable */
  const {
    coach_email,
    coach_name,
    client_email,
    client_first_name,
    client_last_name,
    client_phone,
    client_plan_url
  } = userData;
  const message = {
    to: coach_email,
    from: 'support@helloroo.org',
    subject: 'Complete Workplan',
    templateId: '21c099ac-1957-4916-9195-83f9bf16dbe9',
    substitutions: {
      clientFirstname: client_first_name,
      clientLastname: client_last_name,
      clientEmail: client_email,
      clientPhone: client_phone,
      clientPlanUrl: client_plan_url,
      coachFirstName: coach_name
    },
  };

  try {
    await sendEmail(message);
  } catch (error) {
    const message = {
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: `Complete work plan email notification error - ${Date.now()}`,
      templateId: 'd-3c6b31897e0540418d2a202aa396b357',
      substitutions: {
        clientFirstName: client_first_name,
        clientLastName: client_last_name,
        coachEmail: coach_email,
        error: error.response.body.errors[0].message
      }
    }
    await sendgridClient.send(message);
  }
};

/**
 * This function receives clients details and sends email to the Coach once
 * the client requests for help.
 * 
 * @param {Object} userData - userData contains clients details.
 * 
 * @returns {void}
 */
const sendHelpPMEmailToCoach = async (userData) => {
  const {
    clientId,
    clientFirstName,
    clientLastName,
    coachFirstName,
    coachEmail,
    taskTitle,
    url,
    steps,
    helpMessage
  } = userData;

  const message = {
    to: coachEmail,
    from: 'no-reply@helloroo.org',
    subject: 'Client requests assistance',
    templateId: 'aacf9c28-62be-45ed-a055-feb6aaa95d26',
    substitutions: {
      clientId,
      clientFirstName,
      clientLastName,
      coachFirstName,
      coachEmail,
      taskTitle,
      url,
      steps,
      helpMessage
    },
  };

  try {
    await sendEmail(message);
  } catch (error) {
    const message = {
      to: 'supporst@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: `Client request help email notification error - ${Date.now()}`,
      templateId: 'd-3c6b31897e0540418d2a202aa396b357',
      substitutions: {
        clientFirstName,
        clientLastName,
        coachEmail,
        error: error.response.body.errors[0].message
      }
    }
    await sendgridClient.send(message);
  }
};

/**
 * This function receives clients details and sends email to the Project manager
 * once the client completes all the tasks in their work-plan.
 * 
 * @param {Object} userData - userData contains clients details.
 * 
 * @returns {void}
 */
const sendUltimateDoneEmailToPm = async (userData, adminUrl) => {
  const {
    client_email,
    client_first_name,
    client_last_name,
    client_phone,
    client_id
  } = userData;

  const message = {
    to: process.env.PM_EMAIL,
    from: 'no-reply@helloroo.org',
    subject: 'Client requests assistance',
    templateId: 'df900d6b-3c2f-4a0f-ab50-d09868719a02',
    substitutions: {
      clientFirstname: client_first_name,
      clientLastname: client_last_name,
      clientEmail: client_email,
      clientPhone: client_phone,
      clientId: client_id,
      url: adminUrl
    },
  };

  try {
    await sendEmail(message);
  } catch (error) {
    const message = {
      to: 'supporst@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: `Client request help email notification error - ${Date.now()}`,
      templateId: 'd-3c6b31897e0540418d2a202aa396b357',
      substitutions: {
        clientFirstName: client_first_name,
        clientLastName: client_last_name,
        clientEmail: client_email,
        coachEmail: process.env.PM_EMAIL,
        error: error.response
      }
    }
    await sendgridClient.send(message);
  }
};

/**
 * This function is responsible for sending email.
 * 
 * @param {Object} message - Receives message as a parameter and send email using Sendgrid.
 * 
 * @returns {void}
 */
const sendEmail = async (message) => {
  try {
    await sendgridClient.setApiKey(process.env.SENDGRID_API_KEY);
    await sendgridClient.send(message);
  } catch (error) {
    const message = {
      to: 'supporst@helloroo.zendesk.com`',
      from: 'no-reply@helloroo.org',
      subject: `Failure to send Email- ${Date.now()}`,
      templateId: 'd-3c6b31897e0540418d2a202aa396b357',
      substitutions: {
        error: error.response.body.errors[0].message
      }
    }
    await sendgridClient.send(message);
  }
}


exports.sendCoachEmail = sendCoachEmail;
exports.sendHelpPMEmailToCoach = sendHelpPMEmailToCoach;
exports.sendUltimateDoneEmailToPm = sendUltimateDoneEmailToPm;
