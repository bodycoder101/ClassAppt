const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		isLoad: false,
		data: null
	},

	onLoad: function () {
		if (!AdminBiz.isAdmin(this)) return;
		this._loadData();
	},

	onPullDownRefresh: async function () {
		await this._loadData();
		wx.stopPullDownRefresh();
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	_loadData: async function () {
		try {
			let data = await cloudHelper.callCloudData('admin/finance_stats', {}, {
				title: 'bar'
			});
			this.setData({
				isLoad: true,
				data
			});
		} catch (err) {
			console.error(err);
			this.setData({
				isLoad: true
			});
		}
	}
});
