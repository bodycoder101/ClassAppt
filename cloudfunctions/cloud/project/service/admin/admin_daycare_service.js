/**
 * Notes: 托育业务后台管理
 */

const BaseAdminService = require('./base_admin_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

const LeaveModel = require('../../model/leave_model.js');
const JoinModel = require('../../model/join_model.js');
const MeetModel = require('../../model/meet_model.js');
const DayModel = require('../../model/day_model.js');
const MeetService = require('../meet_service.js');
const NotifyService = require('../notify_service.js');

class AdminDaycareService extends BaseAdminService {

	async getTeacherToday(day, teacher = '') {
		day = day || timeUtil.time('Y-M-D');
		let dayList = await DayModel.getAllBig({
			day
		}, '*', {
			day: 'asc'
		}, 1000);
		if (!dayList.length) return [];

		let meetIds = [];
		for (let k in dayList) {
			if (!meetIds.includes(dayList[k].DAY_MEET_ID)) meetIds.push(dayList[k].DAY_MEET_ID);
		}

		let meetList = await MeetModel.getAllBig({
			_id: ['in', meetIds]
		}, '_id,MEET_TITLE,MEET_TEACHER,MEET_PLACE,MEET_AGE,MEET_CLASS,MEET_STATUS', {}, 1000);
		let meetMap = {};
		for (let k in meetList) {
			if (teacher && meetList[k].MEET_TEACHER != teacher) continue;
			meetMap[meetList[k]._id] = meetList[k];
		}

		let joinList = await JoinModel.getAllBig({
			JOIN_MEET_DAY: day,
			JOIN_STATUS: ['in', [JoinModel.STATUS.WAIT, JoinModel.STATUS.SUCC]]
		}, '*', {
			JOIN_MEET_TIME_START: 'asc',
			JOIN_ADD_TIME: 'asc'
		}, 5000);
		let joinMap = {};
		for (let k in joinList) {
			let key = joinList[k].JOIN_MEET_ID + '_' + joinList[k].JOIN_MEET_TIME_MARK;
			if (!joinMap[key]) joinMap[key] = [];
			let child = this._getChildInfo(joinList[k].JOIN_FORMS || []);
			joinList[k].CHILD_NAME = child.name || '未填写';
			joinList[k].CHILD_ID = child.id;
			joinList[k].JOIN_STATUS_DESC = JoinModel.getDesc('STATUS', joinList[k].JOIN_STATUS);
			joinMap[key].push(joinList[k]);
		}

		let ret = [];
		for (let k in dayList) {
			let meet = meetMap[dayList[k].DAY_MEET_ID];
			if (!meet) continue;
			let times = dayList[k].times || [];
			for (let j in times) {
				let time = times[j];
				if (time.status == 0) continue;
				let key = dayList[k].DAY_MEET_ID + '_' + time.mark;
				let students = joinMap[key] || [];
				ret.push({
					meetId: dayList[k].DAY_MEET_ID,
					meetTitle: meet.MEET_TITLE,
					teacher: meet.MEET_TEACHER || '',
					place: meet.MEET_PLACE || '',
					age: meet.MEET_AGE || '',
					className: meet.MEET_CLASS || '',
					day,
					timeMark: time.mark,
					start: time.start,
					end: time.end,
					limit: time.limit || 0,
					isLimit: time.isLimit || 0,
					stat: time.stat || {},
					students,
					studentCnt: students.length,
					checkinCnt: students.filter(item => item.JOIN_IS_CHECKIN == 1).length
				});
			}
		}

		ret.sort((a, b) => {
			if (a.start == b.start) return a.meetTitle > b.meetTitle ? 1 : -1;
			return a.start > b.start ? 1 : -1;
		});
		return ret;
	}

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

	async sendCourseRemind(meetId, timeMark) {
		let joinList = await JoinModel.getAllBig({
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: timeMark,
			JOIN_STATUS: JoinModel.STATUS.SUCC,
			JOIN_IS_CHECKIN: 0
		}, '*', {}, 1000);
		let sent = await NotifyService.sendCourseRemindBatch(joinList);
		return {
			total: joinList.length,
			sent
		};
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
		await NotifyService.sendLeaveResult(Object.assign({}, leave, data), LeaveModel.getDesc('STATUS', status));
	}

	_getChildInfo(forms) {
		let ret = {
			id: '',
			name: ''
		};
		for (let k in forms) {
			if (forms[k].mark == 'CHILD_ID') ret.id = forms[k].val || '';
			if (forms[k].mark == 'CHILD_NAME' || forms[k].title == '孩子姓名') ret.name = forms[k].val || '';
		}
		return ret;
	}

}

module.exports = AdminDaycareService;
