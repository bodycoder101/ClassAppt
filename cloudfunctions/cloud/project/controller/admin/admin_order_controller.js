/**
 * Notes: 财务运营后台控制器
 */

const BaseAdminController = require('./base_admin_controller.js');
const AdminOrderService = require('../../service/admin/admin_order_service.js');
const OrderModel = require('../../model/order_model.js');
const CoursePackageModel = require('../../model/course_package_model.js');
const CourseConsumeModel = require('../../model/course_consume_model.js');
const ContractModel = require('../../model/contract_model.js');
const timeUtil = require('../../../framework/utils/time_util.js');

class AdminOrderController extends BaseAdminController {

	async getFinanceStats() {
		await this.isAdmin();
		let service = new AdminOrderService();
		return await service.getFinanceStats();
	}

	async createOrder() {
		await this.isAdmin();
		let rules = {
			userId: 'must|string|name=家长openid',
			userName: 'string|max:30|name=家长姓名',
			childId: 'string|max:50|name=孩子ID',
			childName: 'string|max:30|name=孩子姓名',
			title: 'must|string|min:1|max:50|name=订单标题',
			amount: 'must|int|name=金额',
			packageName: 'string|max:50|name=课程包名称',
			packageType: 'string|max:20|name=课程包类型',
			totalTimes: 'int|name=课次',
			startDay: 'string|max:20|name=开始日期',
			endDay: 'string|max:20|name=结束日期',
			memo: 'string|max:200|name=备注',
		};
		let input = this.validateData(rules);
		let service = new AdminOrderService();
		return await service.createOrder(input);
	}

	async refund() {
		await this.isAdmin();
		let rules = {
			id: 'must|id',
			reason: 'string|max:100|name=退款原因',
		};
		let input = this.validateData(rules);
		let service = new AdminOrderService();
		await service.refund(input.id, input.reason);
	}

	async getOrderList() {
		await this.isAdmin();
		let input = this._getListInput();
		let service = new AdminOrderService();
		let result = await service.getOrderList(input);
		for (let k in result.list) {
			result.list[k].ORDER_PAY_STATUS_DESC = OrderModel.getDesc('PAY_STATUS', result.list[k].ORDER_PAY_STATUS);
			result.list[k].ORDER_ADD_TIME = timeUtil.timestamp2Time(result.list[k].ORDER_ADD_TIME);
			result.list[k].ORDER_PAY_TIME = result.list[k].ORDER_PAY_TIME ? timeUtil.timestamp2Time(result.list[k].ORDER_PAY_TIME) : '';
			result.list[k].ORDER_REFUND_TIME = result.list[k].ORDER_REFUND_TIME ? timeUtil.timestamp2Time(result.list[k].ORDER_REFUND_TIME) : '';
		}
		return result;
	}

	async getPackageList() {
		await this.isAdmin();
		let input = this._getListInput();
		let service = new AdminOrderService();
		let result = await service.getPackageList(input);
		for (let k in result.list) {
			result.list[k].PACKAGE_STATUS_DESC = CoursePackageModel.getDesc('STATUS', result.list[k].PACKAGE_STATUS);
			result.list[k].PACKAGE_ADD_TIME = timeUtil.timestamp2Time(result.list[k].PACKAGE_ADD_TIME);
		}
		return result;
	}

	async getConsumeList() {
		await this.isAdmin();
		let input = this._getListInput();
		let service = new AdminOrderService();
		let result = await service.getConsumeList(input);
		for (let k in result.list) {
			result.list[k].CONSUME_STATUS_DESC = CourseConsumeModel.getDesc('STATUS', result.list[k].CONSUME_STATUS);
			result.list[k].CONSUME_ADD_TIME = timeUtil.timestamp2Time(result.list[k].CONSUME_ADD_TIME);
		}
		return result;
	}

	async saveContract() {
		await this.isAdmin();
		let rules = {
			id: 'id',
			userId: 'must|string|name=家长openid',
			userName: 'string|max:30|name=家长姓名',
			childId: 'string|max:50|name=孩子ID',
			childName: 'string|max:30|name=孩子姓名',
			title: 'must|string|min:1|max:50|name=合同名称',
			no: 'string|max:50|name=合同编号',
			url: 'string|max:300|name=合同链接',
			signDay: 'string|max:20|name=签署日期',
			expireDay: 'string|max:20|name=到期日期',
			memo: 'string|max:200|name=备注',
		};
		let input = this.validateData(rules);
		let service = new AdminOrderService();
		return await service.saveContract(input);
	}

	async getContractList() {
		await this.isAdmin();
		let input = this._getListInput();
		let service = new AdminOrderService();
		let result = await service.getContractList(input);
		for (let k in result.list) {
			result.list[k].CONTRACT_STATUS_DESC = ContractModel.getDesc('STATUS', result.list[k].CONTRACT_STATUS);
			result.list[k].CONTRACT_ADD_TIME = timeUtil.timestamp2Time(result.list[k].CONTRACT_ADD_TIME);
		}
		return result;
	}

	async delContract() {
		await this.isAdmin();
		let rules = {
			id: 'must|id',
		};
		let input = this.validateData(rules);
		let service = new AdminOrderService();
		await service.delContract(input.id);
	}

	_getListInput() {
		let rules = {
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		};
		return this.validateData(rules);
	}
}

module.exports = AdminOrderController;
