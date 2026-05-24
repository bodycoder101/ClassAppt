/**
 * Notes: 课消记录实体
 */

const BaseModel = require('./base_model.js');

class CourseConsumeModel extends BaseModel {}

CourseConsumeModel.CL = 'ax_course_consume';

CourseConsumeModel.DB_STRUCTURE = {
	_pid: 'string|true',
	CONSUME_ID: 'string|true',

	CONSUME_JOIN_ID: 'string|true|comment=预约ID',
	CONSUME_USER_ID: 'string|true|comment=家长openid',
	CONSUME_CHILD_ID: 'string|false|comment=孩子ID',
	CONSUME_CHILD_NAME: 'string|false|comment=孩子姓名',
	CONSUME_MEET_ID: 'string|true|comment=课程ID',
	CONSUME_MEET_TITLE: 'string|true|comment=课程标题',
	CONSUME_MEET_DAY: 'string|true|comment=上课日期',
	CONSUME_MEET_TIME_START: 'string|true|comment=开始时间',
	CONSUME_MEET_TIME_END: 'string|true|comment=结束时间',
	CONSUME_MEET_TIME_MARK: 'string|true|comment=时段标识',
	CONSUME_PACKAGE_ID: 'string|false|comment=课程包ID',
	CONSUME_TIMES: 'int|true|default=1|comment=消耗课次',
	CONSUME_SOURCE: 'string|true|default=checkin|comment=来源',
	CONSUME_STATUS: 'int|true|default=1|comment=状态 1=已课消,10=已撤销',

	CONSUME_ADD_TIME: 'int|true',
	CONSUME_EDIT_TIME: 'int|true',
	CONSUME_ADD_IP: 'string|false',
	CONSUME_EDIT_IP: 'string|false',
};

CourseConsumeModel.FIELD_PREFIX = 'CONSUME_';

CourseConsumeModel.STATUS = {
	COMM: 1,
	CANCEL: 10
};

CourseConsumeModel.STATUS_DESC = {
	COMM: '已课消',
	CANCEL: '已撤销'
};

module.exports = CourseConsumeModel;
