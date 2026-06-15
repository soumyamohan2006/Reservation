import sgMail from '@sendgrid/mail'

const sendGridApiKey = process.env.SENDGRID_API_KEY
const defaultFromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER
const defaultFromName = process.env.SENDGRID_FROM_NAME || 'Campus Hall Booking'

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey)
  console.log('SendGrid mailer initialized.')
} else {
  console.error('SendGrid mailer is not configured. Missing SENDGRID_API_KEY.')
}

export const sendMail = async ({ to, subject, html, text, from }) => {
  if (!sendGridApiKey) {
    throw new Error('Missing SENDGRID_API_KEY.')
  }

  if (!defaultFromEmail && !from) {
    throw new Error('Missing SENDGRID_FROM_EMAIL.')
  }

  try {
    const [response] = await sgMail.send({
      to,
      subject,
      html,
      text,
      from: from || {
        email: defaultFromEmail,
        name: defaultFromName,
      },
    })

    console.log(`Email sent to ${to} with status ${response.statusCode}`)
    return response
  } catch (err) {
    const details = err.response?.body?.errors?.map((item) => item.message).join('; ') || err.message
    console.error(`Email failed for ${to}:`, details)
    throw new Error(details)
  }
}
