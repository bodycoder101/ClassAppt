/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2021-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const MeetService = require('../meet_service.js');
const dataUtil = require('../../../framework/utils/data_util.js');
const timeUtil = require('../../../framework/utils/time_util.js');
const util = require('../../../framework/utils/util.js');
const cloudUtil = require('../../../framework/cloud/cloud_util.js');
const cloudBase = require('../../../framework/cloud/cloud_base.js');

const MeetModel = require('../../model/meet_model.js');
const JoinModel = require('../../model/join_model.js');
const DayModel = require('../../model/day_model.js');
const NotifyService = require('../notify_service.js');
const config = require('../../../config/config.js');

class AdminMeetService extends BaseAdminService {

	/** 预约数据列表 */
	async getDayList(meetId, start, end) {
		let where = {
			DAY_MEET_ID: meetId,
			day: ['between', start, end]
		}
		let orderBy = {
			day: 'asc'
		}
		return await DayModel.getAllBig(where, 'day,times,dayDesc', orderBy);
	}

	// 按项目统计人数
	async statJoinCntByMeet(meetId) {
		let today = timeUtil.time('Y-M-D');
		let where = {
			day: ['>=', today],
			DAY_MEET_ID: meetId
		}

		let meetService = new MeetService();
		let list = await DayModel.getAllBig(where, 'DAY_MEET_ID,times', {}, 1000);
		for (let k in list) {
			let meetId = list[k].DAY_MEET_ID;
			let times = list[k].times;

			for (let j in times) {
				let timeMark = times[j].mark;
				meetService.statJoinCnt(meetId, timeMark);
			}
		}
	}

	/** 自助签到码 */
	async genSelfCheckinQr(page, timeMark) {
		if (!timeMark) this.AppError('签到时段错误');
		page = page.replace(/^\//, '');

		const cloud = cloudBase.getCloud();
		let result = await cloud.openapi.wxacode.getUnlimited({
			scene: timeMark,
			width: 280,
			check_path: false,
			env_version: 'release',
			page
		});

		let upload = await cloud.uploadFile({
			cloudPath: config.MEET_TIMEMARK_QR_PATH + timeMark + '.png',
			fileContent: result.buffer,
		});

		if (!upload || !upload.fileID) this.AppError('签到码生成失败');
		return upload.fileID;
	}

	/** 管理员按钮核销 */
	async checkinJoin(joinId, flag) {
		let join = await JoinModel.getOne({
			_id: joinId,
			JOIN_STATUS: JoinModel.STATUS.SUCC
		}, 'JOIN_IS_CHECKIN');
		if (!join) this.AppError('未找到可核销的预约记录');

		await JoinModel.edit(joinId, {
			JOIN_IS_CHECKIN: Number(flag)
		});
	}

	/** 管理员扫码核销 */
	async scanJoin(meetId, code) {
		let join = await JoinModel.getOne({
			JOIN_MEET_ID: meetId,
			JOIN_CODE: code,
			JOIN_STATUS: JoinModel.STATUS.SUCC
		}, 'JOIN_IS_CHECKIN');
		if (!join) this.AppError('未找到可核销的预约记录');
		if (join.JOIN_IS_CHECKIN == 1) this.AppError('该预约已核销，无须重复操作');

		await JoinModel.edit(join._id, {
			JOIN_IS_CHECKIN: 1
		});
	}

	/**
	 * 判断本日是否有预约记录
	 * @param {*} daySet daysSet的节点
	 */
	checkHasJoinCnt(times) {
		if (!times) return false;
		for (let k in times) {
			if (times[k].stat.succCnt) return true;
		}
		return false;
	}

	// 判断含有预约的日期
	getCanModifyDaysSet(daysSet) {
		let now = timeUtil.time('Y-M-D');

		for (let k in daysSet) {
			if (daysSet[k].day < now) continue;
			daysSet[k].hasJoin = this.checkHasJoinCnt(daysSet[k].times);
		}

		return daysSet;
	}

	/** 取消某个时间段的所有预约记录 */
	async cancelJoinByTimeMark(admin, meetId, timeMark, reason) {
		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: timeMark,
			JOIN_STATUS: ['in', [JoinModel.STATUS.WAIT, JoinModel.STATUS.SUCC]]
		};
		let joinList = await JoinModel.getAllBig(where, '*', {}, 1000);
		let data = this._getAdminJoinEditData(admin, JoinModel.STATUS.ADMIN_CANCEL, reason);
		data.JOIN_STATUS = JoinModel.STATUS.ADMIN_CANCEL;
		data.JOIN_IS_CHECKIN = 0;

		await JoinModel.edit(where, data);
		for (let k in joinList) {
			await NotifyService.sendJoinChange(Object.assign({}, joinList[k], data), '课程时段已取消');
		}
		return await this._statJoinCnt(meetId, timeMark);
	}


