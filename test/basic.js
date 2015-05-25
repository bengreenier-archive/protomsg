/// <reference path="../typings/mocha/mocha.d.ts"/>

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var protoparse = require('../index');

describe("protoparse", function () {
	it("should emit events on server", function (done) {
		var e = new EventEmitter();
		e.write = function(d) {
			e.emit("data", d);
		};
		
		var parse = protoparse(e);
		parse.on("message:test", function (data, seq) {
			assert(data === "mine", "data should be 'mine'");
			assert(seq === 1, "seq should be 1");
			done();
		});
		
		e.write(JSON.stringify({id:"test", data:"mine", seq: 1}));
	});
	
	it("should emit events on client", function (done) {
		var e = {};
		e.send = function(d) {
			e.onmessage({data: d});
		};
		
		var parse = protoparse(e);
		parse.on("message:test", function (data, seq) {
			assert(data === "mine", "data should be 'mine'");
			assert(seq === 1, "seq should be 1");
			done();
		});
		
		e.send(JSON.stringify({id:"test", data:"mine", seq: 1}));
	});
	
	it("should emit malformed events", function (done) {
		var e = new EventEmitter();
		e.write = function(d) {
			e.emit("data", d);
		};
		
		var callbackCount = 0;
		
		var parse = protoparse(e);
		parse.once("malformed", function (d) {
			assert(d.notJson === true, "d.notJson should be true");
			callbackCount++;
		});
		
		e.write({notJson: true});
		
		parse.once("malformed", function (d) {
			assert(d === JSON.stringify({id:"custom", data: "cstm"}), "d didn't match");
			callbackCount++;
		});
		
		e.write(JSON.stringify({id:"custom", data: "cstm"}));
		
		parse.once("malformed", function (d) {
			assert(d === JSON.stringify({seq:1, data: "cstm"}), "d didn't match");
			callbackCount++;
		});
		
		e.write(JSON.stringify({seq:1, data: "cstm"}));
		
		parse.once("malformed", function (d) {
			assert(d === JSON.stringify({id:"custom", seq: 1}), "d didn't match");
			callbackCount++;
			
			assert(callbackCount === 4, "all callbacks didn't run");
			done();
		});
		
		e.write(JSON.stringify({id:"custom", seq: 1}));
	});
	
	it("should fail if it type is not object", function () {
		assert.throws(function () {
			protoparse(1);
		}, function (err) {
			if ((err instanceof Error) && /should be an Object/.test(err)) {
				return true;
			}
		}, "parsing 1 should throw");
		assert.throws(function () {
			protoparse(true);
		}, function (err) {
			if ((err instanceof Error) && /should be an Object/.test(err)) {
				return true;
			}
		}, "parsing true should throw");
		assert.throws(function () {
			protoparse("hi");
		}, function (err) {
			if ((err instanceof Error) && /should be an Object/.test(err)) {
				return true;
			}
		}, "parsing 'hi' should throw");
	});
	
	it("should fail if it can't identify type", function () {
		var empty = {};
		
		assert.throws(function () {
			protoparse(empty);
		}, function (err) {
			if ((err instanceof Error) && /unable to determine/.test(err)) {
				return true;
			}
		}, "parsing empty should throw");
	});
});