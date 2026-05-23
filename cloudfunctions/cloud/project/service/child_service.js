/**
 * Notes: 孩子档案与请假业务
 */

const BaseService = require('./base_service.js');

const ChildModel = require('../model/child_model.js');

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

}

module.exports = ChildService;
