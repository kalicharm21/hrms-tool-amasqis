import nodemailer from "nodemailer";

const mailTransporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "****",
    pass: "****",
  },
});

export default mailTransporter;
