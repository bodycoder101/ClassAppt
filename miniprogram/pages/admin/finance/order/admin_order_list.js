const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		formShow: false,
		refundShow: false,
		formUserId: '',
		formUserName: '',
		formChildId: '',
		formChildName: '',
		formTitle: '',
		formAmount: '',
		formPackageName: '',
		formPackageType: 'times',
		formTotalTimes: '',
		formStartDay: '',
		formEndDay: '',
		formMemo: '',
		formRefundReason: '',
		curId: ''
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

	bindAddTap: function () {
		this.setData({
			formShow: true,
			formUserId: '',
			formUserName: '',
			formChildId: '',
			formChildName: '',
			formTitle: '',
			formAmount: '',
			formPackageName: '',
			formPackageType: 'times',
			formTotalTimes: '',
			formStartDay: '',
			formEndDay: '',
			formMemo: ''
		});
	},

	bindSaveCmpt: async function () {
		try {
			await cloudHelper.callCloudSumbit('admin/order_create', {
				userId: this.data.formUserId,
				userName: this.data.formUserName,
				childId: this.data.formChildId,
				childName: this.data.formChildName,
				title: this.data.formTitle,
				amount: Number(this.data.formAmount || 0) * 100,
				packageName: this.data.formPackageName,
				packageType: this.data.formPackageType,
				totalTimes: Number(this.data.formTotalTimes || 0),
				startDay: this.data.formStartDay,
				endDay: this.data.formEndDay,
				memo: this.data.formMemo
			}, {
				title: '保存中'
			});
			this.setData({
				formShow: false
			});
			this.selectComponent('#cmpt-comm-list').reload();
			pageHelper.showSuccToast('保存成功');
		} catch (err) {
			console.error(err);
		}
	},

	bindRefundTap: function (e) {
		this.setData({
			curId: pageHelper.dataset(e, 'id'),
			formRefundReason: '',
			refundShow: true
		});
	},

	bindRefundCmpt: async function () {
		try {
			await cloudHelper.callCloudSumbit('admin/order_refund', {
				id: this.data.curId,
				reason: this.data.formRefundReason
			}, {
				title: '退款中'
			});
			this.setData({
				refundShow: false,
				curId: ''
			});
			this.selectComponent('#cmpt-comm-list').reload();
			pageHelper.showSuccToast('已退款');
		} catch (err) {
			console.error(err);
		}
	},

	_getSearchMenu: function () {
		this.setData({
			sortItems: [],
			sortMenus: [{
				label: '全部',
				type: '',
				value: ''
			}, {
				label: '已支付',
				type: 'pay',
				value: 1
			}, {
				label: '已退款',
				type: 'pay',
				value: 8
			}]
		});
	}
});
