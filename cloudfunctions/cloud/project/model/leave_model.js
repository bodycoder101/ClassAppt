/**
 * Notes: 请假申请实体
 */

const BaseModel = require('./base_model.js');

class LeaveModel extends BaseModel {}

LeaveModel.CL = 'ax_leave';

LeaveModel.DB_STRUCTURE = {
	_pid: 'string|true',
	LEAVE_ID: 'string|true',

	LEAVE_USER_ID: 'string|true|comment=家长openid',
	LEAVE_CHILD_ID: 'string|false|comment=孩子ID',
	LEAVE_CHILD_NAME: 'string|false|comment=孩子姓名',
	LEAVE_JOIN_ID: 'string|true|comment=预约ID',
	LEAVE_MEET_ID: 'string|true|comment=课程ID',
	LEAVE_MEET_TITLE: 'string|true|comment=课程标题',
	LEAVE_MEET_DAY: 'string|true|comment=上课日期',
	LEAVE_MEET_TIME_START: 'string|true|comment=开始时间',
	LEAVE_MEET_TIME_END: 'string|true|comment=结束时间',
	LEAVE_MEET_TIME_MARK: 'string|true|comment=时段标识',
	LEAVE_REASON: 'string|false|comment=请假原因',
	LEAVE_STATUS: 'int|true|default=0|comment=状态 0=待审核,1=已通过,8=已拒绝,10=已取消',
	LEAVE_ADMIN_ID: 'string|false|comment=处理管理员',
	LEAVE_ADMIN_NAME: 'string|false|comment=处理管理员',
	LEAVE_ADMIN_REASON: 'string|false|comment=处理备注',
	LEAVE_ADMIN_TIME: 'int|true|default=0|comment=处理时间',

	LEAVE_ADD_TIME: 'int|true',
	LEAVE_EDIT_TIME: 'int|true',
	LEAVE_ADD_IP: 'string|false',
	LEAVE_EDIT_IP: 'string|false',
};

LeaveModel.FIELD_PREFIX = 'LEAVE_';

LeaveModel.STATUS = {
	WAIT: 0,
	PASS: 1,
	REFUSE: 8,
	CANCEL: 10
};

LeaveModel.STATUS_DESC = {
	WAIT: '待审核',
	PASS: '已通过',
	REFUSE: '已拒绝',
	CANCEL: '已取消'
};

module.exports = LeaveModel;
