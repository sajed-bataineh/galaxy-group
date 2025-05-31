const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    res.render("home/home")
});
router.get('/about', (req, res) => {
    res.render("home/about")
});
router.get('/project', (req, res) => {
    res.render("home/projects")
});
router.get('/showproject', (req, res) => {
    res.render("home/showproject")
});

module.exports = router;