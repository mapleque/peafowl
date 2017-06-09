/**
 * all constant define
 */
(function(){
    if (typeof C === 'undefined') {
        C = {};
    }
    C.ENUM = {
        BTN_TYPE_ADD:'add',
        BTN_TYPE_UPDATE:'update',
        BTN_TYPE_DELETE:'delete',
        BTN_TYPE_GET:'get',

        PARAM_TYPE_HIDE:'hide',
        PARAM_TYPE_TEMPLATE:'template',
        PARAM_TYPE_STATIC:'static',
        PARAM_TYPE_TEXT:'text',
        PARAM_TYPE_RADIO:'radio',
        PARAM_TYPE_AREA:'area',
        PARAM_TYPE_DATE:'date',
        PARAM_TYPE_DATETIME:'datetime',
        PARAM_TYPE_PARENT:'parent',
        PARAM_TYPE_RANGE:'range',
        PARAM_TYPE_DATE_RANGE:'date_range',

        _DOC_:'enum elements'
    };
    C.MAP = {
        bool:{
            0:'否',
            1:'是'
        },
        sex:{
            0:'男',
            1:'女'
        },
        _DOC_:'map elements'
    };
    C.STATUS = {
        ERROR_SUCCESS:              0,
        ERROR_UNKONWN:              1,
        ERROR_DB:                   2,
        ERROR_INVALID_REQUEST:      3,
        ERROR_INVALID_PRIVILEGE:    999,
        _DOC_:'status elements'
    };
    C.PRIVILEGE = {
        TMP:          'tmp',
        _DOC_:'privilege elements'
    };
})();
