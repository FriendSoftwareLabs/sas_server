const Connection = require('./connection.js');
// const { inherits } = require('util');
const { promiseCallback } = require('./helper');

class PoolConnection extends Connection {
	constructor(_connection) {
		super(null, _connection);
		this.connection = _connection;
		// Connection.call(this, null, _connection);
	}
	release(...args) {
		return promiseCallback.apply(this.connection, ['release', args]);
	}
	destroy(...args) {
		return promiseCallback.apply(this.connection, ['destroy', args]);
	}
}

// inherits(PoolConnection, Connection);
module.exports = PoolConnection;