<template lang="pug">
	.container
		h2.title {{ "Demo" | i18n }}
		form(id="login" action="/signin" method="post")
			div 
				h1#whatthehack(data-bar="do") Upload CSV file of Customers
				input(
					type='file'
					name='file'
					ref="files"
					@change="handleFileUpload"
					)
			br
			br
			button.button.success(@click.prevent="uploadings")
				span.icon
					i.fa.fa-arrow-up
				span {{ "uploadfile" | i18n }}


</template>

<script>
	import { mapActions, mapGetters } from "vuex";
	import Service from "../../core/service";
	import axios from 'axios';

	export default {
		data() {
			return {
				file: ''
			}
		},
		
		/**
		 * Page methods
		 */
		methods: {
			/**
			 * Actions from store
			 */
			...mapActions("customers",[
				"getProfile",
				
			]),
			// upload Customers using csv file
			uploadings() {
				/*
					Initialize the form data
				*/
			
			var formData = new FormData();
				formData.append('file', this.file)
				formData.set('shah', 'shaha')
			// var data = 	{
			// 	name: 'shahjee',
			// 	email: 'dee haider',
			// 	phone: '23942394839',
			// 	wow: 'laskdjf',
			// 	file: formData
			// }
try{
	// axios.post(, formData) 
	axios.post('api/customers/create', formData, {
    headers: {
	  "Content-Type": "multipart/form-data",
	  "Content-type": "application/json"
    }
})
}
catch(errror){
console.log(errror)
}

				// this.getProfile(formData);
			},
			handleFileUpload(){
				this.file = this.$refs.files.files[0];
			}
			
		},

		/**
		 * Socket handlers. Every property is an event handler
		 */
		socket: {

			prefix: "/customers/",
			//namespace: "/counter",
			events: {
				/**
				 * Counter value is changed
				 * @param  {Number} msg Value of counter
				 */
				changed(res) {
					console.log("Counter changed to " + res.data );
					// this.changedValue(res.data);
				}
			}
		},

		created() {
			// this.$service = new Service("counter", this); 
			
			// Get the latest value of counter
			// this.getValue(); 
		}
	};

</script>

<style lang="scss" scoped>
</style>