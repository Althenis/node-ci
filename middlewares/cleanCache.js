const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
    // wait for the routehandler to do its job
    await next();

    clearHash(req.user.id);
}