const mysql = require('mysql');
const PoolConnection = require('./poolConnection.js');
const { promiseCallback } = require('./helper');

class Pool {
	constructor(config) {
		this.pool = mysql.createPool(config);
		// const { promisify } = require('util');
		// this.query = promisify(this.pool.query).bind(this.pool);
	}
	getConnection(...args) {
		return promiseCallback.apply(this.pool, ['getConnection', args])
			.then(([con]) => new PoolConnection(con));
	}
	releaseConnection(connection) {
		// Use the underlying connection from the mysql-module here:
		return this.pool.releaseConnection(connection.connection);
	}
	query(...args) { return promiseCallback.apply(this.pool, ['query', args]); }
	end(...args) { return promiseCallback.apply(this.pool, ['end', args]); }
	release(...args) { return promiseCallback.apply(this.pool, ['release', args]); }
	escape(value) { return this.pool.escape(value); }
	escapeId(value) { return this.pool.escapeId(value); }
	on(event, fn) { return this.pool.on(event, fn); }
}

module.exports = Pool;