import Vue from "vue";
import toastr from "../../../core/toastr";

// const NAMESPACE = "/api/profile";

// import Service from "../../../core/service";
// let service = new Service("profile");


// export const uploadfile = function ({ commit }) {
// 	alert('hi')
// 	console.log('buddy bworkkdl outside')
// 	// service.emit("uploadfile").then(() => {
// 	// 	console.log('working')
// 		commit("myval")
// 	// })
// }



// const NAMESPACE = "/api/profile";

import Service from "../../../core/service";
let service = new Service("customers"); 

export const getProfile = function ({ commit }, datas) {
	service.rest("create", datas).then((data) => {
		commit("myval", datas);
	}).catch((err) => {
		toastr.error(err.message);
	});
};