/**
 * Notes: 托育后台控制器
 */

const BaseAdminController = require('./base_admin_controller.js');
const AdminDaycareService = require('../../service/admin/admin_daycare_service.js');
const LeaveModel = require('../../model/leave_model.js');
const timeUtil = require('../../../framework/utils/time_util.js');

class AdminDaycareController extends BaseAdminController {

	async getTeacherToday() {
		await this.isAdmin();
		let rules = {
			day: 'string|name=日期',
			teacher: 'string|max:50|name=老师',
		};
		let input = this.validateData(rules);
		let service = new AdminDaycareService();
		let list = await service.getTeacherToday(input.day || timeUtil.time('Y-M-D'), input.teacher || '');
		return {
			day: input.day || timeUtil.time('Y-M-D'),
			week: timeUtil.week(input.day || timeUtil.time('Y-M-D')),
			list
		};
	}

	async getLeaveList() {
		await this.isAdmin();
		let rules = {
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		};
		let input = this.validateData(rules);
		let service = new AdminDaycareService();
		let result = await service.getLeaveList(input);
		for (let k in result.list) {
			result.list[k].LEAVE_STATUS_DESC = LeaveModel.getDesc('STATUS', result.list[k].LEAVE_STATUS);
			result.list[k].LEAVE_ADD_TIME = timeUtil.timestamp2Time(result.list[k].LEAVE_ADD_TIME);
			result.list[k].LEAVE_ADMIN_TIME = result.list[k].LEAVE_ADMIN_TIME ? timeUtil.timestamp2Time(result.list[k].LEAVE_ADMIN_TIME) : '';
		}
		return result;
	}

	async sendCourseRemind() {
		await this.isAdmin();
		let rules = {
			meetId: 'must|id',
			timeMark: 'must|string',
		};
		let input = this.validateData(rules);
		let service = new AdminDaycareService();
		return await service.sendCourseRemind(input.meetId, input.timeMark);
	}

	async statusLeave() {
		await this.isAdmin();
		let rules = {
			id: 'must|id',
			status: 'must|int|in:1,8',
			reason: 'string|max:100',
		};
		let input = this.validateData(rules);
		let service = new AdminDaycareService();
		await service.statusLeave(this._admin, input.id, input.status, input.reason);
	}

}

module.exports = AdminDaycareController;
