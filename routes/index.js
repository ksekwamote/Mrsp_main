var express = require('express');
var account_controller = require('../controllers/account_controller');
var router = express.Router();
var passport = require('passport');
var connect = require('connect-ensure-login');
var check_key = require('../controllers/modules/utils/check_key');
const { getInvoiceDate } = require('../controllers/modules/tenant/changeInvoiceDate');
var tenant_controller = require("../controllers/tenant_controller");

/* GET home page. */
router.get('/',check_key, (req, res, next) =>  {
    if(req.session.passport && req.session.passport.user){
        res.redirect('/listings');
    }else{
        res.render('login', {message: req.flash('error')});

    }
});

router.post('/', passport.authenticate('local', {successRedirect:'/listings', failureRedirect: '/' , failureFlash: true}));

router.get('/signup', (req, res, next) => res.render('signup',{message: ''}));

router.post('/signup', account_controller.register);

router.get('/profile', connect.ensureLoggedIn('/'), account_controller.get_profile);

router.post('/profile', connect.ensureLoggedIn('/'), account_controller.update_profile);

router.get('/logout', (req, res, next) => req.session.destroy((err) => res.redirect('/')));

router.get('/invoice' ,tenant_controller.invoice_inspector)


module.exports = router;
