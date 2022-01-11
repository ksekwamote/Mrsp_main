const promise_query = require('../utils/promise_connection');
const prorata_calculator = require('../utils/prorata_calculator');
const shortid = require('shortid');
const messenger = require('../utils/messenger');

module.exports = (params) => {
    var cache = {};

    return new Promise((resolve, reject) => {
        promise_query('select * from RentalPreset where ID = ?', [params.rental_preset_id])
        .then((rental_preset) => {
            var rp = rental_preset[0];
            delete rp['ID'];

            rp['monthly_rent'] = parseFloat(params.monthly_rent);
            rp['security_deposit'] = parseFloat(params.security_deposit);
            rp['name'] = 'active - '+ params.tenant_name;
            cache['rental_preset'] = rp;

            return promise_query("INSERT into RentalPreset set ?", rp);
        })
        .then((res_rental_preset) => {

            cache.rental_preset['ID'] = res_rental_preset.insertId;

            return promise_query('insert into ActiveTenant set ? ', {
                TenantID: params.tenant_id,
                ListingID: params.listing_id,
                RentalPresetID: cache.rental_preset.ID,
                move_in_date: params.start_date,
                tenancy_period: params.tenancy_period,
                rental_code: shortid.generate()
            });
        })
        .then((res_active_tenant) => {
            cache['active_tenant_id'] = res_active_tenant.insertId;
            var prorated_rent;

            var prorated_monthly = prorata_calculator.monthly({
                move_in: params.start_date,
                monthly_rent: cache.rental_preset.monthly_rent,
                billing_cycle: cache.rental_preset.due_day
            });
            var prorated_yearly = prorata_calculator.yearly({
                move_in: params.start_date,
                monthly_rent: cache.rental_preset.monthly_rent,
                billing_cycle: cache.rental_preset.due_day
            });
            if(cache.rental_preset.pro_rate_method === 'm') prorated_rent = prorated_monthly;

            if(cache.rental_preset.pro_rate_method === 'y') prorated_rent = prorated_yearly;

            if(cache.rental_preset.pro_rate_method === 'h') prorated_rent = prorated_yearly > prorated_monthly ? prorated_yearly: prorated_monthly;

            if(cache.rental_preset.pro_rate_method === 'l') prorated_rent = prorated_yearly < prorated_monthly ? prorated_yearly: prorated_monthly;

            //// QUESTION: are the prorated rent and security deposit due on the same day? if so which one: start_date or prorated_rent.billing_date
            var d = Date.parse(prorated_rent.billing_date);
            var payments = [
                [cache.active_tenant_id, 'Security Deposit', 'due', cache.rental_preset.security_deposit, params.start_date],
                [cache.active_tenant_id, 'Rent - ' + prorated_rent.billing_date, 'due', prorated_rent.rent, params.start_date]
            ];
            //notify activetenant of acceptance via SMS/Email.
            return promise_query('insert into Payment(ActiveTenantID, description, status, amount, due_date) values ?', [payments]);

        })
        .then(result => promise_query('update RentalApplication set status = ? where ID = ?', [1, params.application_id]))
        .then(result => messenger.mail({
            from: process.env.MAILER_ADDRESS,
            to:params.email,
            subject:'MRSP - Application Successful',
            text: 'Your application for ' + params.listing + ' was successful. Log into your Portal to view your Lease.\n\n '+process.env.TENANT_DOMAIN+'/lease/view_lease?id=' + cache.active_tenant_id
        }))
        .then(result => resolve({url: '/tenants/view_tenant?id=' + cache.active_tenant_id}))
        .catch(error => reject(error));
    });

};
