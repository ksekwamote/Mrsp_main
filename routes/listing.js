var express = require('express');
var listing_controller = require('../controllers/listing_controller');
var router = express.Router();

router.get('/', listing_controller.load);

router.get('/create', listing_controller.create);

router.post('/create', listing_controller.create_listing);

router.post('/create/generate_upload_signature', listing_controller.generate_upload_signature);

router.post('/create_rental_preset', listing_controller.create_rental_preset);

router.post('/create_screening_preset', listing_controller.create_screening_preset);

router.post('/update_default_preset', listing_controller.update_default_preset);

router.get('/view_listing', listing_controller.view_listing);

router.post('/toggle_listing_visibility', listing_controller.toggle_listing_visibility);

router.post('/delete', listing_controller.delete_listing);

router.get('/edit', listing_controller.edit_listing);

router.post('/toggle_offer_visibility', listing_controller.toggle_offer_visibility);

router.post('/delete_rental_preset', listing_controller.delete_rental_preset);

router.post('/delete_screening_preset', listing_controller.delete_screening_preset);

router.post('/rental_analysis', listing_controller.get_rental_analysis);

router.post('/manage_expenses', listing_controller.manage_expenses);
router.get('/expenses', listing_controller.expenses);

router.post('/update_potential_credit_loss', listing_controller.update_potential_credit_loss);

module.exports = router;
