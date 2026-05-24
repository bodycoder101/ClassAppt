const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');

Page({
	data: {
		isLoad: false,
		day: '',
		week: '',
		list: []
	},

	onLoad: function () {
		if (!AdminBiz.isAdmin(this)) return;
		this.setData({
			day: this._formatDay(new Date())
		});
		this._loadData();
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindPrevTap: function () {
		this.setData({
			day: this._offsetDay(this.data.day, -1)
		});
		this._loadData();
	},

	bindNextTap: function () {
		this.setData({
			day: this._offsetDay(this.data.day, 1)
		});
		this._loadData();
	},

	bindTodayTap: function () {
		this.setData({
			day: this._formatDay(new Date())
		});
		this._loadData();
	},

	bindRefreshTap: function () {
		this._loadData();
	},

	bindCheckinTap: function (e) {
		let scheduleIdx = Number(pageHelper.dataset(e, 'scheduleidx'));
		let studentIdx = Number(pageHelper.dataset(e, 'studentidx'));
		let flag = Number(pageHelper.dataset(e, 'flag'));
		let student = this.data.list[scheduleIdx].students[studentIdx];
		let callback = async () => {
			try {
				await cloudHelper.callCloudSumbit('admin/join_checkin', {
					joinId: student._id,
					flag
				}, {
					title: '处理中'
				});
				let list = this.data.list;
				list[scheduleIdx].students[studentIdx].JOIN_IS_CHECKIN = flag;
				list[scheduleIdx].checkinCnt = list[scheduleIdx].students.filter(item => item.JOIN_IS_CHECKIN == 1).length;
				this.setData({
					list
				});
				pageHelper.showSuccToast('操作成功');
			} catch (err) {
				console.error(err);
			}
		};
		pageHelper.showConfirm(flag == 1 ? '确认签到？' : '确认取消签到？', callback);
	},

	_loadData: async function () {
		this.setData({
			isLoad: false
		});
		try {
			let data = await cloudHelper.callCloudData('admin/teacher_today', {
				day: this.data.day
			}, {
				title: 'bar'
			});
			data = data || {};
			this.setData({
				isLoad: true,
				week: data.week,
				list: data.list || []
			});
		} catch (err) {
			console.error(err);
			this.setData({
				isLoad: true
			});
		}
	},

	_offsetDay: function (day, step) {
		let date = new Date(day.replace(/-/g, '/') + ' 00:00:00');
		date.setDate(date.getDate() + step);
		return this._formatDay(date);
	},

	_formatDay: function (date) {
		let month = date.getMonth() + 1;
		let day = date.getDate();
		return date.getFullYear() + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
	}
});
