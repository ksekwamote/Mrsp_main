var express = require('express');
var router = express.Router();
var application_controller = require('../controllers/application_controller');


/* GET home page. */
router.get('/', application_controller.load);

router.get('/view_application', application_controller.view_application);

router.post('/close_application', application_controller.close_application);

module.exports = router;
