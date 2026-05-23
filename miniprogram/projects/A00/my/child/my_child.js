const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');
const PassortBiz = require('../../../../biz/passport_biz.js');
let skin = require('../../skin/skin.js');

Page({
	data: {
		isLoad: false,
		list: [],
		formShow: false,
		formId: '',
		formName: '',
		formSex: '',
		formBirthday: '',
		formClassName: '',
		formMemo: ''
	},

	onLoad: async function () {
		PassortBiz.initPage({
			skin,
			that: this,
			isLoadSkin: true,
		});
		await this._loadList();
	},

	onPullDownRefresh: async function () {
		await this._loadList();
		wx.stopPullDownRefresh();
	},

	_loadList: async function () {
		try {
			let list = await cloudHelper.callCloudData('my/child_list', {}, {
				title: 'bar'
			});
			this.setData({
				isLoad: true,
				list
			});
		} catch (err) {
			console.error(err);
		}
	},

	model: function (e) {
		pageHelper.model(this, e);
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindAddTap: function () {
		this.setData({
			formShow: true,
			formId: '',
			formName: '',
			formSex: '',
			formBirthday: '',
			formClassName: '',
			formMemo: ''
		});
	},

	bindEditTap: function (e) {
		let idx = pageHelper.dataset(e, 'idx');
		let child = this.data.list[idx];
		this.setData({
			formShow: true,
			formId: child._id,
			formName: child.CHILD_NAME,
			formSex: child.CHILD_SEX,
			formBirthday: child.CHILD_BIRTHDAY,
			formClassName: child.CHILD_CLASS,
			formMemo: child.CHILD_MEMO
		});
	},

	bindSaveCmpt: async function () {
		if (!this.data.formName) return pageHelper.showModal('请填写孩子姓名');
		try {
			let params = {
				id: this.data.formId,
				name: this.data.formName,
				sex: this.data.formSex,
				birthday: this.data.formBirthday,
				className: this.data.formClassName,
				memo: this.data.formMemo
			};
			await cloudHelper.callCloudSumbit('my/child_save', params, {
				title: '保存中'
			});
			this.setData({
				formShow: false
			});
			await this._loadList();
			pageHelper.showSuccToast('保存成功');
		} catch (err) {
			console.error(err);
		}
	},

	bindDelTap: function (e) {
		let id = pageHelper.dataset(e, 'id');
		let callback = async () => {
			try {
				await cloudHelper.callCloudSumbit('my/child_del', {
					id
				}, {
					title: '删除中'
				});
				await this._loadList();
				pageHelper.showSuccToast('删除成功');
			} catch (err) {
				console.error(err);
			}
		};
		pageHelper.showConfirm('确认删除该孩子档案？', callback);
	}
});
