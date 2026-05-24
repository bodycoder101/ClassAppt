/**
 * Notes: 财务/课消/合同后台管理
 */

const BaseAdminService = require('./base_admin_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

const OrderModel = require('../../model/order_model.js');
const CoursePackageModel = require('../../model/course_package_model.js');
const CourseConsumeModel = require('../../model/course_consume_model.js');
const ContractModel = require('../../model/contract_model.js');
const JoinModel = require('../../model/join_model.js');
const MeetModel = require('../../model/meet_model.js');
const UserModel = require('../../model/user_model.js');

class AdminOrderService extends BaseAdminService {

	async getFinanceStats() {
		let orderList = await OrderModel.getAllBig({}, '*', {}, 5000);
		let consumeList = await CourseConsumeModel.getAllBig({
			CONSUME_STATUS: CourseConsumeModel.STATUS.COMM
		}, '*', {}, 5000);
		let joinList = await JoinModel.getAllBig({}, '*', {}, 5000);
		let meetList = await MeetModel.getAllBig({}, '_id,MEET_TITLE,MEET_TEACHER', {}, 1000);
		let meetMap = {};
		for (let k in meetList) meetMap[meetList[k]._id] = meetList[k];

		let paidAmount = 0;
		let refundAmount = 0;
		for (let k in orderList) {
			if (orderList[k].ORDER_PAY_STATUS == OrderModel.PAY_STATUS.PAID) paidAmount += Number(orderList[k].ORDER_AMOUNT || 0);
			if (orderList[k].ORDER_PAY_STATUS == OrderModel.PAY_STATUS.REFUND) refundAmount += Number(orderList[k].ORDER_REFUND_AMOUNT || orderList[k].ORDER_AMOUNT || 0);
		}

		let succCnt = 0;
		let checkinCnt = 0;
		let meetRank = {};
		let teacherRank = {};
		for (let k in joinList) {
			let join = joinList[k];
			if (join.JOIN_STATUS == JoinModel.STATUS.SUCC) succCnt++;
			if (join.JOIN_IS_CHECKIN == 1) checkinCnt++;
			if (!meetRank[join.JOIN_MEET_ID]) {
				meetRank[join.JOIN_MEET_ID] = {
					meetId: join.JOIN_MEET_ID,
					title: join.JOIN_MEET_TITLE,
					bookingCnt: 0,
					checkinCnt: 0
				};
			}
			meetRank[join.JOIN_MEET_ID].bookingCnt++;
			if (join.JOIN_IS_CHECKIN == 1) meetRank[join.JOIN_MEET_ID].checkinCnt++;

			let teacher = (meetMap[join.JOIN_MEET_ID] && meetMap[join.JOIN_MEET_ID].MEET_TEACHER) || '未设置';
			if (!teacherRank[teacher]) teacherRank[teacher] = {
				teacher,
				bookingCnt: 0,
				checkinCnt: 0
			};
			teacherRank[teacher].bookingCnt++;
			if (join.JOIN_IS_CHECKIN == 1) teacherRank[teacher].checkinCnt++;
		}

		let meetTop = Object.values(meetRank).sort((a, b) => b.bookingCnt - a.bookingCnt).slice(0, 10);
		let teacherTop = Object.values(teacherRank).sort((a, b) => b.bookingCnt - a.bookingCnt).slice(0, 10);

		return {
			orderCnt: orderList.length,
			paidAmount,
			refundAmount,
			netAmount: paidAmount - refundAmount,
			bookingCnt: joinList.length,
			succCnt,
			checkinCnt,
			consumeCnt: consumeList.length,
			attendanceRate: succCnt ? Math.round(checkinCnt * 10000 / succCnt) / 100 : 0,
			bookingRate: meetList.length ? Math.round(joinList.length * 100 / meetList.length) / 100 : 0,
			meetTop,
			teacherTop
		};
	}

	async getOrderList({
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
				ORDER_USER_NAME: ['like', search]
			}, {
				ORDER_CHILD_NAME: ['like', search]
			}, {
				ORDER_TITLE: ['like', search]
			}];
		} else if (sortType == 'pay') {
			where.ORDER_PAY_STATUS = Number(sortVal);
		}
		let orderBy = {
			ORDER_ADD_TIME: 'desc'
		};
		return await OrderModel.getList(where, '*', orderBy, page, size, isTotal, oldTotal);
	}

	async createOrder({
		userId,
		userName = '',
		childId = '',
		childName = '',
		title,
		amount,
		packageName = '',
		packageType = 'times',
		totalTimes = 0,
		startDay = '',
		endDay = '',
		memo = ''
	}) {
		let orderData = {
			ORDER_USER_ID: userId,
			ORDER_USER_NAME: userName,
			ORDER_CHILD_ID: childId,
			ORDER_CHILD_NAME: childName,
			ORDER_TITLE: title,
			ORDER_AMOUNT: Number(amount || 0),
			ORDER_PAY_STATUS: OrderModel.PAY_STATUS.PAID,
			ORDER_PAY_TYPE: 'manual',
			ORDER_PAY_TIME: timeUtil.time(),
			ORDER_MEMO: memo
		};
		let orderId = await OrderModel.insert(orderData);

		if (packageName || totalTimes) {
			let packageId = await CoursePackageModel.insert({
				PACKAGE_USER_ID: userId,
				PACKAGE_USER_NAME: userName,
				PACKAGE_CHILD_ID: childId,
				PACKAGE_CHILD_NAME: childName,
				PACKAGE_NAME: packageName || title,
				PACKAGE_TYPE: packageType,
				PACKAGE_TOTAL_TIMES: Number(totalTimes || 0),
				PACKAGE_LEFT_TIMES: Number(totalTimes || 0),
				PACKAGE_AMOUNT: Number(amount || 0),
				PACKAGE_ORDER_ID: orderId,
				PACKAGE_START_DAY: startDay,
				PACKAGE_END_DAY: endDay,
				PACKAGE_MEMO: memo,
				PACKAGE_STATUS: CoursePackageModel.STATUS.COMM
			});
			await OrderModel.edit(orderId, {
				ORDER_PACKAGE_ID: packageId,
				ORDER_PACKAGE_NAME: packageName || title
			});
		}
		return {
			id: orderId
		};
	}

	async refund(id, reason = '') {
		let order = await OrderModel.getOne(id);
		if (!order) this.AppError('订单不存在');
		if (order.ORDER_PAY_STATUS == OrderModel.PAY_STATUS.REFUND) return;

		await OrderModel.edit(id, {
			ORDER_PAY_STATUS: OrderModel.PAY_STATUS.REFUND,
			ORDER_REFUND_AMOUNT: order.ORDER_AMOUNT,
			ORDER_REFUND_TIME: timeUtil.time(),
			ORDER_REFUND_REASON: reason
		});
		if (order.ORDER_PACKAGE_ID) {
			await CoursePackageModel.edit(order.ORDER_PACKAGE_ID, {
				PACKAGE_STATUS: CoursePackageModel.STATUS.STOP
			});
		}
	}

	async getPackageList({
		search,
		page,
		size,
		isTotal = true,
		oldTotal = 0
	}) {
		let where = {};
		if (search) {
			where.or = [{
				PACKAGE_USER_NAME: ['like', search]
			}, {
				PACKAGE_CHILD_NAME: ['like', search]
			}, {
				PACKAGE_NAME: ['like', search]
			}];
		}
		return await CoursePackageModel.getList(where, '*', {
			PACKAGE_ADD_TIME: 'desc'
		}, page, size, isTotal, oldTotal);
	}

	async getConsumeList({
		search,
		page,
		size,
		isTotal = true,
		oldTotal = 0
	}) {
		let where = {};
		if (search) {
			where.or = [{
				CONSUME_CHILD_NAME: ['like', search]
			}, {
				CONSUME_MEET_TITLE: ['like', search]
			}];
		}
		return await CourseConsumeModel.getList(where, '*', {
			CONSUME_ADD_TIME: 'desc'
		}, page, size, isTotal, oldTotal);
	}

	async addConsumeByJoin(joinId) {
		let old = await CourseConsumeModel.getOne({
			CONSUME_JOIN_ID: joinId,
			CONSUME_STATUS: CourseConsumeModel.STATUS.COMM
		}, '_id');
		if (old) return old._id;

		let join = await JoinModel.getOne(joinId);
		if (!join || join.JOIN_STATUS != JoinModel.STATUS.SUCC) return '';
		let childInfo = this._getChildInfo(join.JOIN_FORMS || []);
		let packageId = await this._consumePackage(join.JOIN_USER_ID, childInfo.id, childInfo.name);
		return await CourseConsumeModel.insert({
			CONSUME_JOIN_ID: join._id,
			CONSUME_USER_ID: join.JOIN_USER_ID,
			CONSUME_CHILD_ID: childInfo.id,
			CONSUME_CHILD_NAME: childInfo.name,
			CONSUME_MEET_ID: join.JOIN_MEET_ID,
			CONSUME_MEET_TITLE: join.JOIN_MEET_TITLE,
			CONSUME_MEET_DAY: join.JOIN_MEET_DAY,
			CONSUME_MEET_TIME_START: join.JOIN_MEET_TIME_START,
			CONSUME_MEET_TIME_END: join.JOIN_MEET_TIME_END,
			CONSUME_MEET_TIME_MARK: join.JOIN_MEET_TIME_MARK,
			CONSUME_PACKAGE_ID: packageId,
			CONSUME_TIMES: 1,
			CONSUME_STATUS: CourseConsumeModel.STATUS.COMM
		});
	}

	async cancelConsumeByJoin(joinId) {
		let consume = await CourseConsumeModel.getOne({
			CONSUME_JOIN_ID: joinId,
			CONSUME_STATUS: CourseConsumeModel.STATUS.COMM
		});
		if (!consume) return;
		await CourseConsumeModel.edit(consume._id, {
			CONSUME_STATUS: CourseConsumeModel.STATUS.CANCEL
		});
		if (consume.CONSUME_PACKAGE_ID) {
			await CoursePackageModel.inc(consume.CONSUME_PACKAGE_ID, 'PACKAGE_LEFT_TIMES', consume.CONSUME_TIMES || 1);
		}
	}

	async saveContract({
		id = '',
		userId,
		userName = '',
		childId = '',
		childName = '',
		title,
		no = '',
		url = '',
		signDay = '',
		expireDay = '',
		memo = ''
	}) {
		let data = {
			CONTRACT_USER_ID: userId,
			CONTRACT_USER_NAME: userName,
			CONTRACT_CHILD_ID: childId,
			CONTRACT_CHILD_NAME: childName,
			CONTRACT_TITLE: title,
			CONTRACT_NO: no,
			CONTRACT_URL: url,
			CONTRACT_SIGN_DAY: signDay,
			CONTRACT_EXPIRE_DAY: expireDay,
			CONTRACT_MEMO: memo,
			CONTRACT_STATUS: ContractModel.STATUS.COMM
		};
		if (id) {
			await ContractModel.edit(id, data);
			return {
				id
			};
		}
		return {
			id: await ContractModel.insert(data)
		};
	}

	async getContractList({
		search,
		page,
		size,
		isTotal = true,
		oldTotal = 0
	}) {
		let where = {};
		if (search) {
			where.or = [{
				CONTRACT_USER_NAME: ['like', search]
			}, {
				CONTRACT_CHILD_NAME: ['like', search]
			}, {
				CONTRACT_TITLE: ['like', search]
			}, {
				CONTRACT_NO: ['like', search]
			}];
		}
		return await ContractModel.getList(where, '*', {
			CONTRACT_ADD_TIME: 'desc'
		}, page, size, isTotal, oldTotal);
	}

	async delContract(id) {
		await ContractModel.edit(id, {
			CONTRACT_STATUS: ContractModel.STATUS.CANCEL
		});
	}

	async _consumePackage(userId, childId, childName) {
		let where = {
			PACKAGE_USER_ID: userId,
			PACKAGE_STATUS: CoursePackageModel.STATUS.COMM,
			PACKAGE_LEFT_TIMES: ['>', 0]
		};
		if (childId) where.PACKAGE_CHILD_ID = childId;
		else if (childName) where.PACKAGE_CHILD_NAME = childName;
		let pkg = await CoursePackageModel.getOne(where, '_id,PACKAGE_LEFT_TIMES', {
			PACKAGE_ADD_TIME: 'asc'
		});
		if (!pkg) return '';
		await CoursePackageModel.inc(pkg._id, 'PACKAGE_LEFT_TIMES', -1);
		if (pkg.PACKAGE_LEFT_TIMES <= 1) {
			await CoursePackageModel.edit(pkg._id, {
				PACKAGE_STATUS: CoursePackageModel.STATUS.OVER
			});
		}
		return pkg._id;
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

module.exports = AdminOrderService;
