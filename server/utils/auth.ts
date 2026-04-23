import "dotenv/config"
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma"
import { emailOTP } from "better-auth/plugins/email-otp"
import nodemailer from "nodemailer"
import { username } from "better-auth/plugins";

/* const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	}
}) */

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: ["http://localhost:3000", "http://localhost:3005"],
	database: prismaAdapter(prisma, {
		provider: "sqlite",
	}),

	plugins:[username()],
	emailAndPassword: {
        enabled: true,
    },
	user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user"
            }
        }
    },
	  session: {

    }

	/* plugins: [
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				await transporter.sendMail({
					from: process.env.EMAIL_USER,
					to: email,
					subject: "OTP",
					html: `${otp}`,
				})
			}
		})
	] */
});
