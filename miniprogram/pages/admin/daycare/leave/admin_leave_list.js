const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		isLoad: true,
		reasonModalShow: false,
		formReason: '',
		curIdx: -1,
		curStatus: 0
	},

	onLoad: function () {
		if (!AdminBiz.isAdmin(this)) return;
		this._getSearchMenu();
	},

	model: function (e) {
		pageHelper.model(this, e);
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindCommListCmpt: function (e) {
		pageHelper.commListListener(this, e);
	},

	_getSearchMenu: function () {
		let sortMenus = [{
			label: '全部',
			type: '',
			value: ''
		}, {
			label: '待审核',
			type: 'status',
			value: 0
		}, {
			label: '已通过',
			type: 'status',
			value: 1
		}, {
			label: '已拒绝',
			type: 'status',
			value: 8
		}];
		this.setData({
			sortItems: [],
			sortMenus
		});
	},

	bindStatusTap: function (e) {
		this.setData({
			curIdx: pageHelper.dataset(e, 'idx'),
			curStatus: Number(pageHelper.dataset(e, 'status')),
			formReason: '',
			reasonModalShow: true
		});
	},

	bindStatusCmpt: async function () {
		let idx = this.data.curIdx;
		if (idx < 0) return;
		let item = this.data.dataList.list[idx];
		try {
			await cloudHelper.callCloudSumbit('admin/leave_status', {
				id: item._id,
				status: this.data.curStatus,
				reason: this.data.formReason
			}, {
				title: '处理中'
			});
			item.LEAVE_STATUS = this.data.curStatus;
			item.LEAVE_STATUS_DESC = this.data.curStatus == 1 ? '已通过' : '已拒绝';
			item.LEAVE_ADMIN_REASON = this.data.formReason;
			this.setData({
				dataList: this.data.dataList,
				reasonModalShow: false,
				formReason: '',
				curIdx: -1
			});
			pageHelper.showSuccToast('处理成功');
		} catch (err) {
			console.error(err);
		}
	}
});
