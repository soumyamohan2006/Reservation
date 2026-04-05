import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('Missing SENDGRID_API_KEY in environment.')
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER
const toEmail = process.env.SENDGRID_TEST_TO || fromEmail

if (!fromEmail) {
  throw new Error('Missing SENDGRID_FROM_EMAIL in environment.')
}

console.log('Testing SendGrid email with sender:', fromEmail)
console.log('Testing SendGrid email to:', toEmail)

sgMail.send({
  to: toEmail,
  from: {
    email: fromEmail,
    name: process.env.SENDGRID_FROM_NAME || 'Hall Booking',
  },
  subject: 'Test Email - SendGrid Setup',
  html: '<h2>Email Configuration Test</h2><p>If you receive this, your SendGrid setup is working.</p>',
})
  .then(([response]) => console.log(`Email sent successfully with status ${response.statusCode}`))
  .catch((err) => {
    const details = err.response?.body?.errors?.map((item) => item.message).join('; ') || err.message
    console.error('Email failed:', details)
  })
