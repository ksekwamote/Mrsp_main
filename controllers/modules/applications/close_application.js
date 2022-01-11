const promise_query = require('../utils/promise_connection');
const messenger = require('../utils/messenger');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        promise_query('update RentalApplication set status = ? where ID = ?', [2, params.application_id])
        .then(result => messenger.mail({
            from: process.env.MAILER_ADDRESS,
            to:params.email,
            subject:'MRSP - Application Unsuccessful',
            text: 'Your application for ' + params.listing + ' was unsuccessful. \n\n https://preview.mrsp.online/application/view_application?id=' + params.application_id
        }))
        .then(result => resolve({url: '/applications/'}))
        .catch(error => reject(error));
    });
};
