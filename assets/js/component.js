/**
 * all component define
 */
(function(){

    // http
    if (typeof H === 'undefined') {
        H = {};
    }
    /**
     * @param url <string>
     * @param param {<key>:<form_bean>, ...} | [ <form bean>, ... ]
     *      <form_bean> = {
     *          name:<string>, // name of input
     *          type:C.ENUM.PARAM_TYPE_*, // type of input, default TEXT
     *          parse:<function()>, // parse function after collect on page
     *          depend:<bool>, // if false not include
     *      }
     * @param successFn <function>
     * @param errorFn <function>
     */
    H.action = function(method, url, param, successFn, errorFn) {
        R.loading(true);
        var buildOne = function(formBean){
            if (typeof formBean !== 'object') {
                return null;
            }
            if (formBean.depend === false) {
                return null;
            }
            if (typeof formBean.type === 'undefined') {
                return null;
            }
            if (formBean.type == C.ENUM.PARAM_TYPE_STATIC) {
                var ret = {};
                _.extend(ret, formBean);
                delete(ret.type);
                if (typeof ret.parse === 'function') {
                    ret.value = ret.parse(ret.value);
                    delete(ret.parse);
                }
                return ret;
            }
            var value;
            if (typeof formBean.multiple == 'function') {
                value = formBean.multiple();
            } else {
                switch (formBean.type) {
                    case C.ENUM.PARAM_TYPE_AREA:
                        value = $('textarea[name='+formBean.name+']').val();
                        break;
                    case C.ENUM.PARAM_TYPE_RADIO:
                    case C.ENUM.PARAM_TYPE_FILTER_RADIO:
                        value = $('input[name='+formBean.name+']:checked').val();
                        break;
                    case C.ENUM.PARAM_TYPE_TEXT:
                    default:
                        value = $('input[name='+formBean.name+']').val();
                }
            }
            if (typeof formBean.parse === 'function') {
                value = formBean.parse(value);
            }
            if (formBean.type === C.ENUM.PARAM_TYPE_FILTER_TEXT
                    || formBean.type === C.ENUM.PARAM_TYPE_FILTER_RADIO) {
                if (value && value != '') {
                    return {
                        name:formBean.name,
                        value:value
                    };
                } else {
                    return null;
                }
            }
            var ret = {};
            if (value && value != '') {
                ret[formBean.name] = value;
            }
            return ret;
        };
        var buildParam = function(param){
            var result = {};
            if (typeof param !== 'object') {
                return result;
            }
            _.map(param, function(ele){
                if (ele.type === C.ENUM.PARAM_TYPE_ARRAY) {
                    _.map(ele.value, function(item){
                        var ret = buildOne(item);
                        if (!_.isEmpty(ret)) {
                            if (typeof result[ele.name] === 'undefined') {
                                result[ele.name] = [];
                            }
                            result[ele.name].push(ret);
                        }
                    });
                } else if (ele === C.ENUM.PARAM_TYPE_PARENT) {
                        var ret = buildParam(ele.value);
                        if (!_.isEmpty(ret)) {
                            result[ele.name] = ret;
                        }
                } else {
                    var ret = buildOne(ele);
                    if (!_.isEmpty(ret)) {
                        _.extend(result, ret);
                    }
                }
            })
            return result;
        };
        var data = buildParam(param);
        var info = S.get('info');
        if (info) {
            //data.token = info.token;
            url += '?token=' + info.token;
        } else {
            url += '?token=';
        }
        console.log('[send]', url, JSON.stringify(data));
        var method = method.toUpperCase();
        if (method === 'GET') {
            var search = [];
            _.map(data, function(value, key){
                search.push(key + '=' + JSON.stringify(value));
            })
            data = null;
            url += '&' + search.join('&');
        }
        $.ajax({
            url:url,
            type:method,
            data:data,
            success:function(res){
                console.log('[recv]', url, res);
                R.loading(false);
                if (typeof res !== 'object') {
                    typeof errorFn === 'function' ? errorFn(res) : alert('server error, '+res+'');
                }
                if (res.code == C.STATUS.SUCCESS) {
                    successFn(res.data);
                } else if (res.code == C.STATUS.INVALID_TOKEN) {
                    var href = U.parseUrl().href;
                    U.logout(encodeURIComponent(href));
                } else if (res.code == C.STATUS.INVALID_PRIVILEGE) {
                    alert(res.msg);
                } else {
                    typeof errorFn === 'function' ? errorFn(res) : alert('server error, '+res.code+','+res.msg);
                }
            },
            error:function(res){
                R.loading(false);
                console.error('[error]', url, res);
                typeof errorFn === 'function' ? errorFn(res) : alert('server error!');
            }
        });
    };

    // util
    if (typeof U === 'undefined') {
        U = {};
    }
    U.parseDatetime = function(date){
        var formatInt = function(v){
            return v < 10 ? ('0' + v) : v;
        };
        return date.getFullYear() + '-'
            + formatInt(date.getMonth()+1) + '-'
            + formatInt(date.getDate()) + ' '
            + formatInt(date.getHours()) + ':'
            + formatInt(date.getMinutes()) + ':'
            + formatInt(date.getSeconds());
    };
    U.parseUrl = function() {
        var pu = function(str){
            var self = this;
            self.get = function(key){
                if (!key && key == '') {
                    return str;
                }
                if (str.length > 0) {
                    str = str.substring(1);
                }
                var arr = str.split('&');
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].indexOf(key+'=') == 0) {
                        return arr[i].substring(key.length+1);
                    }
                }
                return null;
            };
        };
        return {
            search:new pu(window.location.search),
            hash:new pu(window.location.hash),
            path:window.location.pathname,
            protocal:window.location.protocal,
            host:window.location.hostname,
            port:window.location.port,
            href:window.location.href
        };
    };
    U.go = function(url){
        window.location.href = url;
    };
    U.logout = function(redirect) {
        // TODO del token
        S.set('info', null);
        if (redirect) {
            U.go('/login.html?redirect='+redirect);
        } else {
            U.go('/login.html');
        }
    };
    U.login = function(info) {
        S.set('info', info);
        var redirect = U.parseUrl().search.get('redirect');
        if (redirect) {
            U.go(decodeURIComponent(redirect));
        } else {
            U.go('/index.html');
        }
    };
    U.getUserInfo = function(){
        return S.get('info');
    };
    U.checkPrivilege = function(need){
        var info = S.get('info');
        if (!info) {
            var href = U.parseUrl().href;
            U.logout(encodeURIComponent(href));
        }
        try {
            var arr = info.privilege.split(',');
            return _.contains(arr, need);
        } catch (e){
            alert('invalid privilege!');
            return false;
        }
    };

    // storage
    if (typeof S === 'undefined') {
        S = {};
    }
    S.set = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };
    S.get = function(key) {
        var ret = localStorage.getItem(key);
        if (ret) {
            return JSON.parse(ret);
        }
        return null;
    };
    // render
    if (typeof R === 'undefined') {
        R = {};
    }
})();
