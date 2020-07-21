"use strict";

let logger 		= require("../../../core/logger");
let config 		= require("../../../config");
let C 	 		= require("../../../core/constants");

let _			= require("lodash");

let Customers 		= require("./models/customers");

const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../storage/images/products/'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({storage}).single('img');

module.exports = {
	settings: {
		name: "customers",
		version: 1,
		namespace: "customers",
		rest: true,
		ws: true,
		graphql: true,
		permission: C.PERM_LOGGEDIN,
		role: "user",
		collection: Customers,

		modelPropFilter: "name email phone createdAt updatedAt",
		
		modelPopulates: {
			"author": "persons",
			"voters": "persons"
		}
	},

	actions: {
		find: {
			cache: true,
			handler(ctx) {
				let filter = {};

				if (ctx.params.filter == "my") 
					filter.author = ctx.user.id;
				else if (ctx.params.author != null) { 
					filter.author = this.personService.decodeID(ctx.params.author);
				}

				let query = Customers.find(filter);

				return ctx.queryPageSort(query).exec().then( (docs) => {
					return this.toJSON(docs);
				})
				.then((json) => {
					return this.populateModels(json);
				});
			}
		},

		// return a model by ID
		get: {
			cache: true, // if true, we don't increment the views!
			permission: C.PERM_PUBLIC,
			handler(ctx) {
				ctx.assertModelIsExist(ctx.t("app:PostNotFound"));

				return Customers.findByIdAndUpdate(ctx.modelID, { $inc: { views: 1 } }).exec().then( (doc) => {
					return this.toJSON(doc);
				})
				.then((json) => {
					return this.populateModels(json);
				});
			}
		},

		create: {
			handler(ctx, upload) {
				
				console.log('wlekrwlej', ctx.params, upload)
				// this.validateParams(ctx, true);
				// let post = new Customers({
				// 	name: ctx.params.title,
				// 	email: ctx.params.content,
				// 	phone: ctx.user.id
				// });
				// console.log(ctx.params.name, post)

				// return Customers.save()
				// .then((doc) => {
				// 	return this.toJSON(doc);
				// })
				// .then((json) => {
				// 	return this.populateModels(json);
				// })
				// .then((json) => {
				// 	this.notifyModelChanges(ctx, "created", json);
				// 	return json;
				// });								
			}
		},

		update: {
			permission: C.PERM_OWNER,
			handler(ctx) {
				ctx.assertModelIsExist(ctx.t("app:PostNotFound"));
				this.validateParams(ctx);

				return this.collection.findById(ctx.modelID).exec()
				.then((doc) => {
					if (ctx.params.title != null)
						doc.title = ctx.params.title;

					if (ctx.params.content != null)
						doc.content = ctx.params.content;
					
					doc.editedAt = Date.now();
					return doc.save();
				})
				.then((doc) => {
					return this.toJSON(doc);
				})
				.then((json) => {
					return this.populateModels(json);
				})
				.then((json) => {
					this.notifyModelChanges(ctx, "updated", json);
					return json;
				});								
			}
		},

		remove: {
			permission: C.PERM_OWNER,
			handler(ctx) {
				ctx.assertModelIsExist(ctx.t("app:PostNotFound"));

				return Customers.remove({ _id: ctx.modelID })
				.then(() => {
					return ctx.model;
				})
				.then((json) => {
					this.notifyModelChanges(ctx, "removed", json);
					return json;
				});		
			}
		},

		vote(ctx) {
			ctx.assertModelIsExist(ctx.t("app:PostNotFound"));

			return this.collection.findById(ctx.modelID).exec()
			.then((doc) => {		
				// Check user is on voters
				if (doc.voters.indexOf(ctx.user.id) !== -1) 
					throw ctx.errorBadRequest(C.ERR_ALREADY_VOTED, ctx.t("app:YouHaveAlreadyVotedThisPost"));
				return doc;
			})
			.then((doc) => {
				// Add user to voters
				return Customers.findByIdAndUpdate(doc.id, { $addToSet: { voters: ctx.user.id } , $inc: { votes: 1 }}, { "new": true });
			})
			.then((doc) => {
				return this.toJSON(doc);
			})
			.then((json) => {
				return this.populateModels(json);
			})
			.then((json) => {
				this.notifyModelChanges(ctx, "voted", json);
				return json;
			});
		},

		unvote(ctx) {
			ctx.assertModelIsExist(ctx.t("app:PostNotFound"));

			return this.collection.findById(ctx.modelID).exec()
			.then((doc) => {
				// Check user is on voters
				if (doc.voters.indexOf(ctx.user.id) == -1) 
					throw ctx.errorBadRequest(C.ERR_NOT_VOTED_YET, ctx.t("app:YouHaveNotVotedThisPostYet"));
				return doc;
			})
			.then((doc) => {
				// Remove user from voters
				return Customers.findByIdAndUpdate(doc.id, { $pull: { voters: ctx.user.id } , $inc: { votes: -1 }}, { "new": true });
			})
			.then((doc) => {
				return this.toJSON(doc);
			})
			.then((json) => {
				return this.populateModels(json);
			})
			.then((json) => {
				this.notifyModelChanges(ctx, "unvoted", json);
				return json;
			});

		}

	},

	methods: {
		/**
		 * Validate params of context.
		 * We will call it in `create` and `update` actions
		 * 
		 * @param {Context} ctx 			context of request
		 * @param {boolean} strictMode 		strictMode. If true, need to exists the required parameters
		 */
		validateParams(ctx, strictMode) {
			if (strictMode || ctx.hasParam("title"))
				ctx.validateParam("title").trim().notEmpty(ctx.t("app:PostTitleCannotBeEmpty")).end();

			if (strictMode || ctx.hasParam("content"))
				ctx.validateParam("content").trim().notEmpty(ctx.t("app:PostContentCannotBeEmpty")).end();
			
			if (ctx.hasValidationErrors())
				throw ctx.errorBadRequest(C.ERR_VALIDATION_ERROR, ctx.validationErrors);			
		}

	},

	/**
	 * Check the owner of model
	 * 
	 * @param {any} ctx	Context of request
	 * @returns	{Promise}
	 */
	ownerChecker(ctx) {
		return new Promise((resolve, reject) => {
			ctx.assertModelIsExist(ctx.t("app:PostNotFound"));

			if (ctx.model.author.code == ctx.user.code || ctx.isAdmin()) 
				resolve();
			else
				reject();
		});
	},

	init(ctx) {
		// Fired when start the service
		this.personService = ctx.services("persons");
 
		// Add custom error types
		C.append([
			"ALREADY_VOTED",
			"NOT_VOTED_YET"
		], "ERR");
	},

	socket: {
		afterConnection(socket, io) {
			// Fired when a new client connected via websocket
		}
	},

	graphql: {

		query: `
			Customers(limit: Int, offset: Int, sort: String): [Customers]
			Customer(code: String): Customers
		`,

		types: `
			type Customers {
				name: String!
				email: String
				phone: String
				createdAt: Timestamp
				updatedAt: Timestamp
			}
		`,

		mutation: `
			CustomersCreate(title: String!, content: String!):Customers
			CustomersUpdate(code: String!, title: String, content: String):Customers
			CustomersRemove(code: String!):Customers

			CustomersVote(code: String!):Customers
			CustomersUnvote(code: String!):Customers
		`,

		resolvers: {
			Query: {
				Customers: "find",
				Customer: "get"
			},

			Mutation: {
				CustomersCreate: "create",
				CustomersUpdate: "update",
				CustomersRemove: "remove",
				CustomersVote: "vote",
				CustomersUnvote: "unvote"
			}
		}
	}

};

/*
## GraphiQL test ##

# Find all posts
query getPosts {
  posts(sort: "-createdAt -votes", limit: 3) {
    ...postFields
  }
}

# Create a new post
mutation createPost {
  postCreate(title: "New post", content: "New post content") {
    ...postFields
  }
}

# Get a post
query getPost($code: String!) {
  post(code: $code) {
    ...postFields
  }
}

# Update an existing post
mutation updatePost($code: String!) {
  postUpdate(code: $code, content: "Modified post content") {
    ...postFields
  }
}

# vote the post
mutation votePost($code: String!) {
  postVote(code: $code) {
    ...postFields
  }
}

# unvote the post
mutation unVotePost($code: String!) {
  postUnvote(code: $code) {
    ...postFields
  }
}

# Remove a post
mutation removePost($code: String!) {
  postRemove(code: $code) {
    ...postFields
  }
}



fragment postFields on Post {
    code
    title
    content
    author {
      code
      fullName
      username
      avatar
    }
    views
    votes
  	voters {
  	  code
  	  fullName
  	  username
  	  avatar
  	}
}

*/