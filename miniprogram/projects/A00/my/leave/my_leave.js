const pageHelper = require('../../../../helper/page_helper.js');
let skin = require('../../skin/skin.js');
let PassortBiz = require('../../../../biz/passport_biz.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		isLoad: true,
	},

	onLoad: function () {
		PassortBiz.initPage({
			skin,
			that: this,
			isLoadSkin: true,
		});
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindCommListCmpt: function (e) {
		pageHelper.commListListener(this, e);
	},

	bindCancelTap: function (e) {
		let id = pageHelper.dataset(e, 'id');
		let callback = async () => {
			try {
				await cloudHelper.callCloudSumbit('my/leave_cancel', {
					id
				}, {
					title: '取消中'
				});
				pageHelper.modifyListNode(id, this.data.dataList.list, 'LEAVE_STATUS', 10, '_id');
				pageHelper.modifyListNode(id, this.data.dataList.list, 'LEAVE_STATUS_DESC', '已取消', '_id');
				this.setData({
					dataList: this.data.dataList
				});
				pageHelper.showSuccToast('取消成功');
			} catch (err) {
				console.error(err);
			}
		};
		pageHelper.showConfirm('确认取消该请假申请？', callback);
	}
});
