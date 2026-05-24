/**
 * Notes: 订单实体
 */

const BaseModel = require('./base_model.js');

class OrderModel extends BaseModel {}

OrderModel.CL = 'ax_order';

OrderModel.DB_STRUCTURE = {
	_pid: 'string|true',
	ORDER_ID: 'string|true',

	ORDER_USER_ID: 'string|true|comment=家长openid',
	ORDER_USER_NAME: 'string|false|comment=家长姓名',
	ORDER_CHILD_ID: 'string|false|comment=孩子ID',
	ORDER_CHILD_NAME: 'string|false|comment=孩子姓名',
	ORDER_PACKAGE_ID: 'string|false|comment=课程包ID',
	ORDER_PACKAGE_NAME: 'string|false|comment=课程包名称',
	ORDER_TITLE: 'string|true|comment=订单标题',
	ORDER_AMOUNT: 'int|true|default=0|comment=订单金额 分',
	ORDER_PAY_STATUS: 'int|true|default=1|comment=支付状态 0=待支付,1=已支付,8=已退款',
	ORDER_PAY_TYPE: 'string|false|comment=支付方式',
	ORDER_PAY_TIME: 'int|true|default=0|comment=支付时间',
	ORDER_REFUND_AMOUNT: 'int|true|default=0|comment=退款金额 分',
	ORDER_REFUND_TIME: 'int|true|default=0|comment=退款时间',
	ORDER_REFUND_REASON: 'string|false|comment=退款原因',
	ORDER_MEMO: 'string|false|comment=备注',

	ORDER_ADD_TIME: 'int|true',
	ORDER_EDIT_TIME: 'int|true',
	ORDER_ADD_IP: 'string|false',
	ORDER_EDIT_IP: 'string|false',
};

OrderModel.FIELD_PREFIX = 'ORDER_';

OrderModel.PAY_STATUS = {
	WAIT: 0,
	PAID: 1,
	REFUND: 8
};

OrderModel.PAY_STATUS_DESC = {
	WAIT: '待支付',
	PAID: '已支付',
	REFUND: '已退款'
};

module.exports = OrderModel;
