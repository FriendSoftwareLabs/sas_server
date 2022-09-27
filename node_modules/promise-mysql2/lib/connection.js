const mysql = require('mysql');
const {
	promiseCallback
} = require('./helper');

class Connection {
	constructor(config, _connection) {
		const connect = (resolve, reject) => {
			if (_connection) {
				this.connection = _connection;
				resolve();
			} else {
				this.connection = mysql.createConnection(this.config);
				this.connection.connect((err) => {
					if (err) {
						this.connection.err = err;
						if (typeof reject === 'function') {
							return reject(err);
						}
						setTimeout(() => {
							connect();
						}, 2000);
						// return;
					} else {
						delete this.connection.err;
						if (typeof resolve === 'function') {
							return resolve();
						}
					}
				});
				this.connection.on('error', (err) => {
					console.log('db error', err);
					this.connection.err = err;
					if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						connect();
					}
				});
			}
		};
		this.config = config;
		return new Promise(((resolve, reject) => {
			connect(() => resolve(this), err => reject(err));
		}));
	}
	query(...args) { return promiseCallback.apply(this.connection, ['query', args]); }
	beginTransaction(...args) { return promiseCallback.apply(this.connection, ['beginTransaction', args]); }
	commit(...args) { return promiseCallback.apply(this.connection, ['commit', args]); }
	rollback(...args) { return promiseCallback.apply(this.connection, ['rollback', args]); }
	changeUser(...args) { return promiseCallback.apply(this.connection, ['changeUser', args]); }
	ping(...args) { return promiseCallback.apply(this.connection, ['ping', args]); }
	statistics(...args) { return promiseCallback.apply(this.connection, ['statistics', args]); }
	end(...args) { return promiseCallback.apply(this.connection, ['end', args]); }
	destroy() { this.connection.destroy(); }
	pause() { this.connection.pause(); }
	resume() { this.connection.resume(); }
	escape(value) { return this.connection.escape(value); }
	escapeId(value) { return this.connection.escapeId(value); }
	format(sql, values) { return this.connection.format(sql, values); }
}


module.exports = Connection;