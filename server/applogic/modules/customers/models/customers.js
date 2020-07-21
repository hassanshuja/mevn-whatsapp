"use strict";

// let ROOT 			= "../../../../";
let config    		= require("../../../../config");
let logger    		= require("../../../../core/logger");

let _ 				= require("lodash");

let db	    		= require("../../../../core/mongo");
let mongoose 		= require("../../../../core/mongoose");
let Schema 			= mongoose.Schema;
let hashids 		= require("../../../../libs/hashids")("customers");
let autoIncrement 	= require("mongoose-auto-increment");

let schemaOptions = {
	timestamps: true,
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
};

let CustomersSchema = new Schema({
	name: {
		type: String,
		trim: true
	},
	email: {
		type: String,
		trim: true
	},
	phone: {
		type: Number,
		required: "Please fill in an author ID",
		ref: "User"
	},
	createdAt: {
		type: Date
	},
	metadata: {}

}, schemaOptions);

CustomersSchema.virtual("code").get(function() {
	return this.encodeID();
});

CustomersSchema.plugin(autoIncrement.plugin, {
	model: "Customers",
	startAt: 1
});

CustomersSchema.methods.encodeID = function() {
	return hashids.encodeHex(this._id);
};

CustomersSchema.methods.decodeID = function(code) {
	return hashids.decodeHex(code);
};

/*
PostSchema.static("getByID", function(id) {
	let query;
	if (_.isArray(id)) {
		query = this.collection.find({ _id: { $in: id} });
	} else
		query = this.collection.findById(id);

	return query
		.populate({
			path: "author",
			select: ""
		})
});*/

let Customers = mongoose.model("Customers", CustomersSchema);

module.exports = Customers;
