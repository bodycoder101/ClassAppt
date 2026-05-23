/**
 * Notes: 用户中心模块控制器
 * Date: 2021-03-15 19:20:00 
 */

const BaseController = require('./base_controller.js');
const ChildService = require('../service/child_service.js');
const ChildModel = require('../model/child_model.js');
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

}

module.exports = MyController;
