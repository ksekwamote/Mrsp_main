const promise_query = require('../utils/promise_connection');
const messenger = require('../utils/messenger');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        var email = params.email;
        delete params.email;
        promise_query('insert into Payment set ?', params)
        .then(result => messenger.mail({
            from: process.env.MAILER_ADDRESS,
            to:email,
            subject:'MRSP - New Invoice',
            text: 'You have been invoiced P ' + params.amount + " for \"" + params.description + "\". Payment due - "+params.due_date+". Log into your Portal to view your billing.\n\n"+process.env.DOMAIN+"/lease/view_lease?id="+params.ActiveTenantID
        }))
        .then(result => resolve({url: '/tenants/view_tenant?id=' + params.ActiveTenantID}))
        .catch(error => reject(error));
    });
};
