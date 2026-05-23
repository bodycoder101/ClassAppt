/**
 * Notes: 孩子档案实体
 */

const BaseModel = require('./base_model.js');

class ChildModel extends BaseModel {}

ChildModel.CL = 'ax_child';

ChildModel.DB_STRUCTURE = {
	_pid: 'string|true',
	CHILD_ID: 'string|true',

	CHILD_USER_ID: 'string|true|comment=家长openid',
	CHILD_NAME: 'string|true|comment=孩子姓名',
	CHILD_SEX: 'string|false|comment=性别',
	CHILD_BIRTHDAY: 'string|false|comment=生日',
	CHILD_CLASS: 'string|false|comment=班级',
	CHILD_MEMO: 'string|false|comment=备注',
	CHILD_STATUS: 'int|true|default=1|comment=状态 1=正常,10=删除',

	CHILD_ADD_TIME: 'int|true',
	CHILD_EDIT_TIME: 'int|true',
	CHILD_ADD_IP: 'string|false',
	CHILD_EDIT_IP: 'string|false',
};

ChildModel.FIELD_PREFIX = 'CHILD_';

ChildModel.STATUS = {
	COMM: 1,
	DEL: 10
};

ChildModel.STATUS_DESC = {
	COMM: '正常',
	DEL: '删除'
};

module.exports = ChildModel;