	/**添加 */
	async insertMeet(adminId, {
		title,
		order,
		typeId,
		typeName,
		daysSet,
		isShowLimit,
		formSet,
		teacher = '',
		place = '',
		age = '',
		className = '',
		courseMode = 'single',
		needCheck = 0,
	}) {

		let daysSetData = this._normalizeDaysSet(daysSet);

		let data = {
			MEET_ADMIN_ID: adminId,
			MEET_TITLE: title,
			MEET_TYPE_ID: typeId,
			MEET_TYPE_NAME: typeName,
			MEET_ORDER: order,
			MEET_DAYS: dataUtil.getArrByKey(daysSetData, 'day'),
			MEET_IS_SHOW_LIMIT: isShowLimit,
			MEET_FORM_SET: formSet,
			MEET_TEACHER: teacher,
			MEET_PLACE: place,
			MEET_AGE: age,
			MEET_CLASS: className,
			MEET_COURSE_MODE: courseMode,
			MEET_NEED_CHECK: needCheck,
		};

		let id = await MeetModel.insert(data);
		await this._editDays(id, '', daysSetData);

		return {
			id
		};
	}

	/**删除数据 */
	async delMeet(id) {
		let meet = await MeetModel.getOne(id);
		if (!meet) return;

		await this._deleteMeetFiles(meet);
		await JoinModel.del({
			JOIN_MEET_ID: id
		});
		await DayModel.del({
			DAY_MEET_ID: id
		});
		await MeetModel.del(id);
	}

	/**获取信息 */
	async getMeetDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let meet = await MeetModel.getOne(where, fields);
		if (!meet) return null;

		let meetService = new MeetService();
		meet.MEET_DAYS_SET = await meetService.getDaysSet(id, null); //后台编辑需要带出历史日期以避免保存时丢失

