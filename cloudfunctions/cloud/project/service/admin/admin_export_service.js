/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2022-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

const MeetModel = require('../../model/meet_model.js');
const JoinModel = require('../../model/join_model.js');
const UserModel = require('../../model/user_model.js');

const DataService = require('./../data_service');

// 导出报名数据KEY
const EXPORT_JOIN_DATA_KEY = 'join_data';

// 导出用户数据KEY
const EXPORT_USER_DATA_KEY = 'user_data';

class AdminExportService extends BaseAdminService {
	// #####################导出报名数据
	/**获取报名数据 */
	async getJoinDataURL() {
		let dataService = new DataService();
		return await dataService.getExportDataURL(EXPORT_JOIN_DATA_KEY);
	}

	/**删除报名数据 */
	async deleteJoinDataExcel() {
		let dataService = new DataService();
		return await dataService.deleteDataExcel(EXPORT_JOIN_DATA_KEY);
	}

	// 根据表单提取数据
	_getValByForm(arr, mark, title) {
		for (let k in arr) {
			if (arr[k].mark == mark) return arr[k].val;
			if (arr[k].title == title) return arr[k].val;
		}

		return '';
	}

	/**导出报名数据 */
	async exportJoinDataExcel({
		meetId,
		startDay,
		endDay,
		status
	}) {
		let meet = await MeetModel.getOne(meetId, 'MEET_TITLE,MEET_FORM_SET');
		if (!meet) this.AppError('预约项目不存在');

		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_DAY: ['between', startDay, endDay]
		};
		if (Number(status) != 999) where.JOIN_STATUS = Number(status);

		let orderBy = {
			JOIN_MEET_DAY: 'asc',
			JOIN_MEET_TIME_START: 'asc',
			JOIN_ADD_TIME: 'asc'
		};
		let fields = 'JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_STATUS,JOIN_IS_CHECKIN,JOIN_CODE,JOIN_REASON,JOIN_FORMS,JOIN_ADD_TIME';
		let list = await JoinModel.getAllBig(where, fields, orderBy, 1000);

		let formSet = meet.MEET_FORM_SET || [];
		let header = ['课程', '日期', '开始时间', '结束时间', '状态', '签到', '核销码', '原因', '预约时间'];
		for (let k in formSet) header.push(formSet[k].title);

		let data = [header];
		for (let k in list) {
			let row = [
				list[k].JOIN_MEET_TITLE,
				list[k].JOIN_MEET_DAY,
				list[k].JOIN_MEET_TIME_START,
				list[k].JOIN_MEET_TIME_END,
				JoinModel.getDesc('STATUS', list[k].JOIN_STATUS),
				list[k].JOIN_IS_CHECKIN == 1 ? '已签到' : '未签到',
				list[k].JOIN_CODE,
				list[k].JOIN_REASON || '',
				timeUtil.timestamp2Time(list[k].JOIN_ADD_TIME)
			];
			for (let j in formSet) {
				row.push(this._getValByForm(list[k].JOIN_FORMS || [], formSet[j].mark, formSet[j].title));
			}
			data.push(row);
		}

		return await new DataService().exportDataExcel(EXPORT_JOIN_DATA_KEY, meet.MEET_TITLE + '预约名单', list.length, data);

	}


	// #####################导出用户数据

	/**获取用户数据 */
	async getUserDataURL() {
		let dataService = new DataService();
		return await dataService.getExportDataURL(EXPORT_USER_DATA_KEY);
	}

	/**删除用户数据 */
	async deleteUserDataExcel() {
		let dataService = new DataService();
		return await dataService.deleteDataExcel(EXPORT_USER_DATA_KEY);
	}

	/**导出用户数据 */
	async exportUserDataExcel(condition) {

		let where = {};
		if (condition) {
			try {
				where = JSON.parse(decodeURIComponent(condition));
			} catch (ex) {
				this.AppError('导出条件错误');
			}
		}

		let orderBy = {
			USER_ADD_TIME: 'desc'
		};
		let list = await UserModel.getAllBig(where, '*', orderBy, 1000);

		let data = [
			['姓名', '手机', '状态', '登录次数', '最近登录时间', '注册时间', '备注/单位', '城市', '职业领域']
		];
		for (let k in list) {
			data.push([
				list[k].USER_NAME || '',
				list[k].USER_MOBILE || '',
				UserModel.getDesc('STATUS', list[k].USER_STATUS),
				list[k].USER_LOGIN_CNT || 0,
				list[k].USER_LOGIN_TIME ? timeUtil.timestamp2Time(list[k].USER_LOGIN_TIME) : '',
				timeUtil.timestamp2Time(list[k].USER_ADD_TIME),
				list[k].USER_WORK || '',
				list[k].USER_CITY || '',
				list[k].USER_TRADE || ''
			]);
		}

		return await new DataService().exportDataExcel(EXPORT_USER_DATA_KEY, '用户数据', list.length, data);

	}
}

module.exports = AdminExportService;
