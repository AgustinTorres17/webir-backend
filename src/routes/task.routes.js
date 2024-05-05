const { Router } = require('express');

const router = Router();

router.get('/movie:id', (req, res) => {
    res.send('Movie id: ' + req.params.id);
})


module.exports = router;