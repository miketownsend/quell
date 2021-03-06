var assign = require('lodash.assign');
var quell = require('../quell');
var Promise = require('es6-promise').Promise;

var mockConnection = function (test, expectedQuery, expectedData, returnValue) {
	return {
		query: function (query, data, callback) {
			if (expectedQuery !== undefined) {test.strictEqual(query, expectedQuery);}
			if (expectedData !== undefined) {test.deepEqual(data, expectedData);}
			test.ok(true, 'Mysql query was called');
			callback(null, returnValue);
		}
	};
};

exports.update = {
	setUp: function (done) {
		this.backup = assign({}, quell);
		done();
	},

	'using promise': function (test) {
		test.expect(11);

		var Model = quell('users', {
			connection: mockConnection(),
			schema: {
				columns: {
					id: quell.INT(),
					name: quell.VARCHAR()
				},
				primaries: ['id'],
				autoincrement: 'id',
			}
		});

		var model = new Model({id: 5, name: 'john doe'});

		quell._buildUpdateQuery = function (tablename, write, lookup) {
			test.strictEqual(tablename, 'users');
			test.deepEqual(write, {name: 'john doe'}, 'written data');
			test.deepEqual(lookup, {id: 5});
			test.ok(true, 'build ran');
			return {query: "QUERY", data: [22]};
		};

		quell._promiseQueryRun = function (query, data, mysql) {
			test.equal(query, 'QUERY');
			test.deepEqual(data, [22]);
			test.equal(mysql, Model.connection);
			test.ok(true, 'query ran');
			return Promise.resolve({insertId: 5});
		};

		model._promiseValidateSchema = function () {
			test.ok(true, '_promiseValidateSchema ran');
			return Promise.resolve();
		};



		model.update().then(function (result) {
			test.equal(result, model);
			test.ok(true, 'promise resolved');
			test.done();
		}, function (err) {
			console.error(err);
			test.ok(false, 'promise rejected');
			test.done();
		});

	},

	'using callback': function (test) {
		test.expect(12);

		var Model = quell('users', {
			connection: mockConnection(),
			schema: {
				columns: {
					id: quell.INT(),
					name: quell.VARCHAR()
				},
				primaries: ['id'],
				autoincrement: 'id',
			}
		});

		var model = new Model({id: 5, name: 'john doe'});

		quell._buildUpdateQuery = function (tablename, write, lookup) {
			test.strictEqual(tablename, 'users');
			test.deepEqual(write, {name: 'john doe'}, 'written data');
			test.deepEqual(lookup, {id: 5});
			test.ok(true, 'build ran');
			return {query: "QUERY", data: [22]};
		};

		quell._promiseQueryRun = function (query, data, mysql) {
			test.equal(query, 'QUERY');
			test.deepEqual(data, [22]);
			test.equal(mysql, Model.connection);
			test.ok(true, 'query ran');
			return Promise.resolve({insertId: 5});
		};

		model._promiseValidateSchema = function () {
			test.ok(true, '_promiseValidateSchema ran');
			return Promise.resolve();
		};

		model.update(function (err, result) {
			test.equal(err, null);
			test.equal(result, model);
			test.ok(true, 'callback invoked');
			test.done();
		});

	},

	'passes sql error through from _promiseValidateSchema': function (test) {
		test.expect(4);

		var Model = quell('users', {
			connection: mockConnection(),
			schema: {
				columns: {
					id: quell.INT(),
					name: quell.VARCHAR()
				},
				primaries: ['id'],
				autoincrement: 'id',
			}
		});

		var model = new Model({id: 5, name: 'john doe'});
		var mockError = {error: 'THIS IS AN ERROR'};

		quell._buildUpdateQuery = function () {
			test.ok(false, 'build ran');
			return {query: "QUERY", data: [22]};
		};

		quell._promiseQueryRun = function () {
			test.ok(false, 'query ran');
			return Promise.resolve();
		};

		model._promiseValidateSchema = function () {
			test.ok(true, '_promiseValidateSchema ran');
			return Promise.reject(mockError);
		};

		model.update(function (err, result) {
			test.equal(err, mockError);
			test.equal(result, undefined);
			test.ok(true, 'callback invoked');
			test.done();
		});

	},

	'passes sql error through from _promiseQueryRun': function (test) {
		test.expect(8);

		var Model = quell('users', {
			connection: mockConnection(),
			schema: {
				columns: {
					id: quell.INT(),
					name: quell.VARCHAR()
				},
				primaries: ['id'],
				autoincrement: 'id',
			}
		});

		var model = new Model({id: 5, name: 'john doe'});
		var mockError = {error: 'THIS IS AN ERROR'};

		quell._buildUpdateQuery = function (tablename, write, replace) {
			test.ok(true, 'build ran');
			return {query: "QUERY", data: [22]};
		};

		quell._promiseQueryRun = function (query, data, mysql) {
			test.equal(query, 'QUERY');
			test.deepEqual(data, [22]);
			test.equal(mysql, Model.connection);
			test.ok(true, 'query ran');
			return Promise.reject(mockError);
		};

		model._promiseValidateSchema = function () {
			return Promise.resolve();
		};

		model.update(function (err, result) {
			test.equal(err, mockError);
			test.equal(result, undefined);
			test.ok(true, 'callback invoked');
			test.done();
		});

	},

	'missing primary key': function (test) {
		test.expect(3);

		var Model = quell('users', {
			connection: mockConnection(),
			schema: {
				columns: {
					id: quell.INT(),
					name: quell.VARCHAR()
				},
				primaries: ['id']
			}
		});

		var model = new Model({name: 'john doe'});

		quell._buildUpdateQuery = function () {
			test.ok(false, 'build ran');
			return {query: "QUERY", data: [22]};
		};

		quell._promiseQueryRun = function () {
			test.ok(false, 'query ran');
			return Promise.resolve();
		};

		model._promiseValidateSchema = function () {
			test.ok(true, '_promiseValidateSchema ran');
			return Promise.resolve();
		};

		model.update(function (err, result) {
			test.equal(err.message, 'Could not update quell record, required primary key value was absent: id');
			test.ok(true, 'callback invoked');
			test.done();
		});

	},

	'ignores non-schema data and autoincrement fields': function (test) {
		test.expect(13);

		var Model = quell('users', {
			connection: mockConnection(),
			schema: {
				columns: {
					id: quell.INT(),
					name: quell.VARCHAR()
				},
				primaries: ['id'],
				autoincrement: 'id',
			}
		});

		var model = new Model({id: 5, name: 'john doe', city: 'San Diego'});

		quell._buildUpdateQuery = function (tablename, write, lookup) {
			test.strictEqual(tablename, 'users');
			test.deepEqual(write, {name: 'john doe'}, 'written data');
			test.deepEqual(lookup, {id: 5});
			test.ok(true, 'build ran');
			return {query: "QUERY", data: [22]};
		};

		quell._promiseQueryRun = function (query, data, mysql) {
			test.equal(query, 'QUERY');
			test.deepEqual(data, [22]);
			test.equal(mysql, Model.connection);
			test.ok(true, 'query ran');
			return Promise.resolve();
		};

		model._promiseValidateSchema = function () {
			test.ok(true, '_promiseValidateSchema ran');
			return Promise.resolve();
		};

		model.update(function (err, result) {
			test.equal(err, null);
			test.equal(result, model);
			test.equal(result.get('id'), 5);
			test.ok(true, 'callback invoked');
			test.done();
		});

	},



	tearDown: function (done) {
		assign(quell, this.backup);
		done();
	}
};
