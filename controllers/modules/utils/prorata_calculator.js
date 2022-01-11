const datefns = require('date-fns');

module.exports.monthly = (params) => {
    var move_in_date_arr = params.move_in.includes('/') ? params.move_in.split('/') : params.move_in.split('-');
    var move_in_date = new Date(parseInt(move_in_date_arr[0]), parseInt(move_in_date_arr[1]) - 1, parseInt(move_in_date_arr[2]), 23, 0);
    var billing_date = new Date(move_in_date.getFullYear(), move_in_date.getMonth(), params.billing_cycle, 0, 0);

    if(billing_date.getDate() <= move_in_date.getDate()){
        billing_date.setMonth(billing_date.getMonth() + 1);
    }

    var billable_days = datefns.differenceInCalendarDays( billing_date, move_in_date) + 1;
    var days_in_month = datefns.getDaysInMonth(move_in_date);
    var final_rent = (params.monthly_rent / days_in_month) * billable_days;
    var rent = parseFloat(final_rent.toFixed(2));


    return {
        rent: rent,
        billing_date: billing_date.toDateString()
    };
};

module.exports.yearly = (params) => {

    var move_in_date_arr = params.move_in.includes('/') ? params.move_in.split('/') : params.move_in.split('-');
    var move_in_date = new Date(parseInt(move_in_date_arr[0]), parseInt(move_in_date_arr[1]) - 1, parseInt(move_in_date_arr[2]), 23, 0);
    var billing_date = new Date(move_in_date.getFullYear(), move_in_date.getMonth(), params.billing_cycle, 0, 0);

    if(billing_date.getDate() <= move_in_date.getDate()){
        billing_date.setMonth(billing_date.getMonth() + 1);
    }

    var year_from_move_in = new Date(move_in_date.getTime());
    year_from_move_in.setYear(year_from_move_in.getFullYear() + 1);

    var days_in_year = datefns.differenceInCalendarDays( year_from_move_in, move_in_date);
    var billable_days = datefns.differenceInCalendarDays( billing_date, move_in_date) + 1;

    var rent = ((params.monthly_rent * 12) / days_in_year) * billable_days;

    return  {rent: parseFloat(rent.toFixed(2)), billing_date: billing_date.toDateString()};
};
