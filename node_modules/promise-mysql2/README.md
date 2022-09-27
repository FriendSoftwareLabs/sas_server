Promise-mysql2
==================
[![Build Status](https://travis-ci.org/lukeb-uk/node-promise-mysql.svg?style=flat&branch=master)](https://travis-ci.org/lukeb-uk/node-promise-mysql?branch=master)

Promise-mysql2 is a wrapper for [mysqljs/mysql](https://github.com/mysqljs/mysql) that wraps function calls with  promises.

node >= 8.0

To install promise-mysql, use [npm](http://github.com/isaacs/npm):

```bash
$ npm install promise-mysql2
```

Please refer to [mysqljs/mysql](https://github.com/mysqljs/mysql) for documentation on how to use the mysql functions.

At the minute only the standard connection (using `.createConnection()`) and the pool (using `.createPool()`) is supported. `createPoolCluster` is not implemented yet.

## Examples

### Connection

**Important note: don't forget to call connection.end() when you're finished otherwise the Node process won't finish**

To connect, you simply call `.createConnection()` like you would on mysqljs/mysql:
```javascript
const mysql = require('promise-mysql2');

mysql.createConnection({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
}).then((conn) => {
    // do stuff with conn
    conn.end();
});
```

To use the promise, you call the methods as you would if you were just using mysqljs/mysql, minus the callback. You then add a .then() with your function in:
```javascript
const mysql = require('promise-mysql2');

mysql.createConnection({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
}).then((conn) => {
	let result = conn.query('select `name` from user');
	conn.end();
	return result;
}).then(([rows, fields]) => {
	// list of user
	console.log(rows);
});
```

You can even chain the promises, using a return within the .then():
```javascript
const mysql = require('promise-mysql2');
let connection;

mysql.createConnection({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
}).then((conn) => {
	connection = conn;
	return connection.query('select `id` from user where `name`="dashabi"');
}).then(([rows, fields]) => {
	// Query the items that dashabi owns.
	let result = connection.query('select * from items where `owner`="' + rows[0].id + '" and `name`="dashabi"');
	connection.end();
	return result;
}).then(([rows, fields]) => {
	// Logs out that dashabi owns
	console.log(rows);
});
```

You can catch errors using the .catch() method. You can still add .then() clauses, they'll just get skipped if there's an error
```javascript
const mysql = require('promise-mysql2');
let connection;

mysql.createConnection({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
}).then((conn) => {
	connection = conn;
	return connection.query('select * from tablethatdoesnotexist');
}).then(() => {
	let result = connection.query('select * from user');
	connection.end();
	return result;
}).catch((error) => {
	if (connection && connection.end) connection.end();
	//logs out the error
	console.log(error);
});

```

To use the async/await, you call the methods as you would if you were just using mysqljs/mysql.
```javascript
const mysql = require('promise-mysql2');
let connection = await mysql.createConnection({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
});
const [rows, fields] = await connection.query('select `id` from user where `name`="dashabi"');
connection.end();
console.log(rows);
```

### Pool

Use pool directly:

```javascript
pool = mysql.createPool({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
  connectionLimit: 10
});

pool.query('select `name` from user').then(([rows, fields]){
    // Logs out a list of user
    console.log(rows);
});

```

Get a connection from the pool:

```javascript
let conn;
pool.getConnection().then((connection) => {
	conn = connection;
	conn.query('select `name` from user').then(...);
	conn.release();
}).catch((err) => {
	conn.release();
	done(err);
});
```

To use the async/await, you call the methods as you would if you were just using mysqljs/mysql.
```javascript
const pool = mysql.createPool({
	host: 'localhost',
	user: 'dashaibi',
	password: 'dashaibi',
	database: 'dashaibi'
  connectionLimit: 10
});

const [rows, fields] = await pool.query('select `name` from user');
console.log(rows);

// get connection from pool
const conn = await pool.getConnection();
const [rows, fields] = await connection.query('select `name` from user');
conn.release();
console.log(rows);
```


## Tests

At the moment only simple basics tests are implemented using Mocha.
To run the tests, you need to connect to a running MySQL server. A database or write permissions are not required.

Start the test suite with

```bash
DB_HOST=localhost DB_USER=user DB_PWD=pwd npm test
```
