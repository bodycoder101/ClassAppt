const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');

Page({
	onLoad: function () {
		if (!AdminBiz.isAdmin(this)) return;
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindCommListCmpt: function (e) {
		pageHelper.commListListener(this, e);
	}
});
