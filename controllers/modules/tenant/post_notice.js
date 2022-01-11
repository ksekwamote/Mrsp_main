const promise_query = require('../utils/promise_connection');
const messenger = require('../utils/messenger');

module.exports = (params) => {

    return new Promise((resolve, reject) => {
        var email = params.email;
        delete params.email;
        if(params.all === 'true'){

            promise_query('select ActiveTenant.ID, Tenant.email_address from ActiveTenant join Tenant on ActiveTenant.TenantID = Tenant.ID where ListingID = ? and ActiveTenant.TenantID != ? ',[params.listing_id, 0])
            .then(result => {

                var notices = [];
                var emails = [];
                result.forEach(id => {
                    notices.push([id.ID, params.message,'false', params.date]);
                    emails.push(id.email_address);
                });

                promise_query('insert into Noticeboard(ActiveTenantID, message, seen, date) values ? ', [notices])
                .then(result => messenger.mail({
                    from: process.env.MAILER_ADDRESS,
                    to:emails,
                    subject:'MRSP - New Notice',
                    text: "New Notice from your Landlord:\n\n\"" + params.message + ".\" .\n\n " + process.env.DOMAIN + "/lease/view_lease?id=" + params.active_tenant_id
                }))
                .then(result => resolve({success: "true"}))
                .catch(error => reject(error));
            })
            .catch(error => reject(error));

        }else{
            promise_query('insert into Noticeboard set ?', {
                ActiveTenantID: params.active_tenant_id,
                message: params.message,
                seen: 'false',
                date: params.date
            })
            .then(result => messenger.mail({
                from: process.env.MAILER_ADDRESS,
                to:email,
                subject:'MRSP - New Notice',
                text: "New Notice from your Landlord:\n\n\"" + params.message + ".\" \n\n " + process.env.DOMAIN + "/lease/view_lease?id=" + params.active_tenant_id
            }))
            .then(result => resolve({success: "true"}))
            .catch(error => reject(error));
        }

    });
};
