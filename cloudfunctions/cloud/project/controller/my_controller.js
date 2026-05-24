/**
 * Notes: 用户中心模块控制器
 * Date: 2021-03-15 19:20:00 
 */

const BaseController = require('./base_controller.js');
const ChildService = require('../service/child_service.js');
const ChildModel = require('../model/child_model.js');
const LeaveModel = require('../model/leave_model.js');
const JoinModel = require('../model/join_model.js');
const CoursePackageModel = require('../model/course_package_model.js');
const CourseConsumeModel = require('../model/course_consume_model.js');
const ContractModel = require('../model/contract_model.js');
const timeUtil = require('../../framework/utils/time_util.js');

class MyController extends BaseController {

	async getChildList() {
		let service = new ChildService();
		let list = await service.getChildList(this._userId);
		for (let k in list) {
			list[k].CHILD_STATUS_DESC = ChildModel.getDesc('STATUS', list[k].CHILD_STATUS);
			list[k].CHILD_ADD_TIME = timeUtil.timestamp2Time(list[k].CHILD_ADD_TIME);
		}
		return list;
	}

	async saveChild() {
		let rules = {
			id: 'id',
			name: 'must|string|min:1|max:30|name=孩子姓名',
			sex: 'string|max:10|name=性别',
			birthday: 'string|max:20|name=生日',
			className: 'string|max:30|name=班级',
			memo: 'string|max:200|name=备注',
		};
		let input = this.validateData(rules);
		let service = new ChildService();
		return await service.saveChild(this._userId, input);
	}

	async delChild() {
		let rules = {
			id: 'must|id',
		};
		let input = this.validateData(rules);
		let service = new ChildService();
		await service.delChild(this._userId, input.id);
	}

	async getChildRecord() {
		let rules = {
			id: 'must|id',
		};
		let input = this.validateData(rules);
		let service = new ChildService();
		let result = await service.getChildRecord(this._userId, input.id);

		for (let k in result.joinList) {
			result.joinList[k].JOIN_STATUS_DESC = JoinModel.getDesc('STATUS', result.joinList[k].JOIN_STATUS);
			result.joinList[k].JOIN_ADD_TIME = timeUtil.timestamp2Time(result.joinList[k].JOIN_ADD_TIME, 'Y-M-D h:m');
			result.joinList[k].JOIN_MEET_DAY_DESC = timeUtil.fmtDateCHN(result.joinList[k].JOIN_MEET_DAY) + ' (' + timeUtil.week(result.joinList[k].JOIN_MEET_DAY) + ')';
		}
		for (let k in result.leaveList) {
			result.leaveList[k].LEAVE_STATUS_DESC = LeaveModel.getDesc('STATUS', result.leaveList[k].LEAVE_STATUS);
			result.leaveList[k].LEAVE_ADD_TIME = timeUtil.timestamp2Time(result.leaveList[k].LEAVE_ADD_TIME, 'Y-M-D h:m');
			result.leaveList[k].LEAVE_MEET_DAY_DESC = timeUtil.fmtDateCHN(result.leaveList[k].LEAVE_MEET_DAY) + ' (' + timeUtil.week(result.leaveList[k].LEAVE_MEET_DAY) + ')';
		}
		for (let k in result.packageList) {
			result.packageList[k].PACKAGE_STATUS_DESC = CoursePackageModel.getDesc('STATUS', result.packageList[k].PACKAGE_STATUS);
		}
		for (let k in result.consumeList) {
			result.consumeList[k].CONSUME_STATUS_DESC = CourseConsumeModel.getDesc('STATUS', result.consumeList[k].CONSUME_STATUS);
			result.consumeList[k].CONSUME_ADD_TIME = timeUtil.timestamp2Time(result.consumeList[k].CONSUME_ADD_TIME, 'Y-M-D h:m');
		}
		for (let k in result.contractList) {
			result.contractList[k].CONTRACT_STATUS_DESC = ContractModel.getDesc('STATUS', result.contractList[k].CONTRACT_STATUS);
		}

		return result;
	}

	async applyLeave() {
		let rules = {
			joinId: 'must|id',
			reason: 'string|max:200|name=请假原因',
		};
		let input = this.validateData(rules);
		let service = new ChildService();
		return await service.applyLeave(this._userId, input);
	}

	async getLeaveList() {
		let rules = {
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		};
		let input = this.validateData(rules);
		let service = new ChildService();
		let result = await service.getMyLeaveList(this._userId, input);
		for (let k in result.list) {
			result.list[k].LEAVE_STATUS_DESC = LeaveModel.getDesc('STATUS', result.list[k].LEAVE_STATUS);
			result.list[k].LEAVE_ADD_TIME = timeUtil.timestamp2Time(result.list[k].LEAVE_ADD_TIME);
		}
		return result;
	}

	async cancelLeave() {
		let rules = {
			id: 'must|id',
		};
		let input = this.validateData(rules);
		let service = new ChildService();
		await service.cancelLeave(this._userId, input.id);
	}

}

module.exports = MyController;
