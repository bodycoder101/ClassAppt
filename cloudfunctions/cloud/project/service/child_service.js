/**
 * Notes: 孩子档案与请假业务
 */

const BaseService = require('./base_service.js');
const timeUtil = require('../../framework/utils/time_util.js');
const util = require('../../framework/utils/util.js');

const ChildModel = require('../model/child_model.js');
const LeaveModel = require('../model/leave_model.js');
const JoinModel = require('../model/join_model.js');

class ChildService extends BaseService {

	async getChildList(userId) {
		let where = {
			CHILD_USER_ID: userId,
			CHILD_STATUS: ChildModel.STATUS.COMM
		};
		let orderBy = {
			CHILD_ADD_TIME: 'asc'
		};
		return await ChildModel.getAll(where, '*', orderBy, 100);
	}

	async saveChild(userId, {
		id = '',
		name,
		sex = '',
		birthday = '',
		className = '',
		memo = ''
	}) {
		let data = {
			CHILD_NAME: name,
			CHILD_SEX: sex,
			CHILD_BIRTHDAY: birthday,
			CHILD_CLASS: className,
			CHILD_MEMO: memo
		};

		if (id) {
			let child = await ChildModel.getOne({
				_id: id,
				CHILD_USER_ID: userId,
				CHILD_STATUS: ChildModel.STATUS.COMM
			}, '_id');
			if (!child) this.AppError('孩子档案不存在');
			await ChildModel.edit(id, data);
			return {
				id
			};
		}

		data.CHILD_USER_ID = userId;
		let newId = await ChildModel.insert(data);
		return {
			id: newId
		};
	}

	async delChild(userId, id) {
		let child = await ChildModel.getOne({
			_id: id,
			CHILD_USER_ID: userId,
			CHILD_STATUS: ChildModel.STATUS.COMM
		}, '_id');
		if (!child) return;
		await ChildModel.edit(id, {
			CHILD_STATUS: ChildModel.STATUS.DEL
		});
	}

	async applyLeave(userId, {
		joinId,
		reason = ''
	}) {
		let join = await JoinModel.getOne({
			_id: joinId,
			JOIN_USER_ID: userId,
			JOIN_STATUS: ['in', [JoinModel.STATUS.WAIT, JoinModel.STATUS.SUCC]]
		});
		if (!join) this.AppError('未找到可请假的预约记录');
		if (join.JOIN_IS_CHECKIN == 1) this.AppError('已签到记录不能请假');

		let startTime = timeUtil.time2Timestamp(join.JOIN_MEET_DAY + ' ' + join.JOIN_MEET_TIME_START + ':00');
		if (timeUtil.time() > startTime) this.AppError('课程已经开始，不能提交请假');

		let old = await LeaveModel.getOne({
			LEAVE_JOIN_ID: joinId,
			LEAVE_USER_ID: userId,
			LEAVE_STATUS: LeaveModel.STATUS.WAIT
		}, '_id');
		if (old) this.AppError('该预约已有待审核请假申请');

		let childInfo = this._getChildInfo(join.JOIN_FORMS || []);
		let data = {
			LEAVE_USER_ID: userId,
			LEAVE_CHILD_ID: childInfo.id,
			LEAVE_CHILD_NAME: childInfo.name,
			LEAVE_JOIN_ID: join._id,
			LEAVE_MEET_ID: join.JOIN_MEET_ID,
			LEAVE_MEET_TITLE: join.JOIN_MEET_TITLE,
			LEAVE_MEET_DAY: join.JOIN_MEET_DAY,
			LEAVE_MEET_TIME_START: join.JOIN_MEET_TIME_START,
			LEAVE_MEET_TIME_END: join.JOIN_MEET_TIME_END,
			LEAVE_MEET_TIME_MARK: join.JOIN_MEET_TIME_MARK,
			LEAVE_REASON: reason,
			LEAVE_STATUS: LeaveModel.STATUS.WAIT
		};
		let id = await LeaveModel.insert(data);
		return {
			id
		};
	}

	async getMyLeaveList(userId, {
		page,
		size,
		isTotal = true,
		oldTotal = 0
	}) {
		let where = {
			LEAVE_USER_ID: userId
		};
		let fields = '*';
		let orderBy = {
			LEAVE_ADD_TIME: 'desc'
		};
		return await LeaveModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	async cancelLeave(userId, id) {
		let leave = await LeaveModel.getOne({
			_id: id,
			LEAVE_USER_ID: userId,
			LEAVE_STATUS: LeaveModel.STATUS.WAIT
		}, '_id');
		if (!leave) this.AppError('未找到可取消的请假申请');
		await LeaveModel.edit(id, {
			LEAVE_STATUS: LeaveModel.STATUS.CANCEL
		});
	}

	_getChildInfo(forms) {
		let ret = {
			id: '',
			name: ''
		};
		for (let k in forms) {
			if (forms[k].mark == 'CHILD_ID' && util.isDefined(forms[k].val)) ret.id = forms[k].val;
			if ((forms[k].mark == 'CHILD_NAME' || forms[k].title == '孩子姓名') && util.isDefined(forms[k].val)) ret.name = forms[k].val;
		}
		return ret;
	}

}

module.exports = ChildService;
