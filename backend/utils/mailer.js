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

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer: Connection failed!', error.message)
  } else {
    console.log('✅ Nodemailer: Connection successful! Ready to send emails.')
  }
})

export const sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Campus Hall Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`📧 Email sent to ${to}: ${info.messageId}`)
    return info
  } catch (err) {
    console.error(`❌ Email failed for ${to}:`, err.message)
    throw err
  }
}
