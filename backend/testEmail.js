import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

console.log('Testing email with:', process.env.EMAIL_USER)

transporter.sendMail({
  from: `"Hall Booking" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  subject: 'Test Email - Custodian Setup',
  html: '<h2>Email Configuration Test</h2><p>If you receive this, your email setup is working!</p>',
})
.then(() => console.log('✓ Email sent successfully!'))
.catch(err => console.error('✗ Email failed:', err.message))
