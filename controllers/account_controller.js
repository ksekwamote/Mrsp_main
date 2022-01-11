var register = require('./modules/account/register');
var get_profile = require('./modules/account/get_profile');
var update_profile = require('./modules/account/update_profile');

module.exports.register = (req, res, next) => {

    register({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        country: req.body.country,
        town: req.body.town,
        physical_address: req.body.physical_address,
        company_name: req.body.company_name,
        registration_number: req.body.registration_number,
        registered_address: req.body.registered_address,
        company_phone_number: req.body.company_phone_number,
        company_email_address: req.body.company_email_address,
        collection_bank_name: req.body.collection_bank_name,
        collection_account_name: req.body.collection_account_name,
        collection_account_number: req.body.collection_account_number,
        collection_branch_code: req.body.collection_branch_code,
        accounting_email_address: req.body.accounting_email_address,
        accounting_password: req.body.accounting_password,
        confirm_accounting_password: req.body.confirm_accounting_password,
        maintenance_email_address: req.body.maintenance_email_address,
        maintenance_password: req.body.maintenance_password,
        confirm_maintenance_password: req.body.confirm_maintenance_password,
        management_email_address: req.body.management_email_address,
        management_password: req.body.management_password,
        confirm_management_password: req.body.confirm_management_password,
        secondary_email_address: req.body.secondary_email_address,
        secondary_password: req.body.secondary_password,
        confirm_secondary_password: req.body.confirm_secondary_password,
        email_address: req.body.email_address,
        password: req.body.password,
        confirm_password: req.body.confirm_password,
        activation_key: req.body.activation_key

    })
    .then(user  => {
        req.login(user, (error) => {

            if(error){
                console.log(error);
            }
            return res.redirect('/listings');
        });
    })
    .catch(err => res.render('signup', err));

};

module.exports.get_profile = (req, res, next) => {
    get_profile({ID: req.session.passport.user})
    .then(profile => {
      profile.profile['role'] = req.session.role;
      console.log(profile);
      res.render('profile', profile);
    })
    .catch(error => res.render('profile', error));
};

module.exports.update_profile = (req, res, next) => {

    update_profile({
        ID: req.session.passport.user,
        email_address: req.body.email_address,
        primary_phone_number :req.body.primary_phone_number,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        country: req.body.country,
        town: req.body.town,
        physical_address: req.body.physical_address,
        company_name: req.body.company_name,
        registration_number: req.body.registration_number,
        registered_address: req.body.registered_address,
        company_phone_number: req.body.company_phone_number,
        calendar_booking_address: req.body.calendar_booking_address,
        collection_bank_name: req.body.collection_bank_name,
        collection_account_name: req.body.collection_account_name,
        collection_account_number: req.body.collection_account_number,
        collection_branch_code: req.body.collection_branch_code,
        old_password: req.body.old_password,
        new_password: req.body.new_password,
        confirm_password: req.body.confirm_password,

        accounting_email_address: req.body.accounting_email_address,
        old_accounting_password: req.body.old_accounting_password,
        new_accounting_password: req.body.new_accounting_password,
        confirm_accounting_password: req.body.confirm_accounting_password,

        maintenance_email_address: req.body.maintenance_email_address,
        old_maintenance_password: req.body.old_maintenance_password,
        new_maintenance_password: req.body.new_maintenance_password,
        confirm_maintenance_password: req.body.confirm_maintenance_password,

        management_email_address: req.body.management_email_address,
        old_management_password: req.body.old_management_password,
        new_management_password: req.body.new_management_password,
        confirm_management_password: req.body.confirm_management_password,

        secondary_email_address: req.body.secondary_email_address,
        old_secondary_password: req.body.old_secondary_password,
        new_secondary_password: req.body.new_secondary_password,
        confirm_secondary_password: req.body.confirm_secondary_password,


    })
    .then(result => res.redirect('/listings'))
    .catch(error => res.render('profile', error));
};
