const promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        console.log(params);
        var sql = params.which === 'rental_preset' ? 'update Listing set RentalPresetID = ? where ID = ?' : 'update Listing set ScreeningPresetID = ? where ID = ?';

        promise_query(sql, [params.preset_id, params.listing_id])
        .then(result => {

            console.log('result: '+result);
            resolve();

        })
        .catch(error => {

            console.log('error:'+error);
            reject(error);
        });

    });
};
