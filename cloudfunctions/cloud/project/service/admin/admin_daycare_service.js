/**
 * Notes: 托育业务后台管理
 */

const BaseAdminService = require('./base_admin_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

const LeaveModel = require('../../model/leave_model.js');
const JoinModel = require('../../model/join_model.js');
const MeetService = require('../meet_service.js');

class AdminDaycareService extends BaseAdminService {

	async getLeaveList({
		search,
		sortType,
		sortVal,
		page,
		size,
		isTotal = true,
		oldTotal = 0
	}) {
		let where = {};
		if (search) {
			where.or = [{
				LEAVE_CHILD_NAME: ['like', search]
			}, {
				LEAVE_MEET_TITLE: ['like', search]
			}, {
				LEAVE_REASON: ['like', search]
			}];
		} else if (sortType == 'status') {
			where.LEAVE_STATUS = Number(sortVal);
		}
		let fields = '*';
		let orderBy = {
			LEAVE_ADD_TIME: 'desc'
		};
		return await LeaveModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	async statusLeave(admin, id, status, reason = '') {
		status = Number(status);
		let leave = await LeaveModel.getOne({
			_id: id,
			LEAVE_STATUS: LeaveModel.STATUS.WAIT
		});
		if (!leave) this.AppError('未找到待处理的请假申请');

		let data = {
			LEAVE_STATUS: status,
			LEAVE_ADMIN_ID: admin.ADMIN_ID || admin._id || '',
			LEAVE_ADMIN_NAME: admin.ADMIN_NAME || admin.name || '',
			LEAVE_ADMIN_REASON: reason,
			LEAVE_ADMIN_TIME: timeUtil.time()
		};
		await LeaveModel.edit(id, data);

		if (status == LeaveModel.STATUS.PASS) {
			await JoinModel.edit({
				_id: leave.LEAVE_JOIN_ID,
				JOIN_STATUS: ['in', [JoinModel.STATUS.WAIT, JoinModel.STATUS.SUCC]]
			}, {
				JOIN_STATUS: JoinModel.STATUS.CANCEL,
				JOIN_REASON: '请假通过' + (reason ? '：' + reason : ''),
				JOIN_IS_CHECKIN: 0
			});
			let meetService = new MeetService();
			await meetService.statJoinCnt(leave.LEAVE_MEET_ID, leave.LEAVE_MEET_TIME_MARK);
		}
	}

}

module.exports = AdminDaycareService;