		return meet;
	}

	/**
	 * 更新富文本详细的内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateMeetContent({
		meetId,
		content // 富文本数组
	}) {

		let meet = await MeetModel.getOne(meetId, 'MEET_CONTENT');
		if (!meet) this.AppError('预约项目不存在');

		content = await cloudUtil.handlerCloudFilesByRichEditor(meet.MEET_CONTENT || [], content || []);
		await MeetModel.edit(meetId, {
			MEET_CONTENT: content
		});

		return content;

	}

	/**
	 * 更新封面内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateMeetStyleSet({
		meetId,
		styleSet
	}) {

		let meet = await MeetModel.getOne(meetId, 'MEET_STYLE_SET');
		if (!meet) this.AppError('预约项目不存在');

		let oldPic = meet.MEET_STYLE_SET && meet.MEET_STYLE_SET.pic ? [meet.MEET_STYLE_SET.pic] : [];
		let newPic = styleSet && styleSet.pic ? [styleSet.pic] : [];
		await cloudUtil.handlerCloudFiles(oldPic, newPic);

		await MeetModel.edit(meetId, {
			MEET_STYLE_SET: styleSet || {}
		});

		return styleSet || {};

	}

	/** 更新日期设置 */
	async _editDays(meetId, nowDay, daysSetData) {
		let where = {
			DAY_MEET_ID: meetId
		};
		if (nowDay) where.day = ['>=', nowDay];
		await DayModel.del(where);

		let list = [];
		for (let k in daysSetData) {
			let node = daysSetData[k];
			if (nowDay && node.day < nowDay) continue;
			list.push({
				DAY_MEET_ID: meetId,
				day: node.day,
				dayDesc: node.dayDesc || timeUtil.fmtDateCHN(node.day),
				times: node.times || []
			});
		}
		if (list.length > 0) await DayModel.insertBatch(list);
	}

	/**更新数据 */
	async editMeet({
		id,
		title,
		typeId,
		typeName,
		order,
		daysSet,
		isShowLimit,
		formSet,
		teacher = '',
		place = '',
		age = '',
		className = '',
		courseMode = 'single',
		needCheck = 0,
	}) {
		let meet = await MeetModel.getOne(id, 'MEET_TITLE');
		if (!meet) this.AppError('预约项目不存在');

		let daysSetData = this._normalizeDaysSet(daysSet);
		let nowDay = timeUtil.time('Y-M-D');
		await this._editDays(id, nowDay, daysSetData);

		let data = {
			MEET_TITLE: title,
			MEET_TYPE_ID: typeId,
			MEET_TYPE_NAME: typeName,
			MEET_ORDER: order,
			MEET_DAYS: dataUtil.getArrByKey(daysSetData, 'day'),
			MEET_IS_SHOW_LIMIT: isShowLimit,
			MEET_FORM_SET: formSet,
			MEET_TEACHER: teacher,
			MEET_PLACE: place,
			MEET_AGE: age,
			MEET_CLASS: className,
			MEET_COURSE_MODE: courseMode,
			MEET_NEED_CHECK: needCheck,
		};

		await MeetModel.edit(id, data);

	}

	/**预约名单分页列表 */
	async getJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		meetId,
		mark,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'JOIN_EDIT_TIME': 'desc'
		};
		let fields = 'JOIN_IS_CHECKIN,JOIN_CODE,JOIN_ID,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_STATUS,JOIN_EDIT_TIME';

		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: mark
		};
		if (util.isDefined(search) && search) {
			where['JOIN_FORMS.val'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					sortVal = Number(sortVal);
		if (sortVal == 1099) //取消的2种
						where.JOIN_STATUS = ['in', [10, 99]]
					else
						where.JOIN_STATUS = Number(sortVal);
					break;
				case 'checkin':
					// 签到
					where.JOIN_STATUS = JoinModel.STATUS.SUCC;
					if (sortVal == 1) {
						where.JOIN_IS_CHECKIN = 1;
					} else {
						where.JOIN_IS_CHECKIN = 0;
					}
					break;
			}
		}

		return await JoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**预约项目分页列表 */
	async getMeetList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'MEET_ORDER': 'asc',
			'MEET_ADD_TIME': 'desc'
		};
		let fields = 'MEET_TYPE,MEET_TYPE_NAME,MEET_TITLE,MEET_TEACHER,MEET_PLACE,MEET_AGE,MEET_CLASS,MEET_STATUS,MEET_DAYS,MEET_ADD_TIME,MEET_EDIT_TIME,MEET_ORDER';

		let where = {};
		if (util.isDefined(search) && search) {
			where.MEET_TITLE = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					where.MEET_STATUS = Number(sortVal);
					break;
				case 'typeId':
					// 按类型
					where.MEET_TYPE_ID = sortVal;
					break;
				case 'sort':
					// 排序
					if (sortVal == 'view') {
						orderBy = {
							'MEET_VIEW_CNT': 'desc',
							'MEET_ADD_TIME': 'desc'
						};
					}

					break;
			}
		}

		return await MeetModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 删除 */
	async delJoin(joinId) {
		let join = await JoinModel.getOne(joinId, 'JOIN_MEET_ID,JOIN_MEET_TIME_MARK');
		if (!join) return;

		await JoinModel.del(joinId);
		return await this._statJoinCnt(join.JOIN_MEET_ID, join.JOIN_MEET_TIME_MARK);
	}

	/**修改报名状态 
	 * 特殊约定 99=>正常取消 
	 */
	async statusJoin(admin, joinId, status, reason = '') {
		status = Number(status);
		let join = await JoinModel.getOne(joinId, '*');
		if (!join) this.AppError('预约记录不存在');

		if (status == JoinModel.STATUS.SUCC && join.JOIN_STATUS != JoinModel.STATUS.SUCC && join.JOIN_STATUS != JoinModel.STATUS.WAIT) {
			let meetService = new MeetService();
			await meetService.checkMeetTimeControll(await meetService.getMeetOneDay(
				join.JOIN_MEET_ID,
				meetService.getDayByTimeMark(join.JOIN_MEET_TIME_MARK), {
					_id: join.JOIN_MEET_ID
				}
			), join.JOIN_MEET_TIME_MARK);
		}

		let data = this._getAdminJoinEditData(admin, status, reason);
		data.JOIN_STATUS = status;
		if (status != JoinModel.STATUS.SUCC) data.JOIN_IS_CHECKIN = 0;

		await JoinModel.edit(joinId, data);
		await NotifyService.sendJoinChange(Object.assign({}, join, data), JoinModel.getDesc('STATUS', status));
		return await this._statJoinCnt(join.JOIN_MEET_ID, join.JOIN_MEET_TIME_MARK);
	}

	/**修改项目状态 */
	async statusMeet(id, status) {
		await MeetModel.edit(id, {
			MEET_STATUS: Number(status)
		});
	}

	/**置顶排序设定 */
	async sortMeet(id, sort) {
		await MeetModel.edit(id, {
			MEET_ORDER: Number(sort)
		});
	}

	_getAdminJoinEditData(admin, status, reason = '') {
		return {
			JOIN_EDIT_ADMIN_ID: admin.ADMIN_ID || admin._id || '',
			JOIN_EDIT_ADMIN_NAME: admin.ADMIN_NAME || admin.name || '',
			JOIN_EDIT_ADMIN_TIME: timeUtil.time(),
			JOIN_EDIT_ADMIN_STATUS: Number(status),
			JOIN_REASON: reason || ''
		};
	}

	_normalizeDaysSet(daysSet = []) {
		let days = [];
		for (let k in daysSet) {
			let dayNode = dataUtil.deepClone(daysSet[k]);
			if (!dayNode.day) continue;
			dayNode.times = dayNode.times || [];

			for (let j in dayNode.times) {
				let timeNode = dayNode.times[j];
				timeNode.isLimit = !!timeNode.isLimit;
				timeNode.limit = Number(timeNode.limit || 0);
				timeNode.status = Number(util.isDefined(timeNode.status) ? timeNode.status : 1);
				timeNode.stat = timeNode.stat || {};
				timeNode.stat.waitCheckCnt = Number(timeNode.stat.waitCheckCnt || 0);
				timeNode.stat.succCnt = Number(timeNode.stat.succCnt || 0);
				timeNode.stat.refuseCnt = Number(timeNode.stat.refuseCnt || 0);
				timeNode.stat.cancelCnt = Number(timeNode.stat.cancelCnt || 0);
				timeNode.stat.adminCancelCnt = Number(timeNode.stat.adminCancelCnt || 0);
			}
			days.push(dayNode);
		}
		return days;
	}

	async _statJoinCnt(meetId, timeMark) {
		let whereJoin = {
			JOIN_MEET_TIME_MARK: timeMark,
			JOIN_MEET_ID: meetId
		};
		let ret = await JoinModel.groupCount(whereJoin, 'JOIN_STATUS');
		ret = ret || {};

		let stat = {
			waitCheckCnt: ret['JOIN_STATUS_0'] || 0,
			succCnt: ret['JOIN_STATUS_1'] || 0,
			refuseCnt: ret['JOIN_STATUS_8'] || 0,
			cancelCnt: ret['JOIN_STATUS_10'] || 0,
			adminCancelCnt: ret['JOIN_STATUS_99'] || 0
		};

		let whereDay = {
			DAY_MEET_ID: meetId,
			day: timeMark.substr(1, 4) + '-' + timeMark.substr(5, 2) + '-' + timeMark.substr(7, 2)
		};
		let day = await DayModel.getOne(whereDay, 'times');
		if (!day) return stat;

		let times = day.times;
		for (let j in times) {
			if (times[j].mark === timeMark) {
				await DayModel.edit(whereDay, {
					['times.' + j + '.stat']: stat
				});
				break;
			}
		}
		return stat;
	}

	async _deleteMeetFiles(meet) {
		let files = [];
		if (meet.MEET_STYLE_SET && meet.MEET_STYLE_SET.pic) files.push(meet.MEET_STYLE_SET.pic);
		for (let k in meet.MEET_CONTENT || []) {
			if (meet.MEET_CONTENT[k].type == 'img' && meet.MEET_CONTENT[k].val) files.push(meet.MEET_CONTENT[k].val);
		}
		await cloudUtil.deleteFiles(files);
	}
}

module.exports = AdminMeetService;
