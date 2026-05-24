/**
 * Notes: 孩子档案与请假业务
 */

const BaseService = require('./base_service.js');
const timeUtil = require('../../framework/utils/time_util.js');
const util = require('../../framework/utils/util.js');

const ChildModel = require('../model/child_model.js');
const LeaveModel = require('../model/leave_model.js');
const JoinModel = require('../model/join_model.js');
const CoursePackageModel = require('../model/course_package_model.js');
const CourseConsumeModel = require('../model/course_consume_model.js');
const ContractModel = require('../model/contract_model.js');

class ChildService extends BaseService {

	async getChildList(userId) {
		let orderBy = {
			CHILD_ADD_TIME: 'asc'
		};
		let list = await ChildModel.getAllBig({
			CHILD_STATUS: ChildModel.STATUS.COMM
		}, '*', orderBy, 1000);
		return list.filter(child => this._isGuardian(child, userId));
	}

	async saveChild(userId, {
		id = '',
		name,
		sex = '',
		birthday = '',
		className = '',
		memo = ''
	}) {
		this.AppError('孩子档案由园区后台绑定，请联系老师或管理员');
		let guardians = this._normalizeGuardians([{
			openid: userId,
			relation: '主监护人'
		}]);
		let data = {
			CHILD_NAME: name,
			CHILD_SEX: sex,
			CHILD_BIRTHDAY: birthday,
			CHILD_CLASS: className,
			CHILD_MEMO: memo,
			CHILD_GUARDIANS: guardians
		};

		if (id) {
			let child = await this._getMyChild(userId, id, '_id,CHILD_USER_ID,CHILD_GUARDIANS');
			if (!child) this.AppError('孩子档案不存在');
			data.CHILD_GUARDIANS = this._mergeGuardians(child.CHILD_GUARDIANS || [], guardians);
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
		this.AppError('孩子档案由园区后台绑定，请联系老师或管理员删除');
		let child = await this._getMyChild(userId, id, '_id');
		if (!child) return;
		await ChildModel.edit(id, {
			CHILD_STATUS: ChildModel.STATUS.DEL
		});
	}

	async getChildRecord(userId, childId) {
		let child = await this._getMyChild(userId, childId);
		if (!child) this.AppError('孩子档案不存在');

		let joinList = await JoinModel.getAllBig({}, 'JOIN_IS_CHECKIN,JOIN_REASON,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_STATUS,JOIN_ADD_TIME,JOIN_FORMS', {
			JOIN_MEET_DAY: 'desc',
			JOIN_MEET_TIME_START: 'desc',
			JOIN_ADD_TIME: 'desc'
		}, 1000);
		joinList = joinList.filter(item => {
			let childInfo = this._getChildInfo(item.JOIN_FORMS || []);
			return childInfo.id == childId || (!childInfo.id && childInfo.name == child.CHILD_NAME);
		});

		let leaveList = await LeaveModel.getAllBig({
			LEAVE_CHILD_ID: childId
		}, '*', {
			LEAVE_ADD_TIME: 'desc'
		}, 1000);
		let packageList = await CoursePackageModel.getAllBig({
			PACKAGE_CHILD_ID: childId
		}, '*', {
			PACKAGE_ADD_TIME: 'desc'
		}, 1000);
		let consumeList = await CourseConsumeModel.getAllBig({
			CONSUME_CHILD_ID: childId
		}, '*', {
			CONSUME_ADD_TIME: 'desc'
		}, 1000);
		let contractList = await ContractModel.getAllBig({
			CONTRACT_CHILD_ID: childId
		}, '*', {
			CONTRACT_ADD_TIME: 'desc'
		}, 1000);

		return {
			child,
			joinList,
			leaveList,
			packageList,
			consumeList,
			contractList
		};
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

	async _getMyChild(userId, childId, fields = '*') {
		let child = await ChildModel.getOne({
			_id: childId,
			CHILD_STATUS: ChildModel.STATUS.COMM
		}, fields);
		if (!child) return null;
		if (!this._isGuardian(child, userId)) return null;
		return child;
	}

	_isGuardian(child, userId) {
		if (!child) return false;
		if (child.CHILD_USER_ID == userId) return true;
		let guardians = child.CHILD_GUARDIANS || [];
		for (let k in guardians) {
			if (guardians[k].openid == userId) return true;
		}
		return false;
	}

	_normalizeGuardians(guardians = []) {
		let ret = [];
		let exists = {};
		for (let k in guardians) {
			let item = guardians[k] || {};
			let openid = String(item.openid || '').trim();
			let mobile = String(item.mobile || '').trim();
			if (!openid && !mobile) continue;
			let key = openid || mobile;
			if (exists[key]) continue;
			exists[key] = true;
			ret.push({
				openid,
				mobile,
				name: String(item.name || '').trim(),
				relation: String(item.relation || '').trim()
			});
		}
		return ret;
	}

	_mergeGuardians(oldGuardians = [], newGuardians = []) {
		return this._normalizeGuardians(oldGuardians.concat(newGuardians));
	}

}

module.exports = ChildService;
