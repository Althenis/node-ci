const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
    // this equals to Query instance
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');
    // returning this makes the function chainable .find().cache().limit(10).sort()
    return this;
}

mongoose.Query.prototype.exec = async function() {

    // When cache is not enabled, return immediately with the exec
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    const cacheValue = await client.hget(this.hashKey, key);

    if (cacheValue) {

        // this.model references the model this query is attached to
        /* This is equivalent to:
        new Blog({
            title: 'Hi',
            content: 'There'
        });
        */
       const doc = JSON.parse(cacheValue);

       return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc); 
    }

    const result = await exec.apply(this, arguments);

    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

    return result;
}

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
};