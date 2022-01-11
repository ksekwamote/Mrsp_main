const query = require('../utils/promise_connection');
const handle = require('../utils/handle');
const mailer = require('../utils/messenger');

module.exports = async(params) => {

  var [update, error] = await handle(query('update ServiceRequest set assigned_respondent = ?, respondent_contact = ?, status = ?, date_assigned = ? where ID = ?', [params.assigned_respondent, params.respondent_contact, 'assigned',params.date,params.service_request_id]));

  handle.throw(error);

  mailer.send({
    from: process.env.MAILER_ADDRESS,
    to: params.email_address,
    subject: '[ASSIGNED] - Service Request #'+params.service_request_id,
    text: 'Your service request has been assigned to ' + params.assigned_respondent + '. Their contact is the followng: ' + params.respondent_contact
  })

  return {success:'true'};
};
