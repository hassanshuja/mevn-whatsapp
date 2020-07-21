const state = {
	count: 0,
	checkmyval: {}
};

const mutations = {
	["myval"] (state, data) {
		console.log('comiming in mutations', state, data)
		return true;
	}
};

import * as getters from "./getters";
import * as actions from "./actions";

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
};