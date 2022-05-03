const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//setting up the client for billing
const client = require("@sendgrid/client");
client.setApiKey(process.env.SENDGRID_API_KEY);

// const headers = {
//   "on-behalf-of": "sycamon.bw",
// };
// const data = {
//   domain: "mtnmail.mtn.co.bw",
//   subdomain: "poso.mtn.co.bw",
//   username: "billing@sycamon.bw",
//   ips: ["196.61.210.161"],
//   custom_spf: true,
//   default: true,
//   automatic_security: false,
// };

// const request = {
//   url: `/v3/whitelabel/domains`,
//   method: "POST",
//   headers: headers,
//   body: data,
// };

// client
//   .request(request)
//   .then(([response, body]) => {
//     console.log(response.statusCode);
//     console.log(response.body);
//   })
//   .catch((error) => {
//     console.error(error);
//   });

// module.exports.authenticateMail = () => {
//   client
//     .request(request)
//     .then(([response, body]) => {
//       console.log("LOGGING THE RESPONSE CODE", response.statusCode);
//       console.log(response.body);
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// };

// module.exports.mail = (mail_options) => {
//   return new Promise((resolve, reject) => {
//     var transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.MAILER_ADDRESS,
//         pass: process.env.MAILER_PASSWORD,
//       },
//     });

//     transporter.sendMail(mail_options, function (error, info) {
//       if (error) {
//         return reject({ message: "sending failed: " + error.message });
//       } else {
//         return resolve();
//       }
//     });
//   });
// };
