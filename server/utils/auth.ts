import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { APIError } from 'better-auth/api'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const ALLOWED_DOMAINS = ['thewarrencenter.org']
const ALLOWED_EMAILS = ['reachtusharwani@gmail.com', 'tmw220003@utdallas.edu']

export function isEmailAllowed(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ALLOWED_DOMAINS.includes(domain) || ALLOWED_EMAILS.includes(email.toLowerCase())
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type: _type }) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'OTP for TWC Inventory',
          html: `Your OTP is: ${otp}`,
        })
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { status: true },
          })
          if (user?.status === 'inactive') {
            throw new APIError('FORBIDDEN', {
              message: 'Your account has been deactivated. Contact an administrator.',
            })
          }
        },
      },
    },
  },
})
