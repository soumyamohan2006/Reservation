import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  
})

export const sendMail = ({ to, subject, html }) =>
  transporter.sendMail({ from: `"Hall Booking" <${process.env.EMAIL_USER}>`, to, subject, html })
