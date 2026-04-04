import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendMail = ({ to, subject, html }) =>
  transporter.sendMail({ from: `"Hall Booking" <${process.env.EMAIL_USER}>`, to, subject, html })
