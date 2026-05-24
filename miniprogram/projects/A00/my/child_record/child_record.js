const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');
const PassortBiz = require('../../../../biz/passport_biz.js');
let skin = require('../../skin/skin.js');

Page({
	data: {
		isLoad: false,
		id: '',
		child: null,
		joinList: [],
		leaveList: [],
		packageList: [],
		consumeList: [],
		contractList: []
	},

	onLoad: async function (options) {
		PassortBiz.initPage({
			skin,
			that: this,
			isLoadSkin: true,
		});
		this.setData({
			id: options.id || ''
		});
		await this._loadData();
	},

	onPullDownRefresh: async function () {
		await this._loadData();
		wx.stopPullDownRefresh();
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	_loadData: async function () {
		if (!this.data.id) return;
		try {
			let data = await cloudHelper.callCloudData('my/child_record', {
				id: this.data.id
			}, {
				title: 'bar'
			});
			data = data || {};
			this.setData({
				isLoad: true,
				child: data.child,
				joinList: data.joinList || [],
				leaveList: data.leaveList || [],
				packageList: data.packageList || [],
				consumeList: data.consumeList || [],
				contractList: data.contractList || []
			});
			if (data.child && data.child.CHILD_NAME) {
				wx.setNavigationBarTitle({
					title: data.child.CHILD_NAME + '的记录'
				});
			}
		} catch (err) {
			console.error(err);
			this.setData({
				isLoad: true
			});
		}
	}
});
