var assert = require('assert');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function processData (d) {
	var emitter = this;

	try {
		var message = JSON.parse(d), data, id, seq;
		if (message.data) {
			data = message.data;
		}
		if (message.id) {
			id = message.id;
		}
		if (message.seq) {
			seq = message.seq;
		}
		
		if (!seq || !id || !data) throw new Error("malformed");
		
		emitter.emit("message:"+id, data, seq);
	} catch (e) {
		emitter.emit("malformed", d);
	}
}

function Parse (sockServerOrSockClient) {
	assert(typeof(sockServerOrSockClient) === "object", "sockServerOrSockClient should be an Object");
	
	// pointer to self	
	var self = this;
	
	if (typeof(sockServerOrSockClient.send) !== "undefined") {
		// client
		var prev = function(){};
		
		if (typeof(sockServerOrSockClient.onmessage) !== "undefined") {
			prev = sockServerOrSockClient.onmessage;
		}
		
		sockServerOrSockClient.onmessage = function (e) {
			processData.call(self, [e.data]);
		};
		
	} else if (typeof(sockServerOrSockClient.write) !== "undefined") {
		// server
		sockServerOrSockClient.on('data', processData.bind(self));
	} else {
		assert(false, "sockServerOrSockClient missing method send or write. unable to determine client or server");
	}
}

util.inherits(Parse, EventEmitter);

// export our functionality
module.exports = function (sockServerOrSockClient) {
	return new Parse(sockServerOrSockClient);
};