/**
 * all component define
 */
(function(){

    // http
    if (typeof H === 'undefined') {
        H = {};
    }

    var post = function(url, data, success, error) {
        console.log('[send]', url, JSON.stringify(data));
        $.ajax({
            url:url,
            type:'POST',
            data:{data:JSON.stringify(data)},
            success:function(res){
                console.log('[recv]', url, res);
                typeof success === 'function' && success(res);
            },
            error:function(res){
                console.error('[recv]', url, res);
                typeof errorFn === 'function' && errorFn(res);
            }
        });
    };
    H.action = function(url, data, success, error) {
        var info = S.get('info');
        if (info) {
            //data.token = info.token;
            url += '.php?token=' + info.token;
        } else {
            url += '.php?token=';
        }
        post(url, data, success, error);
    };
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
    H.general = function(method, url, param, successFn, errorFn, $form) {
        if (typeof $form === 'undefined') {
            $form = $(document.body);
        }
        R.loading(true);
        var buildOne = function(formBean){
            if (typeof formBean !== 'object') {
                return null;
            }
            if (formBean.depend === false) {
                return null;
            }
            if (typeof formBean.type === 'undefined') {
                formBean.type = C.ENUM.PARAM_TYPE_TEXT;
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
                        value = $form.find('textarea[name='+formBean.name+']').val();
                        if (typeof formBean.parse === 'function') {
                            value = formBean.parse(value);
                        }
                        break;
                    case C.ENUM.PARAM_TYPE_RADIO:
                        value = $form.find('input[name='+formBean.name+']:checked').val();
                        if (value !== undefined && typeof formBean.parse === 'function') {
                            value = formBean.parse(value);
                        }
                        break;
                    case C.ENUM.PARAM_TYPE_RANGE:
                    case C.ENUM.PARAM_TYPE_DATE_RANGE:
                        var from = $form.find('input[name='+formBean.name+'_from]').val();
                        var to = $form.find('input[name='+formBean.name+'_to]').val();
                        if ((from === 0 || (from && from !=  ''))
                            && (to === 0 || (to && to != ''))) {
                            if (typeof formBean.parse === 'function') {
                                value = [
                                    formBean.parse(from),
                                    formBean.parse(to)
                                ];
                            } else {
                                value = [ from, to ];
                            }
                        }
                        break;
                    case C.ENUM.PARAM_TYPE_TEXT:
                    default:
                        value = $form.find('input[name='+formBean.name+']').val();
                        if (typeof formBean.parse === 'function') {
                            value = formBean.parse(value);
                        }
                }
            }
            var ret = {};
            if (value === 0 || (value && value != '')) {
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
                if (ele.type === C.ENUM.PARAM_TYPE_PARENT) {
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
        var processParam = function(param){
            var result = {};
            _.map(param, function(value, key){
                if (key.indexOf('___') > 0) {
                    var child = result;
                    var parent = result;
                    var lastIndex = null;
                    _.map(key.split('___'), function(index){
                        if (typeof child[index] === 'undefined') {
                            child[index] = {};
                        }
                        lastIndex = index;
                        parent = child;
                        child = child[index];
                    });
                    parent[lastIndex] = value;
                } else {
                    result[key] = value;
                }
            });
            return result;
        };
        var data = buildParam(param);
        data = processParam(data);
        if (url) {
            var info = S.get('info');
            if (info) {
                //data.token = info.token;
                url += '.php?token=' + info.token;
            } else {
                url += '.php?token=';
            }
            var method = method.toUpperCase();
            if (method === 'GET') {
                var search = [];
                _.map(data, function(value, key){
                    search.push(key + '=' + JSON.stringify(value));
                })
                data = null;
                url += '&' + search.join('&');
            }
            post(url, data, function(res){
                R.loading(false);
                if (typeof res !== 'object') {
                    typeof errorFn === 'function' ? errorFn(res) : alert('server error, '+res+'');
                    return;
                }
                if (res.status== C.STATUS.ERROR_SUCCESS) {
                    successFn(res.data);
                } else if (res.status== C.STATUS.INVALID_PRIVILEGE) {
                    alert(res.msg);
                } else {
                    typeof errorFn === 'function' ? errorFn(res) : alert('server error, '+res.status+','+res.msg);
                }
            }, function(res){
                R.loading(false);
                typeof errorFn === 'function' ? errorFn(res) : alert('server error!');
            });
        } else {
            R.loading(false);
            successFn(data, param);
        }
    };

    // util
    if (typeof U === 'undefined') {
        U = {};
    }
    U.formatDate = function(date){
        if (date.length == 8) {
            return date.substr(0,4) + '-' + date.substr(4,2) + '-' + date.substr(6,2);
        }
        return date;
    };
    U.formatAmount = function(amount){
        if (typeof amount != 'number') {
            amount = parseFloat(amount);
        }
        var yuan = parseInt(amount);
        var jiao = parseInt((amount - yuan) * 10);
        var fen = parseInt((amount - yuan) * 100) - jiao * 10;
        var yuanstr = '' + yuan;
        var length = yuanstr.length;
        var ret = '';
        for (var i = 3; i <= length; i+=3) {
            ret = ',' + yuanstr.substr(length -i, 3) + ret;
        }
        ret = yuanstr.substr(0, length % 3) + ret;
        if (ret[0] == ',') {
            ret = ret.substr(1);
        }
        if (fen == 0 && jiao == 0) {
            return ret;
        }
        return ret + '.' + jiao + fen;
    };
    U.formatNumber = function(number){
        var inum = parseInt(number);
        var istr = '' + inum;
        var iret = '';
        for (var i = 3; i <= istr.length; i += 3) {
            iret = ',' + istr.substr(istr.length - i, 3) + iret;
        }
        iret = istr.substr(0, istr.length % 3) + iret;
        if (iret[0] == ',') {
            iret = iret.substr(1);
        }
        return iret;
    };
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
    U.parseDate = function(date){
        return U.parseDatetime(date).substr(0,10);
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
    // info = {
    //  username:<string>,
    //  privilege:<p>,...
    // }
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
