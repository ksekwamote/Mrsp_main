var promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    console.log(params);
    return new Promise((resolve, reject) => {
        var listing_id = params.ListingID;
        var sql = "update RentalPreset set name = ?, monthly_rent = ?, security_deposit  = ?, escalation_type = ?, escalation_rate = ?, escalation_interval = ?, due_day  = ?, pro_rate_method  = ?, allow_partial_rent  = ?, allow_partial_misc  = ?, charge_late_fee = ?, grace_period  = ?, charge_flat  = ?, charge_daily  = ?, flat_late_fee = ?, daily_rate  = ?, max_cumulative_late_fee  = ?, other_monthly_fees = ? where ID = ?";
        var args = [
            params.name,
            params.monthly_rent,
            params.security_deposit,
            params.escalation_type,
            params.escalation_rate,
            params.escalation_interval,
            params.due_day,
            params.pro_rate_method,
            params.allow_partial_rent,
            params.allow_partial_misc,
            params.charge_late_fee,
            params.grace_period,
            params.charge_flat,
            params.charge_daily,
            params.flat_late_fee,
            params.daily_rate,
            params.max_cumulative_late_fee,
            params.other_monthly_fees,
            params.rental_preset_id
        ];

        if(params.update === 'true'){

            promise_query(sql, args)
             .then((result) => resolve({url: '/listings/view_listing?id='+listing_id}))
             .catch((error) => reject(error));

        }else{
            delete params['update'];
            delete params['rental_preset_id'];
            delete params['ListingID'];

            promise_query('insert into RentalPreset set ?', [params])
            .then(result => resolve({url: '/listings/view_listing?id='+listing_id}))
            .catch(error => reject(error));
        }

    });
};
