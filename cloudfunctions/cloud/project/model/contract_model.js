/**
 * Notes: 电子合同记录实体
 */

const BaseModel = require('./base_model.js');

class ContractModel extends BaseModel {}

ContractModel.CL = 'ax_contract';

ContractModel.DB_STRUCTURE = {
	_pid: 'string|true',
	CONTRACT_ID: 'string|true',

	CONTRACT_USER_ID: 'string|true|comment=家长openid',
	CONTRACT_USER_NAME: 'string|false|comment=家长姓名',
	CONTRACT_CHILD_ID: 'string|false|comment=孩子ID',
	CONTRACT_CHILD_NAME: 'string|false|comment=孩子姓名',
	CONTRACT_TITLE: 'string|true|comment=合同名称',
	CONTRACT_NO: 'string|false|comment=合同编号',
	CONTRACT_URL: 'string|false|comment=合同链接或云文件ID',
	CONTRACT_SIGN_DAY: 'string|false|comment=签署日期',
	CONTRACT_EXPIRE_DAY: 'string|false|comment=到期日期',
	CONTRACT_MEMO: 'string|false|comment=备注',
	CONTRACT_STATUS: 'int|true|default=1|comment=状态 1=有效,10=作废',

	CONTRACT_ADD_TIME: 'int|true',
	CONTRACT_EDIT_TIME: 'int|true',
	CONTRACT_ADD_IP: 'string|false',
	CONTRACT_EDIT_IP: 'string|false',
};

ContractModel.FIELD_PREFIX = 'CONTRACT_';

ContractModel.STATUS = {
	COMM: 1,
	CANCEL: 10
};

ContractModel.STATUS_DESC = {
	COMM: '有效',
	CANCEL: '作废'
};

module.exports = ContractModel;
