/**
 * Notes: 微信订阅消息通知
 */

const config = require('../../config/config.js');
const miniLib = require('../../framework/lib/mini_lib.js');

class NotifyService {

	static async sendJoinSuccess(join) {
		await this._sendJoin(join, 'JOIN_SUCCESS', join.JOIN_STATUS == 0 ? '预约已提交' : '预约成功');
	}

	static async sendJoinChange(join, note = '课程预约变更') {
		await this._sendJoin(join, 'JOIN_CHANGE', note);
	}

	static async sendLeaveResult(leave, note = '请假审批结果') {
		let templateId = this._getTemplateId('LEAVE_RESULT');
		if (!templateId || !leave || !leave.LEAVE_USER_ID) return;

		await miniLib.sendMiniOnceTempMsg({
			touser: leave.LEAVE_USER_ID,
			templateId,
			page: 'projects/A00/my/leave/my_leave',
			data: {
				thing1: {
					value: this._thing(leave.LEAVE_MEET_TITLE || '课程请假')
				},
				phrase2: {
					value: miniLib.fmtPhrase(note || '已处理')
				},
				time3: {
					value: this._time(leave.LEAVE_MEET_DAY, leave.LEAVE_MEET_TIME_START)
				},
				thing4: {
					value: this._thing(leave.LEAVE_ADMIN_REASON || leave.LEAVE_REASON || '请查看详情')
				}
			}
		}, 'leave_result');
	}

	static async sendCourseRemind(join) {
		let templateId = this._getTemplateId('COURSE_REMIND');
		if (!templateId || !join || !join.JOIN_USER_ID) return false;

		await miniLib.sendMiniOnceTempMsg({
			touser: join.JOIN_USER_ID,
			templateId,
			page: 'projects/A00/my/join_detail/my_join_detail?id=' + join._id,
			data: {
				thing1: {
					value: this._thing(join.JOIN_MEET_TITLE || '课程预约')
				},
				time2: {
					value: this._time(join.JOIN_MEET_DAY, join.JOIN_MEET_TIME_START)
				},
				thing3: {
					value: this._thing('课程即将开始')
				}
			}
		}, 'course_remind');
		return true;
	}

	static async sendCourseRemindBatch(joinList = []) {
		let sent = 0;
		for (let k in joinList) {
			if (await this.sendCourseRemind(joinList[k])) sent++;
		}
		return sent;
	}

	static async _sendJoin(join, templateKey, note) {
		let templateId = this._getTemplateId(templateKey);
		if (!templateId || !join || !join.JOIN_USER_ID) return;

		await miniLib.sendMiniOnceTempMsg({
			touser: join.JOIN_USER_ID,
			templateId,
			page: 'projects/A00/my/join_detail/my_join_detail?id=' + join._id,
			data: {
				thing1: {
					value: this._thing(join.JOIN_MEET_TITLE || '课程预约')
				},
				time2: {
					value: this._time(join.JOIN_MEET_DAY, join.JOIN_MEET_TIME_START)
				},
				thing3: {
					value: this._thing(note || '请查看详情')
				}
			}
		}, templateKey);
	}

	static _getTemplateId(key) {
		let templates = config.MINI_SUBSCRIBE_TEMPLATES || {};
		return templates[key] || '';
	}

	static _thing(str) {
		str = String(str || '请查看详情');
		return miniLib.fmtThing(str);
	}

	static _time(day, start) {
		return (day || '') + (start ? ' ' + start : '');
	}
}

module.exports = NotifyService;
