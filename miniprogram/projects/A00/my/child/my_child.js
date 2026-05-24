const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');
const PassortBiz = require('../../../../biz/passport_biz.js');
let skin = require('../../skin/skin.js');

Page({
	data: {
		isLoad: false,
		list: []
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

	bindRecordTap: function (e) {
		let id = pageHelper.dataset(e, 'id');
		wx.navigateTo({
			url: '../child_record/child_record?id=' + id
		});
	}
});
