const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		formShow: false,
		formId: '',
		formName: '',
		formSex: '',
		formBirthday: '',
		formClassName: '',
		formMemo: '',
		formGuardiansText: ''
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
			formName: '',
			formSex: '',
			formBirthday: '',
			formClassName: '',
			formMemo: '',
			formGuardiansText: ''
		});
	},

	bindEditTap: function (e) {
		let idx = pageHelper.dataset(e, 'idx');
		let item = this.data.dataList.list[idx];
		this.setData({
			formShow: true,
			formId: item._id,
			formName: item.CHILD_NAME,
			formSex: item.CHILD_SEX,
			formBirthday: item.CHILD_BIRTHDAY,
			formClassName: item.CHILD_CLASS,
			formMemo: item.CHILD_MEMO,
			formGuardiansText: this._guardiansToText(item.CHILD_GUARDIANS || [])
		});
	},

	bindSaveCmpt: async function () {
		try {
			await cloudHelper.callCloudSumbit('admin/child_save', {
				id: this.data.formId,
				name: this.data.formName,
				sex: this.data.formSex,
				birthday: this.data.formBirthday,
				className: this.data.formClassName,
				memo: this.data.formMemo,
				guardians: this._parseGuardians(this.data.formGuardiansText)
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
				await cloudHelper.callCloudSumbit('admin/child_del', {
					id
				}, {
					title: '删除中'
				});
				this.selectComponent('#cmpt-comm-list').reload();
				pageHelper.showSuccToast('删除成功');
			} catch (err) {
				console.error(err);
			}
		};
		pageHelper.showConfirm('确认删除该孩子档案？', callback);
	},

	_parseGuardians: function (text) {
		let ret = [];
		let lines = String(text || '').split('\n');
		for (let k in lines) {
			let line = lines[k].trim();
			if (!line) continue;
			let arr = line.split('|');
			ret.push({
				openid: (arr[0] || '').trim(),
				mobile: (arr[1] || '').trim(),
				name: (arr[2] || '').trim(),
				relation: (arr[3] || '').trim()
			});
		}
		return ret;
	},

	_guardiansToText: function (guardians) {
		let lines = [];
		for (let k in guardians) {
			let item = guardians[k] || {};
			lines.push([item.openid || '', item.mobile || '', item.name || '', item.relation || ''].join('|'));
		}
		return lines.join('\n');
	}
});
