const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		formShow: false,
		formId: '',
		formUserId: '',
		formUserName: '',
		formChildId: '',
		formChildName: '',
		formTitle: '',
		formNo: '',
		formUrl: '',
		formSignDay: '',
		formExpireDay: '',
		formMemo: ''
	},

	onLoad: function () {
		if (!AdminBiz.isAdmin(this)) return;
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
			formId: '',
			formUserId: '',
			formUserName: '',
			formChildId: '',
			formChildName: '',
			formTitle: '',
			formNo: '',
			formUrl: '',
			formSignDay: '',
			formExpireDay: '',
			formMemo: ''
		});
	},

	bindSaveCmpt: async function () {
		try {
			await cloudHelper.callCloudSumbit('admin/contract_save', {
				id: this.data.formId,
				userId: this.data.formUserId,
				userName: this.data.formUserName,
				childId: this.data.formChildId,
				childName: this.data.formChildName,
				title: this.data.formTitle,
				no: this.data.formNo,
				url: this.data.formUrl,
				signDay: this.data.formSignDay,
				expireDay: this.data.formExpireDay,
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

	bindDelTap: function (e) {
		let id = pageHelper.dataset(e, 'id');
		let callback = async () => {
			try {
				await cloudHelper.callCloudSumbit('admin/contract_del', {
					id
				}, {
					title: '处理中'
				});
				this.selectComponent('#cmpt-comm-list').reload();
				pageHelper.showSuccToast('已作废');
			} catch (err) {
				console.error(err);
			}
		};
		pageHelper.showConfirm('确认作废该合同记录？', callback);
	}
});
