var promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        var presets =  {};
        promise_query('select * from RentalPreset where LandLordID = ?', [params.landlord_id])
        .then(rental_presets => {
            presets['rental_presets'] = rental_presets;
            return promise_query('select * from ScreeningPreset where LandLordID = ?', [params.landlord_id]);
        })
        .then(screening_presets => {
            presets['screening_presets'] = screening_presets;
            return resolve(presets);
        })
        .catch(error => reject(error));
    });
};
