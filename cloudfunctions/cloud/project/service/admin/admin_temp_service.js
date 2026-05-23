/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2021-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const TempModel = require('../../model/temp_model.js');

class AdminTempService extends BaseAdminService {

	/**添加模板 */
	async insertTemp({
		name,
		times,
	}) {
		let data = {
			TEMP_NAME: name,
			TEMP_TIMES: this._normalizeTimes(times)
		};
		return await TempModel.insert(data);
	}

	/**更新数据 */
	async editTemp({
		id,
		limit,
		isLimit
	}) {
		let temp = await TempModel.getOne(id, 'TEMP_TIMES');
		if (!temp) this.AppError('模板不存在');

		let times = temp.TEMP_TIMES || [];
		for (let k in times) {
			times[k].isLimit = !!isLimit;
			times[k].limit = Number(limit);
		}
		await TempModel.edit(id, {
			TEMP_TIMES: times
		});

		return await this.getTempList();
	}


	/**删除数据 */
	async delTemp(id) {
		await TempModel.del(id);
	}


	/**分页列表 */
	async getTempList() {
		let orderBy = {
			'TEMP_ADD_TIME': 'desc'
		};
		let fields = 'TEMP_NAME,TEMP_TIMES';

		let where = {};
		return await TempModel.getAll(where, fields, orderBy);
	}

	_normalizeTimes(times = []) {
		let list = [];
		for (let k in times) {
			list.push({
				start: times[k].start,
				end: times[k].end,
				isLimit: !!times[k].isLimit,
				limit: Number(times[k].limit || 0)
			});
		}
		return list;
	}
}

module.exports = AdminTempService;
