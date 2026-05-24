/**
 * Notes: 课程包/次卡实体
 */

const BaseModel = require('./base_model.js');

class CoursePackageModel extends BaseModel {}

CoursePackageModel.CL = 'ax_course_package';

CoursePackageModel.DB_STRUCTURE = {
	_pid: 'string|true',
	PACKAGE_ID: 'string|true',

	PACKAGE_USER_ID: 'string|true|comment=家长openid',
	PACKAGE_USER_NAME: 'string|false|comment=家长姓名',
	PACKAGE_CHILD_ID: 'string|false|comment=孩子ID',
	PACKAGE_CHILD_NAME: 'string|false|comment=孩子姓名',
	PACKAGE_NAME: 'string|true|comment=课程包名称',
	PACKAGE_TYPE: 'string|true|default=times|comment=类型 times=次卡,month=月卡,term=学期卡',
	PACKAGE_TOTAL_TIMES: 'int|true|default=0|comment=总课次',
	PACKAGE_LEFT_TIMES: 'int|true|default=0|comment=剩余课次',
	PACKAGE_AMOUNT: 'int|true|default=0|comment=金额 分',
	PACKAGE_ORDER_ID: 'string|false|comment=关联订单',
	PACKAGE_START_DAY: 'string|false|comment=开始日期',
	PACKAGE_END_DAY: 'string|false|comment=结束日期',
	PACKAGE_MEMO: 'string|false|comment=备注',
	PACKAGE_STATUS: 'int|true|default=1|comment=状态 1=有效,9=已用完,10=停用',

	PACKAGE_ADD_TIME: 'int|true',
	PACKAGE_EDIT_TIME: 'int|true',
	PACKAGE_ADD_IP: 'string|false',
	PACKAGE_EDIT_IP: 'string|false',
};

CoursePackageModel.FIELD_PREFIX = 'PACKAGE_';

CoursePackageModel.STATUS = {
	COMM: 1,
	OVER: 9,
	STOP: 10
};

CoursePackageModel.STATUS_DESC = {
	COMM: '有效',
	OVER: '已用完',
	STOP: '停用'
};

module.exports = CoursePackageModel;
