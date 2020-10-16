/**
 * @description alipay ant forest intelligent collection script
 *
 * @since Oct 16, 2020
 * @version 1.9.23
 * @author SuperMonster003 {@link https://github.com/SuperMonster003}
 *
 * @see {@link https://github.com/SuperMonster003/Ant_Forest}
 */

'use strict';

let $$init = {
    check() {
        checkAlipayPackage();
        checkModulesMap();
        checkSdkAndAJVer();
        checkRootAccess();
        checkAccessibility();

        return this;

        // tool function(s) //

        function checkAlipayPackage() {
            let _pkg = "com.eg.android.AlipayGphone";
            let _pkg_mgr = context.getPackageManager();
            let _app_name, _app_info;
            try {
                _app_info = _pkg_mgr.getApplicationInfo(_pkg, 0);
                _app_name = _pkg_mgr.getApplicationLabel(_app_info);
            } catch (e) {
                showSplitLineRaw();
                console.warn(e.message);
                console.warn(e.stack);
            }
            if (!_app_name) {
                let _msg = '此设备可能未安装"支付宝"应用';
                toast(_msg);
                showSplitLineRaw();
                console.error("脚本无法继续");
                console.error(_msg);
                showSplitLineRaw();
                exit();
            }
            global._$_pkg_name = _pkg;
        }

        function checkModulesMap() {
            void [
                "MODULE_MONSTER_FUNC", "MODULE_STORAGE",
                "MODULE_DEFAULT_CONFIG", "MODULE_PWMAP",
                "MODULE_TREASURY_VAULT", "MODULE_UNLOCK",
                "EXT_DIALOGS", "EXT_TIMERS", "EXT_DEVICE",
                "EXT_APP", "EXT_IMAGES", "EXT_ENGINES"
            ].filter((mod) => (
                !files.exists("./Modules/" + mod + ".js")
            )).some((mod, idx, arr) => {
                let _str = "";
                _str += "脚本无法继续|以下模块缺失或路径错误:|";
                _str += "- - - - - - - - - - - - - - - - -|";
                arr.forEach(n => _str += '-> "' + n + '"|');
                _str += "- - - - - - - - - - - - - - - - -|";
                _str += "请检查或重新放置模块";
                showSplitLineRaw();
                _str.split("|").forEach(s => messageActionRaw(s, 4));
                showSplitLineRaw();
                toast("模块缺失或路径错误", "Long");
                exit();
            });
        }

        function checkSdkAndAJVer() {
            // do not `require()` before `checkModulesMap()`
            let _mod = require("./Modules/MODULE_MONSTER_FUNC");
            global.$_app = _mod.checkSdkAndAJVer();
        }

        function checkRootAccess() {
            try {
                // 1. com.stardust.autojs.core.util.ProcessShell
                //    .execCommand("date", true).code === 0;
                //    code above doesn't work on Auto.js Pro
                // 2. some devices may stop the script without
                //    any info or hint in a sudden way without
                //    this try/catch code block
                global._$_autojs_has_root = shell("date", true).code === 0;
            } catch (e) {
                global._$_autojs_has_root = false;
            }
        }

        function checkAccessibility() {
            let _line = showSplitLineRaw;
            let _getDash = () => "- ".repeat(17).trim();
            let _msg = messageActionRaw;

            _checkSvc();
            _checkFunc();

            // tool function(s) //

            function _checkSvc() {
                // do not `require()` before `checkModulesMap()`
                let _a11y = require("./Modules/EXT_DEVICE").a11y;
                if (_a11y.state()) {
                    return true;
                }

                let _perm = "android.permission.WRITE_SECURE_SETTINGS";
                let _pkg_n_perm = context.packageName + " " + _perm;

                let _mod_mon = require("./Modules/MODULE_MONSTER_FUNC");
                let _mod_sto = require("./Modules/MODULE_STORAGE");
                let $_cfg = _mod_sto.create("af_cfg").get("config", {});
                if ($_cfg.auto_enable_a11y_svc === "ON") {
                    _tryEnableAndRestart();
                    if (global._$_autojs_has_root) {
                        shell("pm grant " + _pkg_n_perm, true);
                        _tryEnableAndRestart();
                    }
                    _failedHint();
                }

                if (typeof auto.waitFor !== "function") {
                    try {
                        auto();
                    } catch (e) {
                        // consume errors msg from auto()
                        alert("即将自动跳转到无障碍服务设置页面\n\n"
                            + "跳转页面后请手动开启Auto.js无障碍服务开关\n\n"
                            + "开启后需手动再次运行项目");
                    }
                    exit();
                }

                let _thd = threads.start(function () {
                    // script will continue running rather than stop
                    // when accessibility service enabled by user
                    auto.waitFor();
                });
                _thd.join(1e3);

                if (_thd.isAlive()) {
                    alert("自动跳转到无障碍服务设置页面之后\n\n"
                        + "请手动开启Auto.js无障碍服务开关\n\n"
                        + "开启后脚本将自动继续");
                }
                _thd.join(60e3);

                if (_thd.isAlive()) {
                    _line();
                    _msg("等待用户开启无障碍服务超时", 4, 1);
                    _line();
                    exit();
                }

                // tool function(s) {

                function _failedHint() {
                    let _shell_sc = "adb shell pm grant " + _pkg_n_perm;

                    _line();
                    _msg("自动开启无障碍服务失败", 4);
                    _line();
                    _msg("可能是Auto.js缺少以下权限:", 4);
                    _msg("WRITE_SECURE_SETTINGS", 4);
                    _line();
                    _msg("可尝试使用ADB工具连接手机", 3);
                    _msg("并执行以下Shell指令(无换行):\n" +
                        "\n" + _shell_sc + "\n", 3);
                    _msg("Shell指令已复制到剪切板", 3);
                    _msg("重启设备后授权不会失效", 3);

                    setClip(_shell_sc);
                }

                function _tryEnableAndRestart() {
                    if (_a11y.enable(true)) {
                        _line();
                        _msg("已自动开启无障碍服务");
                        _msg("尝试一次项目重启操作");
                        _line();
                        _mod_mon.restartThisEngine({
                            debug_info_flag: "forcible",
                            instant_run_flag: false,
                            max_restart_engine_times: 1,
                        });
                        sleep(5e3);
                        exit();
                    }
                }
            }

            function _checkFunc() {
                let _max = 3;
                while (!press(1e8, 0, 1) && _max--) {
                    sleep(300);
                }
                if (_max < 0) {
                    _line();
                    void ("脚本无法继续|无障碍服务状态异常|或基于服务的方法无法使用|"
                        + _getDash() + "|可尝试以下解决方案:|" + _getDash()
                        + '|a. 卸载并重新安装"Auto.js"|b. 安装后重启设备'
                        + '|c. 运行"Auto.js"并拉出侧边栏|d. 开启无障碍服务'
                        + "|e. 再次尝试运行本项目").split("|").forEach(s => _msg(s, 4));
                    _line();
                    toast("无障碍服务方法无法使用", "Long");
                    exit();
                }
            }
        }

        // raw function(s) //

        function messageActionRaw(msg, lv, if_toast) {
            let _msg = msg || " ";
            if (lv && lv.toString().match(/^t(itle)?$/)) {
                return messageActionRaw("[ " + msg + " ]", 1, if_toast);
            }
            if_toast && toast(_msg);
            let _lv = typeof lv === "undefined" ? 1 : lv;
            if (_lv >= 4) {
                console.error(_msg);
                _lv >= 8 && exit();
                return false;
            }
            if (_lv >= 3) {
                console.warn(_msg);
                return false;
            }
            if (_lv === 0) {
                console.verbose(_msg);
            } else if (_lv === 1) {
                console.log(_msg);
            } else if (_lv === 2) {
                console.info(_msg);
            }
            return true;
        }

        function showSplitLineRaw(extra, style) {
            console.log((
                style === "dash" ? "- ".repeat(18).trim() : "-".repeat(33)
            ) + (extra || ""));
        }
    },
    global() {
        setGlobalFunctions(); // MONSTER MODULE
        setGlobalExtensions(); // EXT MODULES

        setFlags();
        debugInfo("开发者测试日志已启用", "Up_both_dash");
        debugInfo("设备型号: " + device.brand + " " + device.product);

        devicex.getDisplay(true);

        appSetter().setEngine().setTask().setParams().setBlist().setPages().setTools().setDb().init();

        accSetter().setParams().setMain();

        debugInfo("Auto.js版本: " + $$app.autojs_ver);
        debugInfo("项目版本: " + $$app.project_ver);
        debugInfo("安卓SDK版本: " + $$app.sdk_ver);
        debugInfo("安卓系统版本号: " + device.release);
        debugInfo("Root权限: " + ($$app.has_root ? "有效" : "无效"));

        return this;

        // tool function(s) //

        function setGlobalFunctions() {
            require("./Modules/MODULE_MONSTER_FUNC").load([
                "clickAction", "swipeAndShow", "setIntervalBySetTimeout", "keycode",
                "getSelector", "equalObjects", "waitForAndClickAction", "runJsFile",
                "messageAction", "debugInfo", "killThisApp", "clickActionsPipeline",
                "waitForAction", "baiduOcr", "launchThisApp", "observeToastMessage",
                "showSplitLine", "classof", "timeRecorder", "surroundWith"
            ]);
            global.messageAct = function () {
                return $$flag.msg_details
                    ? messageAction.apply(null, arguments)
                    : (m, lv) => ![3, 4].includes(lv);
            };
            global.showSplitLineForDebugInfo = () => {
                $$flag.debug_info_avail && showSplitLine();
            };
        }

        function setGlobalExtensions() {
            require("./Modules/EXT_GLOBAL_OBJ").load();
            require("./Modules/EXT_DEVICE").load();
            require("./Modules/EXT_TIMERS").load();
            require("./Modules/EXT_DIALOGS").load();
            require("./Modules/EXT_APP").load();
            require("./Modules/EXT_IMAGES").load();
            require("./Modules/EXT_THREADS").load();
            require("./Modules/EXT_ENGINES").load();

            global.$$unlk = require("./Modules/MODULE_UNLOCK");
            global.$$flag = {autojs_has_root: global._$_autojs_has_root};
            global.$$sto = {
                af: require("./Modules/MODULE_STORAGE").create("af"),
                af_cfg: require("./Modules/MODULE_STORAGE").create("af_cfg"),
                af_blist: require("./Modules/MODULE_STORAGE").create("af_blist"),
                af_flist: require("./Modules/MODULE_STORAGE").create("af_flist"),
                treas: require("./Modules/MODULE_TREASURY_VAULT"),
            };
            global.$$cfg = Object.assign({},
                require("./Modules/MODULE_DEFAULT_CONFIG").af || {},
                $$sto.af_cfg.get("config", {})
            );
            global.$$app = {
                pkg_name: global._$_pkg_name,
                cur_autojs_name: $_app.cur_autojs_name,
                cur_autojs_pkg: $_app.cur_autojs_pkg,
                project_ver: $_app.project_ver,
                autojs_ver: $_app.autojs_ver,
                sdk_ver: $_app.sdk_ver,
                get cur_pkg() {
                    return currentPackage();
                },
                get now() {
                    return new Date();
                },
                get ts() {
                    return Date.now();
                },
                get ts_sec() {
                    return Date.now() / 1e3 >> 0;
                },
            };
        }

        function setFlags() {
            let _cnsl_detail = $$cfg.console_log_details;
            let _dbg_info_sw = $$cfg.debug_info_switch;
            let _msg_show_sw = $$cfg.message_showing_switch;
            $$flag.msg_details = _cnsl_detail || _dbg_info_sw;
            $$flag.debug_info_avail = _dbg_info_sw && _msg_show_sw;
            $$flag.no_msg_act_flag = !_msg_show_sw;

            let _e_argv = this.e_argv = enginesx.execArgvJs();
            if (Object.size(_e_argv, {exclude: ["intent"]})) {
                if (!$$und(_e_argv.debug_info_flag)) {
                    $$flag.debug_info_avail = !!_e_argv.debug_info_flag;
                }
                if ($$und(_e_argv.instant_run_flag)) {
                    _e_argv.instant_run_flag = true;
                }
                if ($$und(_e_argv.no_insurance_flag)) {
                    _e_argv.no_insurance_flag = true;
                }
            }
        }

        function appSetter() {
            let _this = this;
            return {
                setEngine() {
                    let _e_argv = _this.e_argv;
                    let _my_engine = engines.myEngine();

                    $$app.my_engine = _my_engine;
                    $$app.my_engine_id = _my_engine.id;
                    $$app.my_engine_argv = _e_argv;
                    $$app.init_scr_on = _e_argv.init_scr_on || $$unlk.is_init_screen_on;
                    $$app.init_fg_pkg = _e_argv.init_fg_pkg || currentPackage();
                    $$app.cwd = _my_engine.cwd(); // `files.cwd()` also fine
                    $$app.cwp = _my_engine.source.toString().match(/\[remote]/)
                        ? _my_engine.cwd() + "/Ant_Forest_Launcher.js"
                        : _my_engine.source.toString();
                    $$app.exit = (quiet) => {
                        if (quiet !== true) {
                            if ($$init.queue.queue.excl_tasks_all_len > 1) {
                                debugInfo("移除当前脚本广播监听器");
                                events.broadcast.removeAllListeners();
                                debugInfo("发送初始屏幕开关状态广播");
                                events.broadcast.emit("init_scr_on_state_change", $$app.init_scr_on);
                            }
                            messageAction($$app.task_name + "任务结束", 1, 0, 0, "2_n");
                        }
                        // exit() might cause ScriptInterruptedException
                        // as $$app.exit might invoked within Promise
                        ui.post(exit);
                    };

                    return this;
                },
                setTask() {
                    $$app.setPostponedTask = (du, if_toast) => {
                        $$flag.task_deploying || threadsx.starts(function () {
                            $$flag.task_deploying = true;

                            let _task_s = $$app.task_name + "任务";
                            let _du_s = du + "分钟";
                            $$F(if_toast) || toast(_task_s + "推迟 " + _du_s);
                            messageAction("推迟" + _task_s, 1, 0, 0, -1);
                            messageAction("推迟时长: " + _du_s, 1, 0, 0, 1);

                            let _ts = $$app.ts + du * 60e3;
                            let _par = {path: $$app.cwp, date: _ts};
                            let _suff = $$sto.af.get("fg_blist_ctr") ? "_auto" : "";
                            $$app.setAutoTask(() => (
                                timersx.addDisposableTask(_par, "wait")
                            ), _ts, "postponed" + _suff);
                            exit();
                        }).join();
                    };
                    $$app.setAutoTask = (task_func, ts, type, keep_old) => {
                        if (typeof task_func !== "function") {
                            throw TypeError("setAutoTask invoked with non-function param");
                        }

                        let _old_id = $$app.getAutoTask().task_id;
                        let _task = task_func.call(null);
                        let _new_id = _task.id;

                        $$sto.af.put("next_auto_task", {
                            task_id: _new_id, timestamp: ts, type: type
                        });

                        if (!keep_old && _old_id && _old_id !== _new_id) {
                            debugInfo(["移除旧的自动定时任务", "任务ID: " + _old_id]);
                            timersx.removeTimedTask(_old_id);
                        }

                        return _task;
                    };
                    $$app.getAutoTask = (def) => {
                        return $$sto.af.get("next_auto_task", def || {});
                    };

                    return this;
                },
                setParams() {
                    $$app.task_name = surroundWith(_unEsc("8682868168EE6797"));
                    $$app.rl_title = _unEsc("2615FE0F0020597D53CB6392884C699C");
                    $$app.developer = _unTap("434535154232343343441542000003");
                    $$app.local_pics_path = _getLocalPicsPath();
                    $$app.rex_energy_amt = /^\s*\d+(\.\d+)?(k?g|t)\s*$/;
                    $$app.has_root = $$flag.autojs_has_root;
                    $$app.intent = {
                        home: {
                            action: "VIEW",
                            data: _encURIPar("alipays://platformapi/startapp", {
                                saId: 20000067,
                                url: "https://60000002.h5app.alipay.com/www/home.html",
                                __webview_options__: {
                                    transparentTitle: "auto", // other option(s): "none"
                                    backgroundColor: "-1",
                                    appClearTop: true, // alias: "YES"
                                    startMultApp: true,
                                    enableCubeView: false, // alias: "NO"
                                    enableScrollBar: false,
                                },
                            }),
                        },
                        rl: {
                            action: "VIEW",
                            data: _encURIPar("alipays://platformapi/startapp", {
                                saId: 20000067,
                                url: "https://60000002.h5app.alipay.com/www/listRank.html",
                                __webview_options__: {
                                    transparentTitle: "none", // other option(s): "auto"
                                    backgroundColor: "-1",
                                    canPullDown: false, // alias: "NO"
                                    gestureBack: true, // alias: "YES"
                                    backBehavior: "back", // other option(s): "pop"
                                    enableCubeView: false,
                                    appClearTop: true,
                                    startMultApp: true,
                                    showOptionMenu: true,
                                    enableScrollBar: false,
                                    closeCurrentWindow: true,
                                    defaultTitle: $$app.rl_title,
                                },
                            }, {exclude: "defaultTitle"}),
                        },
                        acc_man: {
                            action: "VIEW",
                            data: "alipays://platformapi/startapp?appId=20000027",
                        },
                        acc_login: {
                            action: "VIEW",
                            data: "alipays://platformapi/startapp?appId=20000008",
                        },
                    };
                    $$app.fri_drop_by = {
                        _pool: [],
                        _max: 5,
                        ic(name) {
                            let _ctr = this._pool[name] || 0;
                            if (_ctr === this._max) {
                                debugInfo("发送排行榜复查停止信号");
                                debugInfo(">已达连续好友访问最大阈值");
                                $$flag.rl_review_stop = true;
                            }
                            this._pool[name] = ++_ctr;
                        },
                        dc(name) {
                            let _ctr = this._pool[name] || 0;
                            this._pool[name] = _ctr > 1 ? --_ctr : 0;
                        },
                    };

                    return this;

                    // tool function(s) //

                    function _unEsc(s) {
                        return typeof String.fromCharCode === "function"
                            ? s.replace(/.{4}/g, $ => String.fromCharCode(parseInt($, 16)))
                            : unescape(s.replace(/.{4}/g, "%u$&"));
                    }

                    function _unTap(s) {
                        // Person of Interest Season 2 Episode 2 at 00:39:03
                        // Tap code in this episode was "4442112433434433"
                        let _map = [
                            ["A", "B", "C", "D", "E"],
                            ["F", "G", "H", "I", "J"],
                            ["L", "M", "N", "O", "P"],
                            ["Q", "R", "S", "T", "U"],
                            ["V", "W", "X", "Y", "Z"],
                        ];
                        return s.match(/../g).reduce((a, b) => {
                            let [_row, _col] = b;
                            return a + (+_row ? _map[--_row][--_col] : _col);
                        }, String());
                    }

                    function _encURIPar(pref, params, options) {
                        let _par = params || {};
                        let _opt = options || {};
                        let _sep = pref.match(/\?/) ? "&" : "?";

                        return pref + _sep + _parseObj(_par);

                        // tool function(s) //

                        function _parseObj(o) {
                            let _exclude = _opt.exclude || [];
                            if (!Array.isArray(_exclude)) {
                                _exclude = [_exclude];
                            }
                            return Object.keys(o).map((key) => {
                                let _val = o[key];
                                if (typeof _val === "object") {
                                    _val = "&" + _parseObj(_val);
                                }
                                if (!_exclude.includes(key)) {
                                    _val = encodeURI(_val);
                                }
                                return key + "=" + _val;
                            }).join("&");
                        }
                    }

                    function _getLocalPicsPath() {
                        let _path = files.getSdcardPath() + "/.local/Pics/";
                        return files.createWithDirs(_path) && _path;
                    }
                },
                setBlist() {
                    $$app.blist = {
                        _expired: {
                            trigger(o) {
                                return o.timestamp < $$app.ts;
                            },
                            showMsg(o) {
                                let _du_ts = o.timestamp - $$app.ts;
                                let _0h_ts = Date.parse(new Date().toDateString());
                                let _du_date = new Date(_0h_ts + _du_ts);

                                let _d_unit = 24 * 3.6e6;
                                let _d = Math.trunc(_du_ts / _d_unit);
                                let _d_str = _d ? _d + "天" : "";
                                let _h = _du_date.getHours();
                                let _h_str = _h ? _h.padStart(2, 0) + "时" : "";
                                let _m = _du_date.getMinutes();
                                let _m_str = _h || _m ? _m.padStart(2, 0) + "分" : "";
                                let _s = _du_date.getSeconds();
                                let _s_str = (_h || _m ? _s.padStart(2, 0) : _s) + "秒";

                                messageAct(_d_str + _h_str + _m_str + _s_str + "后解除", 1, 0, 1);
                            }
                        },
                        _showMsg: {
                            msg(m) {
                                messageAct(m, 1, 0, 1);
                            },
                            add(o) {
                                this.msg("已加入黑名单");
                                this.reason(o);
                                this.expired(o);
                            },
                            exists(o) {
                                this.msg("黑名单好友");
                                this.msg("已跳过收取");
                                this.reason(o);
                                this.expired(o);
                            },
                            reason(o) {
                                let _map = {};
                                let {cover: _c, user: _u} = $$app.blist.reason;
                                _map[_c] = "好友使用能量保护罩";
                                _map[_u] = "用户自行设置";
                                this.msg(_map[o.reason]);
                            },
                            expired(o) {
                                if (Number.isFinite(o.timestamp)) {
                                    $$app.blist._expired.showMsg(o);
                                }
                            },
                        },
                        data: [],
                        reason: {
                            cover: "protect_cover",
                            user: "by_user",
                        },
                        get(name, ref) {
                            return !name ? ref : this.data.some((o) => {
                                if (name.trim() === o.name.trim()) {
                                    this._showMsg.exists(o);
                                    return true;
                                }
                            });
                        },
                        save() {
                            if (this._is_modified) {
                                $$sto.af_blist.put("blacklist", this.data, "forcible");
                                delete this._is_modified;
                            }
                            return this;
                        },
                        add(n, t, r) {
                            let _add_o = n;
                            if (arguments.length === 3) {
                                _add_o = {name: n, timestamp: t, reason: r};
                            }

                            let _data = this.data;
                            for (let i = 0; i < _data.length; i += 1) {
                                let {name: _n, reason: _r} = _data[i];
                                if (_n === _add_o.name && _r === $$app.blist.reason.cover) {
                                    _data.splice(i--, 1);
                                }
                            }
                            _data.push(_add_o);

                            this._is_modified = true;
                            this._showMsg.add(_add_o);

                            return this;
                        },
                        init() {
                            let _blist_setter = this;

                            blistInitializer().get().clean().message().assign();

                            return this;

                            // tool function(s) //

                            function blistInitializer() {
                                return {
                                    _blist_data: [],
                                    _deleted: [],
                                    get() {
                                        this._blist_data = $$sto.af_blist.get("blacklist", []);
                                        _legacyCompatibility.call(this);
                                        return this;

                                        // tool function(s) //

                                        function _legacyCompatibility() {
                                            let _old = $$sto.af.get("blacklist");
                                            if (!$$und(_old)) {
                                                // legacy: {name: {timestamp::, reason::}}
                                                // modern: [{name::, reason::, timestamp::}]
                                                if ($$obj(_old)) {
                                                    debugInfo("转换传统黑名单数据格式");
                                                    _old = Object.keys(_old).map((n) => (
                                                        Object.assign({name: n}, _old[n])
                                                    ));
                                                }
                                                if ($$arr(_old)) {
                                                    debugInfo("转移传统黑名单存储数据");
                                                    this._blist_data = _old;
                                                }
                                                $$sto.af.remove("blacklist");
                                            }
                                        }
                                    },
                                    clean() {
                                        this._deleted = [];
                                        for (let i = 0; i < this._blist_data.length; i += 1) {
                                            let _o = this._blist_data[i];
                                            if (!$$obj(_o)) {
                                                this._blist_data.splice(i--, 1);
                                                _blist_setter._is_modified = true;
                                                continue;
                                            }
                                            if (!_o.timestamp || _blist_setter._expired.trigger(_o)) {
                                                this._deleted.push(_o.name);
                                                this._blist_data.splice(i--, 1);
                                                _blist_setter._is_modified = true;
                                            }
                                        }
                                        return this;
                                    },
                                    message() {
                                        let _len = this._deleted.length;
                                        if (_len) {
                                            messageAct("移除黑名单记录: " + _len + "项", 1, 0, 0, 2);
                                            this._deleted.forEach(n => messageAct(n, 1, 0, 1));
                                            showSplitLineForDebugInfo();
                                        }
                                        return this;
                                    },
                                    assign() {
                                        _blist_setter.data = this._blist_data;
                                        return this;
                                    },
                                };
                            }
                        },
                    }.init().save();

                    return this;
                },
                setPages() {
                    $$app.page = {
                        _plans: {
                            back: (() => {
                                let _text = () => {
                                    return $$sel.pickup(["返回", "c0", {c$: true}])
                                        || $$sel.pickup(["返回", {c$: true}]);
                                };
                                let _id = () => {
                                    return $$sel.pickup(idMatches(/.*h5.+nav.back|.*back.button/));
                                };
                                let _bak = [0, 0, cX(100), cYx(200)]; // backup plan

                                return [_text, _id, _bak];
                            })(),
                            close: (() => {
                                let _text = () => {
                                    return $$sel.pickup([/关闭|Close/, "c0", {c$: true}])
                                        || $$sel.pickup([/关闭|Close/, {c$: true}]);
                                };
                                let _id = () => null; // so far
                                let _bak = [cX(0.8), 0, -1, cYx(200)]; // backup plan

                                return [_text, _id, _bak];
                            })(),
                            launch: {
                                af: {
                                    _launcher(trigger, shared_opt) {
                                        return launchThisApp(trigger, Object.assign({
                                            task_name: $$app.task_name,
                                            package_name: $$app.pkg_name,
                                            no_message_flag: true,
                                            screen_orientation: 0,
                                            condition_launch() {
                                                return $$app.page.af.isInPage();
                                            },
                                            condition_ready() {
                                                let _nec_sel_key = "af_title";
                                                let _opt_sel_keys = ["af_home", "rl_ent"];

                                                if (_necessary() && _optional()) {
                                                    delete $$flag.launch_necessary;
                                                    delete $$flag.launch_optional;
                                                    return true;
                                                }

                                                // tool function(s) //

                                                function _necessary() {
                                                    if ($$flag.launch_necessary) {
                                                        return true;
                                                    }
                                                    if (!$$bool($$flag.launch_necessary)) {
                                                        debugInfo("等待启动必要条件");
                                                    }
                                                    if ($$sel.get(_nec_sel_key)) {
                                                        debugInfo(["已满足启动必要条件:", _nec_sel_key]);
                                                        return $$flag.launch_necessary = true;
                                                    }
                                                    return $$flag.launch_necessary = false;
                                                }

                                                function _optional() {
                                                    if (!$$bool($$flag.launch_optional)) {
                                                        debugInfo("等待启动可选条件");
                                                    }
                                                    return _opt_sel_keys.some((key) => {
                                                        if ($$sel.get(key)) {
                                                            debugInfo(["已满足启动可选条件", ">" + key]);
                                                            return true;
                                                        }
                                                    }) || ($$flag.launch_optional = false);
                                                }
                                            },
                                            disturbance() {
                                                clickAction($$sel.pickup("打开"), "w");
                                                $$app.page.dismissPermissionDiag();
                                            },
                                        }, shared_opt || {}));
                                    },
                                    intent(shared_opt) {
                                        return appx.checkActivity($$app.intent.home)
                                            ? this._launcher($$app.intent.home, shared_opt)
                                            : this._showActHint();
                                    },
                                    click_btn(shared_opt) {
                                        let _w = null;
                                        return $$app.page.alipay.home()
                                            && waitForAction(() => _w = $$sel.get("af"), 1.5e3, 80)
                                            && this._launcher(() => clickAction(_w, "w"), shared_opt);
                                    },
                                    search_kw(shared_opt) {
                                        let _this = this;
                                        let _w_item = null;
                                        return _alipayHome() && _search() && _launch();

                                        // tool function(s) //

                                        function _alipayHome() {
                                            return $$app.page.alipay.home()
                                                && waitForAndClickAction(
                                                    idMatches(/.*home.+search.but.*/), 1.5e3, 80,
                                                    {click_strategy: "w"}
                                                );
                                        }

                                        function _search() {
                                            let _sel = () => $$sel.pickup(idMatches(/.*search.input.box/));
                                            if (waitForAction(_sel, 5e3, 80)) {
                                                let _text = "蚂蚁森林小程序";
                                                setText(_text);
                                                waitForAction(() => $$sel.pickup(_text), 3e3, 80);
                                                return clickAction(idMatches(/.*search.confirm/), "w", {
                                                    condition_success: () => _w_item = $$sel.get("af"),
                                                    max_check_times: 10,
                                                    check_time_once: 300,
                                                });
                                            }
                                        }

                                        function _launch() {
                                            let _bnd = _w_item.bounds();

                                            let _max = 8;
                                            while (_max-- && !_w_item.clickable()) {
                                                _w_item = _w_item.parent();
                                            }

                                            let _o = _max < 0 ? _bnd : _w_item;
                                            let _stg = _max < 0 ? "click" : "widget";

                                            return _this._launcher(() => {
                                                return clickAction(_o, _stg);
                                            }, shared_opt);
                                        }
                                    },
                                },
                                rl: {
                                    _launcher(trigger, shared_opt) {
                                        return launchThisApp(trigger, Object.assign({}, {
                                            task_name: "好友排行榜",
                                            package_name: $$app.pkg_name,
                                            screen_orientation: 0,
                                            no_message_flag: true,
                                            condition_launch: () => true,
                                            condition_ready() {
                                                let _loading = () => $$sel.pickup(/加载中.*/);
                                                let _cA = () => !_loading();
                                                let _cB = () => !waitForAction(_loading, 360, 120);
                                                let _listLoaded = () => _cA() && _cB();

                                                return $$app.page.rl.isInPage() && _listLoaded();
                                            },
                                            disturbance() {
                                                clickAction($$sel.pickup(/再试一次|打开/), "w");
                                            },
                                        }, shared_opt || {}));
                                    },
                                    intent(shared_opt) {
                                        return appx.checkActivity($$app.intent.rl)
                                            ? this._launcher($$app.intent.rl, shared_opt)
                                            : this._showActHint();
                                    },
                                    click_btn(shared_opt) {
                                        let _w_rl_ent = null;
                                        let _sel_rl_ent = () => _w_rl_ent = $$sel.get("rl_ent");

                                        return _locateBtn() && _launch();

                                        // tool function(s) //

                                        function _locateBtn() {
                                            let _max = 8;
                                            while (_max--) {
                                                if (waitForAction(_sel_rl_ent, 1.5e3)) {
                                                    return true;
                                                }
                                                if ($$sel.get("alipay_home")) {
                                                    debugInfo(["检测到支付宝主页页面", "尝试进入蚂蚁森林主页"]);
                                                    $$app.page.af.launch();
                                                } else if ($$sel.get("rl_title")) {
                                                    debugInfo(["检测到好友排行榜页面", "尝试关闭当前页面"]);
                                                    $$app.page.back();
                                                } else {
                                                    debugInfo(["未知页面", "尝试关闭当前页面"]);
                                                    keycode(4, {double: true});
                                                }
                                            }
                                            if (_max >= 0) {
                                                debugInfo('定位到"查看更多好友"按钮');
                                                return true;
                                            }
                                            messageAction('定位"查看更多好友"超时', 3, 1, 0, 1);
                                        }

                                        function _launch() {
                                            return this._launcher(() => _widget() || _swipe(), shared_opt);

                                            // tool function(s) //

                                            function _widget() {
                                                return clickAction(_w_rl_ent, "w")
                                                    && waitForAction(() => !_sel_rl_ent(), 800);
                                            }

                                            function _swipe() {
                                                debugInfo('备份方案点击"查看更多好友"');
                                                return swipeAndShow(_w_rl_ent, {
                                                    swipe_time: 200,
                                                    check_interval: 100,
                                                    if_click: "click",
                                                });
                                            }
                                        }
                                    },
                                },
                                _showActHint() {
                                    messageAction("Activity在设备系统中不存在", 3, 0, 0, 2);
                                },
                            },
                        },
                        _getClickable(coord) {
                            let _sel = selector();
                            let _par = coord.map((x, i) => ~x ? x : i % 2 ? W : H);
                            return _sel.boundsInside.apply(_sel, _par).clickable().findOnce();
                        },
                        _carry(fs, no_bak) {
                            for (let i = 0, l = fs.length; i < l; i += 1) {
                                let _checker = fs[i];
                                if ($$arr(_checker)) {
                                    if (no_bak) {
                                        continue;
                                    }
                                    _checker = () => this._getClickable(fs[i]);
                                }
                                let _w = _checker();
                                if (_w) {
                                    return clickAction(_w, "w");
                                }
                            }
                        },
                        _plansLauncher(aim, plans_arr, shared_opt) {
                            let _fxo = $$app.page._plans.launch[aim];
                            return plans_arr.some((stg) => {
                                let _f = _fxo[stg];
                                if (!$$func(_f)) {
                                    messageAction("启动器计划方案无效", 4, 1, 0, -1);
                                    messageAction("计划: " + aim, 4, 0, 1);
                                    messageAction("方案: " + stg, 8, 0, 1, 1);
                                }
                                if (_f.call(_fxo, shared_opt)) {
                                    return true;
                                }
                            });
                        },
                        autojs: {
                            _pickupTitle: rex => $$sel.pickup([rex, {
                                cn$: "TextView",
                                bi$: [cX(0.12), cYx(0.03), halfW, cYx(0.12)],
                            }]),
                            get is_log() {
                                return this._pickupTitle(/日志|Log/);
                            },
                            get is_settings() {
                                return this._pickupTitle(/设置|Settings?/);
                            },
                            get is_home() {
                                return $$sel.pickup(idMatches(/.*action_(log|search)/));
                            },
                            get is_fg() {
                                return $$sel.pickup(["Navigate up", {cn$: "ImageButton"}])
                                    || this.is_home || this.is_log || this.is_settings
                                    || $$sel.pickup(idMatches(/.*md_\w+/));
                            },
                            spring_board: {
                                on: () => $$cfg.app_launch_springboard === "ON",
                                employ() {
                                    if (!this.on()) {
                                        return false;
                                    }
                                    debugInfo("开始部署启动跳板");

                                    let _aj_name = $$app.cur_autojs_name;
                                    let _res = launchThisApp($$app.cur_autojs_pkg, {
                                        app_name: _aj_name,
                                        debug_info_flag: false,
                                        no_message_flag: true,
                                        first_time_run_message_flag: false,
                                        condition_ready() {
                                            return $$app.page.autojs.is_fg;
                                        },
                                    });

                                    if (_res) {
                                        debugInfo("跳板启动成功");
                                        return true;
                                    }
                                    debugInfo("跳板启动失败", 3);
                                    debugInfo(">打开" + _aj_name + "应用超时", 3);
                                },
                                remove() {
                                    if (!this.on()) {
                                        return;
                                    }
                                    if (!$$flag.alipay_closed) {
                                        return debugInfo(["跳过启动跳板移除操作", ">支付宝未关闭"]);
                                    }
                                    if (waitForAction(_isFg, 9e3, 300)) {
                                        return _checkInitState();
                                    }
                                    // language=JS
                                    debugInfo("`等待返回${$$app.cur_autojs_name}应用页面超时`".ts);

                                    // tool function(s) //

                                    function _isFg() {
                                        return $$app.page.autojs.is_fg;
                                    }

                                    function _checkInitState() {
                                        if (!$$app.init_autojs_state.init_fg) {
                                            return _remove(_isFg, _back2);
                                        }
                                        if ($$app.init_autojs_state.init_home) {
                                            return debugInfo("无需移除启动跳板");
                                        }
                                        if ($$app.init_autojs_state.init_log) {
                                            return _restore("console");
                                        }
                                        if ($$app.init_autojs_state.init_settings) {
                                            return _restore("settings");
                                        }
                                        return _remove(_isHome, _back2);

                                        // tool function(s) //

                                        function _back2() {
                                            keycode(4, {double: true});
                                            sleep(400);
                                        }

                                        function _remove(condF, removeF) {
                                            debugInfo("移除启动跳板");
                                            let _max = 5;
                                            while (condF() && _max--) {
                                                removeF();
                                            }
                                            if (_max > 0) {
                                                debugInfo("跳板移除成功");
                                                return true;
                                            }
                                            debugInfo("跳板移除可能未成功", 3);
                                        }

                                        function _restore(cmd) {
                                            let _m = "恢复跳板 " + cmd.toTitleCase() + " 页面";
                                            toast(_m);
                                            debugInfo(_m);
                                            return appx.startActivity(cmd);
                                        }

                                        function _isHome() {
                                            return $$app.page.autojs.is_home;
                                        }
                                    }
                                },
                            },
                        },
                        alipay: {
                            home(par) {
                                return launchThisApp($$app.pkg_name, Object.assign({
                                    app_name: "支付宝",
                                    no_message_flag: true,
                                    screen_orientation: 0,
                                    condition_ready() {
                                        $$app.page.dismissPermissionDiag();
                                        $$app.page.close("no_bak") || $$app.page.back();
                                        return $$app.page.alipay.isInPage();
                                    },
                                }, par || {}));
                            },
                            close() {
                                debugInfo("关闭支付宝");
                                let _par = {shell_acceptable: $$app.has_root};
                                if (!killThisApp($$app.pkg_name, _par)) {
                                    return debugInfo("支付宝关闭超时", 3);
                                }
                                debugInfo("支付宝关闭完毕");
                                return $$flag.alipay_closed = true;
                            },
                            isInPage() {
                                return $$sel.get("alipay_home");
                            },
                        },
                        af: {
                            launch(shared_opt) {
                                $$app.page.autojs.spring_board.employ();

                                // TODO loadFromConfig
                                let _plans = ["intent", "click_btn", "search_kw"];
                                let _res = $$app.page._plansLauncher("af", _plans, shared_opt);

                                $$app.monitor.mask_layer.start();

                                return _res;
                            },
                            close() {
                                let _tOut = () => timeRecorder("close_af_win", "L") >= 10e3;
                                let _cond = () => {
                                    return $$sel.get("af_title")
                                        || $$sel.get("rl_title")
                                        || $$sel.pickup([/浇水|发消息/, {cn$: "Button"}])
                                        || $$sel.get("login_new_acc");
                                };
                                debugInfo("关闭全部蚂蚁森林相关页面");
                                timeRecorder("close_af_win");
                                while (_cond() && !_tOut()) {
                                    keycode(4);
                                    sleep(700);
                                }
                                let _succ = ["相关页面关闭完毕", "保留当前支付宝页面"];
                                debugInfo(_tOut() ? "页面关闭可能未成功" : _succ);
                            },
                            isInPage() {
                                return $$app.cur_pkg === $$app.pkg_name
                                    || $$sel.get("rl_ent")
                                    || $$sel.get("af_home")
                                    || $$sel.get("wait_awhile");
                            },
                        },
                        rl: {
                            get capt_img() {
                                return this._capt || this.capt();
                            },
                            set capt_img(img) {
                                this._capt = img;
                            },
                            capt() {
                                imagesx.reclaim(this._capt);
                                return this.capt_img = imagesx.capt();
                            },
                            pool: {
                                data: [],
                                add() {
                                    this.data.unshift(images.copy($$app.page.rl.capt()));
                                    return this;
                                },
                                filter() {
                                    let _pool = this.data;
                                    for (let i = 0; i < _pool.length; i += 1) {
                                        if (imagesx.isRecycled(_pool[i])) {
                                            _pool.splice(i--, 1);
                                        }
                                    }
                                    return this;
                                },
                                trim() {
                                    let _pool = this.data;
                                    for (let i = _pool.length; i-- > 2;) {
                                        imagesx.reclaim(_pool[i]);
                                        _pool[i] = null;
                                        _pool.splice(i, 1);
                                    }
                                    return this;
                                },
                                clean() {
                                    debugInfo("清理排行榜截图样本池");
                                    let _pool = this.data;
                                    while (_pool.length) {
                                        _pool.shift().recycle();
                                    }
                                    return this;
                                },
                                isDiff() {
                                    let _pool = this.data;
                                    if (_pool.length !== 2) {
                                        return true;
                                    }
                                    let _fz = 0.35;
                                    let [_a, _b] = _pool.map(capt => (
                                        images.scale(capt, _fz, _fz)
                                    ));
                                    let _res = !images.findImage(_a, _b);
                                    imagesx.reclaim(_a, _b);
                                    _a = _b = null;
                                    return _res;
                                }
                            },
                            btm_tpl: {
                                path: $$cfg.rank_list_bottom_template_path,
                                get img() {
                                    if (this._img && !imagesx.isRecycled(this._img)) {
                                        return this._img;
                                    }
                                    return this._img = images.read(this.path);
                                },
                                set img(img) {
                                    this._img = img;
                                },
                                reclaim() {
                                    imagesx.reclaim(this._img);
                                    this._img = null;
                                },
                            },
                            launch(shared_opt) {
                                // TODO split from alipay spring board
                                $$app.page.autojs.spring_board.employ();

                                // TODO loadFromConfig
                                let _plans = ["intent", "click_btn"];

                                return $$app.page._plansLauncher("rl", _plans, shared_opt);
                            },
                            backTo() {
                                let _isIn = () => $$flag.rl_in_page;
                                let _max = 3;
                                while (_max--) {
                                    sleep(240);
                                    keycode(4);
                                    debugInfo("模拟返回键返回排行榜页面");
                                    if (waitForAction(_isIn, 2.4e3, 80)) {
                                        sleep(240);
                                        if (waitForAction(_isIn, 480, 80)) {
                                            debugInfo("返回排行榜成功");
                                            return true;
                                        }
                                        if ($$app.page.fri.isInPage()) {
                                            debugInfo("当前页面为好友森林页面");
                                            continue;
                                        }
                                    }
                                    if ($$app.page.alipay.isInPage()) {
                                        debugInfo(["当前页面为支付宝首页", "重新跳转至排行榜页面"]);
                                        return this.launch();
                                    }
                                    debugInfo("返回排行榜单次超时");
                                }
                                debugInfo(["返回排行榜失败", "尝试重启支付宝到排行榜页面"], 3);
                                $$app.page.af.launch();
                                $$af.fri.launch();
                            },
                            isInPage() {
                                let _fg = $$flag.rl_in_page;
                                return $$und(_fg) ? $$sel.get("rl_title") : _fg;
                            },
                        },
                        fri: {
                            in_page_rex: new RegExp(
                                /来浇过水.+|(帮忙)?收取\s?\d+g/.source + "|" +
                                /赠送的\s?\d+g\s?.*能量|点击加载更多/.source
                            ),
                            in_page_rex_spe: /今天|昨天|\d{2}-\d{2}/, // > cY(0.85)
                            isInPage() {
                                let _this = this;
                                return _chkTitle() && _chkPageRex();

                                // tool function(s) //

                                function _chkTitle() {
                                    if (_this._is_title_ready_fg) {
                                        return true;
                                    }
                                    if ($$sel.get("fri_frst_tt")) {
                                        return _this._is_title_ready_fg = true;
                                    }
                                }

                                function _chkPageRex() {
                                    let _cA = () => $$sel.pickup(_this.in_page_rex);
                                    let _cB = () => {
                                        let _bnd = $$sel.pickup(_this.in_page_rex_spe, "bounds");
                                        return _bnd && _bnd.top > cY(0.85);
                                    };
                                    if (_cA() || _cB()) {
                                        delete _this._is_title_ready_fg;
                                        return true;
                                    }
                                }
                            },
                            getReady() {
                                $$app.monitor.reload_btn.start();

                                let _max = 20e3;
                                let _max_bak = _max;
                                let _itv = 200;

                                while (!this.isInPage() && _max > 0) {
                                    let _ratio = $$sel.get("wait_awhile") ? 1 / 6 : 1;
                                    _max -= _itv * _ratio;
                                    sleep(_itv);
                                }

                                let _sec = (_max_bak - _max) / 1e3;
                                if (_sec >= 6) {
                                    debugInfo("进入好友森林时间较长: " + _sec.toFixedNum(2) + "秒");
                                }

                                $$app.monitor.reload_btn.interrupt();
                                return _max > 0 || messageAction("进入好友森林超时", 3, 1);
                            },
                            pool: {
                                data: [],
                                interval: $$cfg.forest_balls_pool_itv,
                                limit: $$cfg.forest_balls_pool_limit,
                                get len() {
                                    return this.data.length;
                                },
                                get filled_up() {
                                    return this.len >= this.limit;
                                },
                                add(capt) {
                                    capt = capt || imagesx.capt();
                                    this.filled_up && this.reclaimLast();
                                    debugInfo("添加好友森林采样: " + imagesx.getName(capt));
                                    this.data.unshift(capt);
                                },
                                reclaimLast() {
                                    let _c = this.data.pop();
                                    debugInfo("好友森林采样已达阈值: " + this.limit);
                                    debugInfo(">移除并回收最旧样本: " + imagesx.getName(_c));
                                    imagesx.reclaim(_c);
                                    _c = null;
                                },
                                reclaimAll() {
                                    if (this.len) {
                                        debugInfo("回收全部好友森林采样");
                                        this.data.forEach((c) => {
                                            let _c_name = imagesx.getName(c);
                                            imagesx.reclaim(c);
                                            debugInfo(">已回收: " + _c_name);
                                            c = null;
                                        });
                                        this.clear();
                                        debugInfo("好友森林样本已清空");
                                    }
                                },
                                clear() {
                                    this.data.splice(0, this.len);
                                },
                                getReady() {
                                    debugInfo("开始能量保护罩检测准备");

                                    let _max_pool_chk = 10;
                                    while (!this.len && _max_pool_chk--) {
                                        if (!$$app.thd_info_collect.isAlive()) {
                                            break;
                                        }
                                        sleep(100);
                                    }

                                    if (this.len) {
                                        debugInfo("使用好友森林信息采集线程数据");
                                        debugInfo("可供分析的能量罩样本数量: " + this.len);
                                    }

                                    if (!this.filled_up) {
                                        debugInfo("能量罩样本数量不足");
                                        let _max_fill = 12;
                                        while (1) {
                                            if (!$$app.thd_info_collect.isAlive()) {
                                                debugInfo("好友森林信息采集线程已停止");
                                                debugInfo("现场采集能量罩样本数据");
                                                return this.add();
                                            }
                                            if (!_max_fill--) {
                                                debugInfo("等待样本采集超时");
                                                debugInfo("现场采集能量罩样本数据");
                                                return this.add();
                                            }
                                            if (this.filled_up) {
                                                debugInfo("能量罩样本数据充足");
                                                return;
                                            }
                                            sleep(50);
                                        }
                                    }
                                },
                                detectCover() {
                                    let _color = $$cfg.protect_cover_detect_color;
                                    let _par = {threshold: $$cfg.protect_cover_detect_threshold};
                                    let _clip = (img) => images.clip(
                                        img, cX(288), cYx(210), cX(142), cYx(44)
                                    );
                                    return this.data.some((img) => {
                                        let _c = !imagesx.isRecycled(img) && _clip(img);
                                        return _c && images.findColor(_c, _color, _par);
                                    }) || debugInfo("颜色识别无保护罩");
                                },
                            },
                        },
                        back(no_bak) {
                            return this._carry(this._plans.back, no_bak);
                        },
                        close(no_bak) {
                            return this._carry(this._plans.close, no_bak);
                        },
                        closeIntelligently() {
                            let _cA = () => $$cfg.kill_when_done_switch;
                            let _cB1 = () => $$cfg.kill_when_done_intelligent;
                            let _cB2 = () => $$app.init_fg_pkg !== $$app.pkg_name;
                            let _cB = () => _cB1() && _cB2();

                            if (_cA() || _cB()) {
                                return this.alipay.close();
                            }

                            if (!$$cfg.kill_when_done_keep_af_pages) {
                                return this.af.close();
                            }
                        },
                        dismissPermissionDiag() {
                            let _sel_btn_cfm = () => $$sel.pickup(idMatches(/.*btn_confirm/));
                            let _sel_allow = () => $$sel.pickup(/[Aa][Ll]{2}[Oo][Ww]|允许/);
                            let _w = null;
                            let _max = 10;
                            while (_max-- && (_w = _sel_btn_cfm() || _sel_allow())) {
                                clickAction(_w, "w");
                                sleep(500);
                            }
                        },
                    };

                    return this;
                },
                setTools() {
                    $$app.tool = {
                        timeStr(time, format) {
                            let _date = _parseDate(time || new Date());
                            let _yyyy = _date.getFullYear();
                            let _yy = _yyyy.toString().slice(-2);
                            let _M = _date.getMonth() + 1;
                            let _MM = _M.padStart(2, 0);
                            let _d = _date.getDate();
                            let _dd = _d.padStart(2, 0);
                            let _h = _date.getHours();
                            let _hh = _h.padStart(2, 0);
                            let _m = _date.getMinutes();
                            let _mm = _m.padStart(2, 0);
                            let _s = _date.getSeconds();
                            let _ss = _s.padStart(2, 0);

                            let _units = {
                                yyyy: _yyyy, yy: _yy,
                                MM: _MM, M: _M,
                                dd: _dd, d: _d,
                                hh: _hh, h: _h,
                                mm: _mm, m: _m,
                                ss: _ss, s: _s,
                            };

                            return _parseFormat(format || "yyyy/MM/dd hh:mm:ss");

                            // tool function(s) //

                            function _parseDate(t) {
                                return $$date(t) ? t : $$num(t) || $$str(t) ? new Date(t) : new Date();
                            }

                            function _parseFormat(str) {
                                let _str = str.toString();
                                let _res = "";

                                while (_str.length) {
                                    let _max = 4;
                                    while (_max) {
                                        let _unit = _str.slice(0, _max);
                                        if (_unit in _units) {
                                            _res += _units[_unit];
                                            _str = _str.slice(_max);
                                            break;
                                        }
                                        _max -= 1;
                                    }
                                    if (!_max) {
                                        _res += _str[0];
                                        _str = _str.slice(1);
                                    }
                                }

                                return _res;
                            }
                        },
                        stabilizer(cond, init, tt_cond, tt_stable) {
                            let _init = $$und(init) ? NaN : +init;
                            let _res = () => {
                                let _num = +cond();
                                _init = isNaN(_init) ? _num : _init;
                                return _num;
                            };
                            let _cond_c = () => {
                                let _num = _res();
                                return $$num(_num) && _init !== _num;
                            };

                            if (!waitForAction(_cond_c, tt_cond || 3e3)) {
                                return NaN;
                            }

                            let _old = _init;
                            let _tmp = NaN;
                            let _check = () => _tmp = cond();
                            let _cond_s = () => _old !== _check();

                            while (waitForAction(_cond_s, tt_stable || 500)) {
                                _old = _tmp;
                            }

                            return _old;
                        },
                    };

                    return this;
                },
                setDb() {
                    let _path = files.getSdcardPath() + "/.local/ant_forest.db";
                    let _tbl = "ant_forest";
                    let _SQLiteDatabaseFactory = require("./Modules/MODULE_DATABASE");
                    /** @memberOf _SQLiteDatabaseFactory */
                    $$app.db = new _SQLiteDatabaseFactory(_path, _tbl, [
                        {name: "name", not_null: true},
                        {name: "timestamp", type: "integer", primary_key: true},
                        {name: "pick", type: "integer"},
                        {name: "help", type: "integer"}
                    ]);

                    return this;
                },
                init() {
                    _setInitAutojsState();
                    _addSelectors();

                    // tool function(s) //

                    function _setInitAutojsState() {
                        let _aj = $$app.page.autojs;
                        if (_aj.spring_board.on()) {
                            $$app.init_autojs_state = {
                                init_fg: _aj.is_fg,
                                init_home: _aj.is_home,
                                init_log: _aj.is_log,
                                init_settings: _aj.is_settings,
                            };
                        }
                    }

                    function _addSelectors() {
                        $$sel.add("af", "蚂蚁森林")
                            .add("alipay_home", [/首页|Homepage/, {bi$: [0, cY(0.7), W, H]}])
                            .add("af_title", [/蚂蚁森林|Ant Forest/, {bi$: [0, 0, cX(0.4), cY(0.2)]}])
                            .add("af_home", /合种|背包|通知|攻略|任务|.*大树养成.*/)
                            .add("rl_title", $$app.rl_title)
                            .add("rl_ent", /查看更多好友|View more friends/)
                            .add("rl_end_idt", /.*没有更多.*/)
                            .add("list", className("ListView"))
                            .add("fri_frst_tt", [/.+的蚂蚁森林/, {bi$: [0, 0, cX(0.95), cY(0.2)]}])
                            .add("cover_used", /.*使用了保护罩.*/)
                            .add("wait_awhile", /.*稍等片刻.*/)
                            .add("reload_fst_page", "重新加载")
                            .add("close_btn", /关闭|Close/)
                            .add("login_btn", /登录|Log in|.*loginButton/)
                            .add("login_new_acc", /换个新账号登录|[Aa]dd [Aa]ccount/)
                            .add("login_other_acc", /换个账号登录|.*switchAccount/)
                            .add("login_other_mthd_init_pg", /其他登录方式|Other accounts/)
                            .add("login_other_mthd", /换个方式登录|.*[Ss]w.+[Ll]og.+thod/)
                            .add("login_by_code", /密码登录|Log ?in with password/)
                            .add("login_next_step", /下一步|Next|.*nextButton/)
                            .add("input_lbl_acc", /账号|Account/)
                            .add("input_lbl_code", /密码|Password/)
                            .add("acc_sw_pg_ident", /账号切换|Accounts/)
                            .add("login_err_ensure", idMatches(/.*ensure/))
                            .add("login_err_msg", (type) => {
                                let _t = type || "txt";
                                return $$sel.pickup(id("com.alipay.mobile.antui:id/message"), _t)
                                    || $$sel.pickup([$$sel.get("login_err_ensure"), "p2c0>0>0"], _t)
                            })
                            .add("acc_logged_out", new RegExp(".*("
                                + /在其他设备登录|logged +in +on +another/.source + "|"
                                + /.*账号于.*通过.*登录.*|account +logged +on +to/.source + ").*"));
                    }
                },
            };
        }

        function accSetter() {
            return {
                setParams() {
                    global.$$acc = {
                        switch: $$cfg.account_switch,
                        user_list: {
                            _plans: {
                                intent() {
                                    appx.startActivity($$app.intent.acc_man);
                                },
                                pipeline() {
                                    $$app.page.alipay.home({debug_info_flag: false});

                                    return clickActionsPipeline([
                                        [["我的", "p1"]],
                                        [["设置", {clickable: true}]],
                                        [["换账号登录", null]],
                                    ], {name: "账号切换页面", default_strategy: "widget"});
                                },
                            },
                            launch(plans_arr) {
                                debugInfo('打开"账号切换"页面');

                                // TODO if (!plans_arr) loadFromConfig
                                return (plans_arr || ["intent", "pipeline"]).some((plan) => {
                                    let _task_nm = "计划" + surroundWith(plan);
                                    this._plans[plan]();
                                    if (waitForAction(this.isInPage, 2e3)) {
                                        debugInfo(_task_nm + "成功");
                                        return true;
                                    }
                                    debugInfo(_task_nm + "失败");
                                }) || messageAction('进入"账号切换"页面失败', 4, 1, 0, "2_dash");
                            },
                            parse(name_str) {
                                if (!this.isInPage()) {
                                    messageAction("解析用户名信息失败", 4, 1, 0, -1);
                                    messageAction("当前非账户切换页面", 8, 0, 1, 1);
                                }

                                let _sltr = idMatches(/.*list_arrow/);
                                waitForAction(() => _sltr.exists(), 2e3); // just in case
                                sleep(300);

                                // current logged in user abbr (with a list arrow)
                                let _cur_abbr = $$sel.pickup([_sltr, "s<1c0>0"], "txt");
                                // abbr of param "name_str"
                                let _name_abbr = this.getAbbrFromList(name_str);
                                // let _is_logged_in = $$acc.isMatchAbbr(name_str, _cur_abbr);
                                let _is_logged_in = _cur_abbr === _name_abbr;
                                let _is_in_list = _is_logged_in || _name_abbr;

                                return {
                                    cur_abbr: _cur_abbr,
                                    abbr: _name_abbr,
                                    is_logged_in: _is_logged_in,
                                    is_in_list: _is_in_list,
                                };
                            },
                            isInList(name_str) {
                                return $$sel.pickup(/.+\*{3,}.+/, "wc").some((w) => {
                                    let _abbr_name = $$sel.pickup(w, "txt");
                                    if ($$acc.isMatchAbbr(name_str, _abbr_name)) {
                                        return this.abbr_name_in_list = _abbr_name;
                                    }
                                });
                            },
                            isInPage() {
                                return $$acc.isInSwAccPg();
                            },
                            makeInPage(force) {
                                return !force && this.isInPage() || this.launch();
                            },
                            getAbbrFromList(name_str) {
                                return this.isInList(name_str) ? this.abbr_name_in_list : "";
                            },
                        },
                        _codec(str, opr) {
                            let _str = str || "";
                            let _res = "";
                            let _fct = {e: 1, d: -1}[opr[0]];
                            for (let i in _str) {
                                _res += String.fromCharCode(
                                    _str.charCodeAt(+i) + ((996).ICU + +i) * _fct
                                );
                            }
                            return _res;
                        },
                        encode(str) {
                            if (str) {
                                return this._codec(str, "enc");
                            }
                            messageAction("编码参数为空", 8, 1, 0, 2);
                        },
                        decode(str) {
                            if (str) {
                                return this._codec(str, "dec");
                            }
                            messageAction("解码参数为空", 8, 1, 0, 2);
                        },
                        isLoggedIn(name_str) {
                            let _this = this;

                            return _ready() && _check();

                            // tool function(s) //

                            function _ready() {
                                // TODO...
                                return _this.isInSwAccPg() || _this.user_list.launch();
                            }

                            function _check() {
                                debugInfo("检查账号列表登录状态");

                                let _parsed = _this.user_list.parse(name_str);

                                if (!_parsed.abbr) {
                                    debugInfo("当前登录账户缩略名无效", 3);
                                } else if (!$$acc.init_logged_in_usr) {
                                    debugInfo("记录初始登录账户缩略名");
                                    $$acc.init_logged_in_usr = _parsed.abbr;
                                    if ($$acc.main.isMain(name_str) && _parsed.is_logged_in) {
                                        $$flag.init_logged_in_main = true;
                                    }
                                }

                                if (_parsed.is_logged_in) {
                                    debugInfo("目标账户已在登录状态");
                                    return true;
                                }

                                if (_parsed.is_in_list) {
                                    debugInfo("目标账户在账号列表中但未登录");
                                } else {
                                    debugInfo("目标账户不在账号列表中");
                                }
                            }
                        },
                        isInLoginPg() {
                            return $$sel.get("login_other_acc")
                                || $$sel.get("input_lbl_acc")
                                || $$sel.get("login_other_mthd_init_pg");
                        },
                        isInSwAccPg() {
                            return $$sel.get("login_new_acc")
                                || $$sel.get("acc_sw_pg_ident");
                        },
                        isMatchAbbr(name_str, abbr) {
                            name_str = name_str.toString();
                            abbr = abbr.toString();

                            if (!name_str || !abbr) {
                                return false;
                            }

                            let [i, j, k] = [0, name_str.length - 1, abbr.length - 1];
                            let _same = (p, q) => name_str[p] === abbr[q];
                            let _isAbbrStar = q => abbr[q] === "*";

                            for (; i <= j; i += 1) {
                                if (!_same(i, i)) {
                                    if (_isAbbrStar(i)) {
                                        break;
                                    }
                                    return false;
                                }
                            }

                            if (i > j) {
                                return true;
                            }

                            for (; j > i, k > i; j -= 1, k -= 1) {
                                if (!_same(j, k)) {
                                    if (_isAbbrStar(k)) {
                                        break;
                                    }
                                    return false;
                                }
                            }

                            return abbr.slice(i, k + 1).match(/^\*+$/);
                        },
                        /**
                         * @param user {object}
                         * @param {string} [user.abbr] - abbr username
                         * @param {string} [user.name] - full username without encryption
                         * @param {string} [user.name_raw] - encrypted username
                         * @param {string} [user.code_raw] - encrypted code
                         * @param {boolean} [user.direct] - login without acc list check
                         */
                        login(user) {
                            return _ready() && _parse() && _login();

                            // tool function(s) //

                            function _ready() {
                                if (!$$obj(user)) {
                                    messageAction("登录参数类型无效: " + classof(user), 8, 1, 0, 2);
                                }
                                if (!user.name && !user.abbr && !user.name_raw) {
                                    messageAction("usr_info参数缺少必要属性", 8, 1, 0, 2);
                                }
                                return user.direct || $$acc.user_list.makeInPage();
                            }

                            function _parse() {
                                this.abbr = user.abbr;
                                this.name = user.name;
                                this.code_raw = user.code_raw;

                                if (!user.name && user.name_raw) {
                                    this.name = $$acc.decode(user.name_raw);
                                }

                                if (!user.direct && !user.abbr) {
                                    this.abbr = $$acc.user_list.parse(this.name).abbr;
                                }

                                return true;
                            }

                            function _login() {
                                let _this = this;
                                let _name_str = _this.abbr || _this.name;
                                let _loggedIn = () => $$acc.isLoggedIn(_name_str);

                                return (_byUsrList() || _byInputText()) && _clearFlag();

                                // tool function(s) //

                                function _byUsrList() {
                                    return _ready() && _loginAndCheck();

                                    // tool function(s) //

                                    function _ready() {
                                        if (!_name_str) {
                                            debugInfo("无法使用列表快捷切换账户", 3);
                                            debugInfo(">缺少必要的账户名称信息", 3);
                                        }
                                        if (!user.direct) {
                                            return true;
                                        }
                                        debugInfo("放弃使用列表快捷切换账户", 3);
                                        debugInfo(">检测到直接登录参数", 3);
                                    }

                                    function _loginAndCheck() {
                                        if (_loggedIn()) {
                                            return true;
                                        }
                                        if (!_this.abbr) {
                                            return false;
                                        }

                                        let _conds = {
                                            name: "列表快捷切换账户",
                                            time: 1, // 1 min
                                            wait: [{
                                                remark: "登录中进度条",
                                                cond: () => $$sel.pickup(className("ProgressBar")),
                                            }],
                                            success: [{
                                                remark: "支付宝首页",
                                                cond: () => $$sel.get("alipay_home"),
                                            }, {
                                                remark: "H5关闭按钮",
                                                cond: () => $$sel.get("close_btn"),
                                            }],
                                            fail: [{
                                                remark: "出现登录页面",
                                                cond: () => $$acc.isInLoginPg(),
                                            }],
                                            timeout_review: [{
                                                remark: "强制账号列表检查",
                                                cond: () => _loggedIn(),
                                            }]
                                        };

                                        for (let i = 0; i < 3; i += 1) {
                                            debugInfo((i ? "再次尝试" : "") + "点击列表中的账户");
                                            clickAction($$sel.pickup([_this.abbr, "p5"]), "w");

                                            debugInfo("开始监测账户切换结果");
                                            if (!_condChecker(_conds)) {
                                                return false;
                                            }
                                            if (_loggedIn()) {
                                                return true;
                                            }
                                        }
                                    }
                                }

                                function _byInputText() {
                                    let _err_msg = () => $$sel.get("login_err_msg");
                                    let _err_ens = () => $$sel.get("login_err_ensure");

                                    return _ready() && _login() && _check();

                                    // tool function(s) //

                                    function _ready() {
                                        if (!$$str(_this.name)) {
                                            return;
                                        }

                                        let _cond = () => {
                                            if ($$sel.get("acc_logged_out")) {
                                                clickAction($$sel.pickup(/好的|OK/), "w");
                                            }
                                            return $$acc.isInLoginPg() || $$acc.isInSwAccPg();
                                        };

                                        if (!waitForAction(_cond, 3e3)) {
                                            return messageAction("无法判断当前登录页面状态", 4, 1, 0, 2);
                                        }

                                        if (!$$acc.isInLoginPg()) {
                                            let _w = $$sel.get("login_new_acc");
                                            if (!clickAction($$sel.pickup([_w, "p4"]), "w")) {
                                                appx.startActivity($$app.intent.acc_login);
                                            }
                                        }

                                        return _clickOtherBtnIFN();

                                        // tool function(s) //

                                        function _clickOtherBtnIFN() {
                                            let _acc, _lbl, _mthd;
                                            let _a = () => _acc = $$sel.get("login_other_acc");
                                            let _m = () => _mthd = $$sel.get("login_other_mthd_init_pg");
                                            let _lb = () => _lbl = $$sel.get("input_lbl_acc");

                                            waitForAction(() => _a() || _m() || _lb(), 3e3);

                                            if (_acc) {
                                                debugInfo('点击"换个账号登录"按钮');
                                                clickAction(_acc, "w");
                                            } else if (_mthd) {
                                                debugInfo('点击"其他登录方式"按钮');
                                                clickAction(_mthd, "w");
                                            }

                                            return waitForAction(_lb, 3e3); // just in case
                                        }
                                    }

                                    function _login() {
                                        let _lbl_code = () => $$sel.get("input_lbl_code");

                                        return _inputName(_this.name) && _inputCode(_this.code_raw);

                                        // tool function(s) //

                                        function _inputName(name) {
                                            debugInfo("尝试完成账户名输入");

                                            return _input() && _next();

                                            // tool function(s) //

                                            function _input() {
                                                let _w_acc = null;
                                                let _sel_acc = () => _w_acc = $$sel.get("input_lbl_acc");

                                                let _inputted = () => $$sel.pickup(name);
                                                let _noInputted = () => !_inputted();
                                                let _cA = () => waitForAction(_inputted, 1e3);
                                                let _cB = () => !waitForAction(_noInputted, 500);

                                                let _max = 3;
                                                while (_max--) {
                                                    if (waitForAction(_sel_acc, 1.5e3)) {
                                                        debugInfo('找到"账号"输入项控件');
                                                        let _w = $$sel.pickup([_w_acc, "p2c1"]);
                                                        let _res = false;
                                                        if (_w) {
                                                            debugInfo('布局树查找可编辑"账号"控件成功');
                                                            _res = _w.setText(name);
                                                        } else {
                                                            debugInfo('布局树查找可编辑"账号"控件失败', 3);
                                                            debugInfo("尝试使用通用可编辑控件", 3);
                                                            let _edit = className("EditText").findOnce();
                                                            _res = _edit && _edit.setText(name);
                                                        }
                                                        let _suffix = _res ? "成功" : "失败";
                                                        let _lv = _res ? 0 : 3;
                                                        debugInfo("控件输入账户名" + _suffix, _lv);
                                                    } else {
                                                        messageAction(
                                                            '布局查找"账号"输入项控件失败', 3, 0, 0, "up_dash");
                                                        messageAction(
                                                            "尝试盲输", 3, 0, 0, "dash");
                                                        setText(0, name);
                                                    }
                                                    if (_cA() && _cB()) {
                                                        break;
                                                    }
                                                }

                                                if (_max >= 0) {
                                                    debugInfo("成功输入账户名");
                                                    return true;
                                                }
                                                messageAction("输入账户名后检查输入未通过", 4, 1, 0, "2_dash");
                                            }

                                            function _next() {
                                                _require() && _click();
                                                return _check();

                                                // tool function(s) //

                                                function _require() {
                                                    let _s = '无需点击"下一步"按钮';
                                                    if (_lbl_code()) {
                                                        return debugInfo([_s, '>存在"密码"输入项控件']);
                                                    }
                                                    if ($$sel.get("login_btn")) {
                                                        return debugInfo([_s, '>存在"登录"按钮控件']);
                                                    }
                                                    return true;
                                                }

                                                function _click() {
                                                    debugInfo('点击"下一步"按钮');
                                                    let _sel = () => $$sel.get("login_next_step");
                                                    clickAction($$sel.pickup([_sel(), "p1"]), "w", {
                                                        max_check_times: 3,
                                                        check_time_once: 500,
                                                        condition_success: () => !_sel(),
                                                    });
                                                }

                                                function _check() {
                                                    let _again = () => $$sel.pickup(/重新输入|Try again/);
                                                    let _other = () => $$sel.get("login_other_mthd");
                                                    let _by_code = () => $$sel.get("login_by_code");
                                                    let _cond = () => (
                                                        _lbl_code() || _err_ens() || _other() || _again()
                                                    );
                                                    if (!waitForAction(_cond, 8e3)) {
                                                        let _s = '查找"密码"输入项控件超时';
                                                        return messageAction(_s, 4, 1, 0, "2_dash");
                                                    }
                                                    let _max = 3;
                                                    while (_max--) {
                                                        if (waitForAction(_lbl_code, 1.5e3)) {
                                                            debugInfo('找到"密码"输入项控件');
                                                            return true;
                                                        }
                                                        if (_err_ens() || _again()) {
                                                            let _err = "失败提示信息:" + _err_msg();
                                                            messageAction("登录失败", 4, 1, 0, -1);
                                                            messageAction(_err, 8, 0, 1, 1);
                                                        }
                                                        if (_other()) {
                                                            debugInfo('点击"换个方式登录"按钮');
                                                            clickAction(_other(), "w");
                                                            if (!waitForAction(_by_code, 2e3)) {
                                                                let _m = '未找到"密码登录"按钮';
                                                                return messageAction(_m, 4, 1, 0, "2_dash");
                                                            }
                                                            debugInfo('点击"密码登录"按钮');
                                                            clickAction(_by_code().parent(), "w");
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        function _inputCode(code_raw) {
                                            debugInfo("尝试完成密码输入");

                                            return code_raw ? _autoIpt() : _manIpt();

                                            // tool function(s) //

                                            function _autoIpt() {
                                                debugInfo("尝试自动输入密码");

                                                let _dec = require("./Modules/MODULE_PWMAP").decrypt;
                                                let _pref = '布局树查找可编辑"密码"控件';
                                                let _sel = $$sel.pickup([_lbl_code(), "p2c1"]);
                                                if (_sel && _sel.setText(_dec(code_raw))) {
                                                    debugInfo(_pref + "成功");
                                                } else {
                                                    debugInfo([_pref + "失败", "尝试使用通用可编辑控件"], 3);
                                                    let _w = className("EditText").findOnce();
                                                    let _input = _w && _w.setText(_dec(code_raw));
                                                    let _suff = _input ? "成功" : "失败";
                                                    debugInfo("通用可编辑控件输入" + _suff, _input ? 0 : 3);
                                                }

                                                debugInfo('点击"登录"按钮');
                                                if (clickAction($$sel.get("login_btn"), "w")) {
                                                    return true;
                                                }
                                                messageAction('输入密码后点击"登录"失败', 4, 1, 0, "2_dash");
                                            }

                                            function _manIpt() {
                                                debugInfo("需要手动输入密码");
                                                devicex.vibrate([100, 200, 100, 200, 200]);

                                                let _user_tt = 2; // min
                                                let _btn_tt = 2; // min
                                                $$flag.glob_e_scr_paused = true;
                                                devicex.keepOn(Math.floor(_user_tt + _btn_tt) * 60e3);

                                                let _flag = false;
                                                threadsx.starts(_thdUserAct);

                                                while (!_flag) {
                                                    sleep(500);
                                                }

                                                // prevent screen from turning off immediately
                                                click(1e5, 1e5);
                                                delete $$flag.glob_e_scr_paused;
                                                devicex.cancelOn();

                                                return true;

                                                // tool function(s) //

                                                function _thdUserAct() {
                                                    let _d = dialogsx.builds([
                                                        "需要密码", "login_password_needed",
                                                        0, 0, "确定", 1
                                                    ]).on("positive", d => d.dismiss()).show();

                                                    _flag = _waitForCode() && _waitForBtn();

                                                    // tool function(s) //

                                                    function _waitForCode() {
                                                        debugInfo('等待用户响应"需要密码"对话框');
                                                        debugInfo('>最大超时时间: ' + _user_tt + '分钟');

                                                        let _cond = () => _d.isCancelled()
                                                            && !waitForAction(() => !_d.isCancelled(), 2e3);
                                                        if (waitForAction(_cond, _user_tt * 60e3)) {
                                                            return true;
                                                        }
                                                        devicex.cancelOn();
                                                        _d.dismiss();
                                                        messageAction("脚本无法继续", 4, 0, 0, -1);
                                                        messageAction("登录失败", 4, 0, 1);
                                                        messageAction("需要密码时等待用户响应超时", 8, 1, 1, 1);
                                                    }

                                                    function _waitForBtn() {
                                                        debugInfo('等待用户点击"登录"按钮');
                                                        debugInfo(">最大超时时间: " + _btn_tt + "分钟");

                                                        let _rex = ".*(confirmSet.*|mainTip|登录中.*|message)";
                                                        let _cond = () => !$$sel.get("login_btn")
                                                            && !waitForAction(() => (
                                                                $$sel.pickup(_rex) || _err_ens()
                                                            ), 500);
                                                        if (!waitForAction(_cond, _btn_tt * 60e3)) {
                                                            devicex.cancelOn();
                                                            _d.dismiss(); // just in case
                                                            messageAction("脚本无法继续", 4, 0, 0, -1);
                                                            messageAction("登录失败", 4, 0, 1);
                                                            messageAction('等待"登录"按钮消失超时', 8, 1, 1, 1);
                                                        }
                                                        return true;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    function _check() {
                                        let _conds = {
                                            name: "登录账户",
                                            time: 0.5, // 30 sec
                                            wait: [{
                                                remark: "登录中进度条",
                                                cond: () => $$sel.pickup(/.*登录中.*/),
                                            }],
                                            success: [{
                                                remark: "支付宝首页",
                                                cond: () => $$sel.get("alipay_home"),
                                            }, {
                                                remark: "H5关闭按钮",
                                                cond: () => $$sel.get("close_btn"),
                                            }, {
                                                remark: "支付宝设置页面",
                                                cond: () => $$sel.pickup(/(退出|换账号)登录/),
                                            }],
                                            fail: [{
                                                remark: "失败提示",
                                                cond: () => _err_ens(),
                                                feedback() {
                                                    devicex.cancelOn();
                                                    messageAction("脚本无法继续", 4, 0, 0, -1);
                                                    messageAction("登录失败", 4, 1, 1);
                                                    messageAction("失败提示信息:" + _err_msg(), 8, 0, 1, 1);
                                                },
                                            }, {
                                                remark: "失败提示",
                                                cond: () => $$sel.pickup(/.*confirmSetting|.*mainTip/),
                                                feedback() {
                                                    let _fail_pref = "失败提示信息: ";
                                                    let _fail_main = $$sel.pickup(/.*mainTip/, "txt");
                                                    let _fail_msg = _fail_pref + _fail_main;
                                                    devicex.cancelOn();
                                                    messageAction("脚本无法继续", 4, 0, 0, -1);
                                                    messageAction("登录失败", 4, 1, 1);
                                                    messageAction(_fail_msg, 8, 0, 1, 1);
                                                },
                                            }],
                                            timeout_review: [{
                                                remark: "强制账号列表检查",
                                                cond() {
                                                    if ($$acc.isLoggedIn(_this.name)) {
                                                        return true;
                                                    }
                                                    messageAction("脚本无法继续", 4, 0, 0, -1);
                                                    messageAction("切换主账户超时", 8, 1, 1, 1);
                                                },
                                            }]
                                        };

                                        return _condChecker(_conds);
                                    }
                                }

                                function _condChecker(cond) {
                                    if (!$$obj(cond)) {
                                        debugInfo(["条件检查器参数无效", ">" + classof(cond)]);
                                        return false;
                                    }

                                    let _name = cond.name || "条件检查";
                                    debugInfo("开始" + (cond.name || "") + "条件检查");

                                    let _t = cond.time || 1;
                                    _t *= _t < 100 ? 60e3 : 1;

                                    devicex.keepOn(_t + 5 * 60e3);

                                    let _res = _checker();

                                    devicex.cancelOn();

                                    return _res;

                                    // tool function(s) //

                                    function _checker() {
                                        while (_t > 0) {
                                            if (_meetCond(cond.success, "success")) {
                                                debugInfo(_name + "成功");
                                                return true;
                                            }
                                            if (_meetCond(cond.fail, "fail")) {
                                                return debugInfo(_name + "失败", 3);
                                            }
                                            if (!_meetCond(cond.wait, "wait")) {
                                                _t -= 500;
                                            }
                                            sleep(500);
                                        }

                                        debugInfo("确定性条件检查已超时");
                                        if (!cond.timeout_review) {
                                            return debugInfo(_name + "失败", 3);
                                        }

                                        debugInfo("开始检查超时复检条件");
                                        if (_meetCond(cond.timeout_review, "timeout_review")) {
                                            debugInfo(_name + "成功");
                                            return true;
                                        }
                                        debugInfo(["超时复检失败", _name + "失败"], 3);

                                        // tool function(s) //

                                        function _meetCond(cond_arr, type) {
                                            return (cond_arr || []).some((cond_o) => {
                                                let _o = cond_o || {};
                                                if ($$func(_o.cond) && _o.cond()) {
                                                    let _types = {
                                                        "success": "成功",
                                                        "fail": "失败",
                                                        "wait": "持续等待",
                                                        "timeout_review": "超时复检成功",
                                                    };
                                                    debugInfo("满足" + _types[type] + "条件");
                                                    _o.remark && debugInfo(">" + _o.remark);
                                                    if (type === "wait") {
                                                        while (_o.cond()) {
                                                            sleep(300);
                                                        }
                                                    }
                                                    if ($$func(_o.feedback)) {
                                                        debugInfo("检测到反馈方法");
                                                        _o.feedback.call(_o);
                                                    }
                                                    return true;
                                                }
                                            });
                                        }
                                    }
                                }

                                function _clearFlag() {
                                    debugInfo("清除账户登出标记");
                                    delete $$flag.acc_logged_out;
                                    return true;
                                }
                            }
                        },
                        logBack() {
                            let _sto_key = "log_back_in_user";
                            if ($$flag.init_logged_in_main) {
                                debugInfo(["无需回切账户", ">初始登录账户已是主账户"]);
                                return _clearSto();
                            }

                            if (!$$cfg.account_log_back_in_switch) {
                                debugInfo(["无需回切账户", ">旧账户回切功能未开启"]);
                                return _clearSto();
                            }

                            let _init_usr = this.init_logged_in_usr;
                            if (!_init_usr) {
                                debugInfo(["无法回切账户", ">未获取初始登录账户信息"]);
                                return _clearSto();
                            }

                            let _init_data = {name: _init_usr, times: 0};
                            let _sto_data = $$sto.af.get(_sto_key, _init_data);
                            if (_sto_data.name !== _init_usr) {
                                _sto_data = _init_data;
                            }

                            let _k = "account_log_back_in_max_continuous_times";
                            if (_sto_data.times >= $$cfg[_k]) {
                                debugInfo(["禁止回切账户", ">此旧账户回切次数已达上限"]);
                                debugInfo(">上限值: " + $$cfg[_k]);
                                return _clearSto();
                            }

                            debugInfo("开始旧账户回切操作");
                            debugInfo(">当前连续回切次数: " + ++_sto_data.times);

                            if (!$$acc.login(_init_usr)) {
                                debugInfo("旧账户回切失败", 3);
                                return _clearSto();
                            }
                            debugInfo("旧账户回切成功");

                            $$sto.af.put(_sto_key, _sto_data);
                            debugInfo("已更新回切账户存储信息");

                            // tool function(s) //

                            function _clearSto() {
                                if ($$sto.af.contains(_sto_key)) {
                                    $$sto.af.remove(_sto_key);
                                    debugInfo("已清理回切账户存储信息");
                                }
                            }
                        },
                    };

                    return this;
                },
                setMain() {
                    $$acc.main = {
                        _avatar: {
                            _path: $$app.local_pics_path + "main_user_mini_avatar_clip.png",
                            _isTotalGreen(img) {
                                return imagesx.findAllPointsForColor(
                                    img, "#30bf6c", {threshold: 2}
                                ).length > img.height * img.width * 0.98;
                            },
                            isValid(path) {
                                if ($$flag.acc_logged_out) {
                                    return debugInfo(["跳过主账户头像检查", ">检测到账户登出状态"]);
                                }

                                let _img = images.read(path || this._path);
                                timeRecorder("avt_chk");
                                let _res = _img && _check.call(this, _img);
                                $$app.avatar_checked_time = timeRecorder("avt_chk", "L", "auto");

                                if (_res) {
                                    debugInfo(["当前账户符合主账户身份", ">本地主账户头像匹配成功"]);
                                    return $$flag.init_logged_in_main = true;
                                }
                                debugInfo(["主账户身份检查未通过", ">本地主账户头像不匹配"]);

                                // tool function(s) //

                                function _check(img) {
                                    if (this.checkGreen(img)) {
                                        let _avt = this.getAvtClip();
                                        if (_avt && images.findImage(_avt, img, {level: 1})) {
                                            this._avt_clip_cached = _avt;
                                            imagesx.reclaim(_avt);
                                            _avt = null;
                                            return true;
                                        }
                                    }
                                }
                            },
                            /** @returns {boolean|ImageWrapper$} */
                            getAvtClip() {
                                let _b = null;
                                waitForAction(() => _b = _getAvtPos(), 8e3, 100);

                                if (!_b || $$emptyObj(_b)) {
                                    messageAction("无法获取当前头像样本", 3);
                                    messageAction("森林主页头像控件定位失败", 3, 1);
                                    return false;
                                }

                                let [l, t, w, h] = [_b.left, _b.top, _b.width(), _b.height()];
                                if (w < 3 || h < 3) {
                                    messageAction("无法继续匹配当前头像样本", 3, 0, 0, "dash_up");
                                    messageAction("森林主页头像控件数据无效", 3, 0, 1, "dash");
                                    return false;
                                }

                                let _avt_clip;
                                let _chk = this.checkGreen.bind(this);
                                waitForAction(() => _chk(_avt_clip = _getAvtClip()), 2e3);

                                return _avt_clip;

                                // tool function(s) //

                                function _getAvtPos() {
                                    let _bnd = null;
                                    void [
                                        "我的大树养成记录",
                                        [idMatches(/.*us.r.+e.+gy/), "p2c0"],
                                        ["种树", {className: "Button"}, "p1c0"],
                                        [idMatches(/.*home.*panel/), "c0>0>0"],
                                    ].some((kw) => {
                                        if (!!(_bnd = $$sel.pickup(kw, "bounds"))) {
                                            debugInfo("森林主页头像控件定位成功");
                                            return true;
                                        }
                                    });
                                    return _bnd;
                                }

                                function _getAvtClip() {
                                    // chop: here means chopped
                                    let w_chop = w / Math.SQRT2;
                                    let h_chop = h / Math.SQRT2;

                                    let _scr_capt = imagesx.capt();

                                    // A. get the biggest rectangle area inside the circle (or ellipse)
                                    // B. one pixel from each side of the area was removed
                                    let _clip = images.clip(_scr_capt,
                                        l + (w - w_chop) / 2 + 1, // x
                                        t + (h - h_chop) / 2 + 1, // y
                                        w_chop - 2, h_chop - 2);  // w, h

                                    imagesx.reclaim(_scr_capt);
                                    _scr_capt = null;

                                    return _clip;
                                }
                            },
                            save(path) {
                                let _avt_clip = this._avt_clip_cached || this.getAvtClip();
                                if (_avt_clip) {
                                    images.save(_avt_clip, path || this._path);
                                    imagesx.reclaim(_avt_clip);
                                    _avt_clip = null;
                                    delete this._avt_clip_cached;
                                    return true;
                                }
                            },
                            checkGreen(clip) {
                                return !this._isTotalGreen(clip);
                            },
                        },
                        _avail() {
                            if (!$$acc.switch) {
                                return debugInfo("账户功能未开启");
                            }
                            if (!this.name_raw) {
                                return debugInfo("主账户用户名未设置");
                            }
                            return true;
                        },
                        name_raw: $$cfg.main_account_info.account_name,
                        code_raw: $$cfg.main_account_info.account_code,
                        isMain(name_str) {
                            return $$acc.isMatchAbbr(name_str, $$acc.decode(this.name_raw));
                        },
                        login(par) {
                            if (!this._avail()) {
                                return;
                            }
                            if (this._avatar.isValid()) {
                                return true;
                            }
                            if (_loginMain()) {
                                $$app.page.af.launch();
                                this._avatar.save();
                                return true;
                            }
                            messageAction("强制停止脚本", 4, 0, 0, -1);
                            messageAction("主账户登录失败", 8, 1, 1, 1);

                            // tool function(s) //

                            function _loginMain() {
                                return $$acc.login(Object.assign({
                                    name_raw: $$acc.main.name_raw,
                                    code_raw: $$acc.main.code_raw,
                                }, par || {}));
                            }
                        },
                    };

                    return this;
                },
            };
        }
    },
    queue() {
        let _my_e = $$app.my_engine;
        let _my_e_id = $$app.my_engine_id;
        let _excl_tag = "exclusive_task";
        let _ts_tag = "launch_timestamp";
        _my_e.setTag(_excl_tag, "af");
        _my_e.setTag(_ts_tag, $$app.ts);

        let _b = bombSetter();
        _b.trigger() && _b.explode();

        let _q = queueSetter();
        _q.trigger() && _q.monitor() && _q.queue();

        Object.defineProperties(this.queue, {
            bomb: {value: _b},
            queue: {value: _q},
        });

        return this;

        // tool function(s) //

        function bombSetter() {
            return {
                trigger() {
                    let _max = 20;
                    while (_max--) {
                        try {
                            return engines.all().filter((e) => {
                                let _gap = () => $$app.ts - e.getTag(_ts_tag);
                                return e.getTag(_excl_tag) === "af"
                                    && _my_e_id > e.id
                                    && _gap() < $$cfg.min_bomb_interval_global;
                            }).length;
                        } catch (e) {
                            // Wrapped java.util.ConcurrentModificationException
                            // exception happens with a tiny possibility
                            sleep(Math.rand([30, 80]));
                        }
                    }
                },
                explode() {
                    messageAction("脚本因安全限制被强制终止", 3, 0, 0, -1);
                    messageAction("连续运行间隔时长过小", 3, 0, 1);
                    messageAction("触发脚本炸弹预防阈值", 3, 0, 1, 1);
                    exit();
                },
            };
        }

        function queueSetter() {
            return {
                get excl_tasks_all() {
                    while (1) {
                        try {
                            return engines.all().filter(e => e.getTag(_excl_tag));
                        } catch (e) {
                            // Wrapped java.util.ConcurrentModificationException
                            // exception happens with a small possibility
                            sleep(Math.rand([20, 50]));
                        }
                    }
                },
                get excl_tasks_ahead() {
                    while (1) {
                        try {
                            return engines.all().filter((e) => (
                                e.getTag(_excl_tag) && e.id < _my_e_id
                            ));
                        } catch (e) {
                            // Wrapped java.util.ConcurrentModificationException
                            // exception happens with a small possibility
                            sleep(Math.rand([20, 50]));
                        }
                    }
                },
                get excl_tasks_ahead_len() {
                    return this.excl_tasks_ahead.length;
                },
                get excl_tasks_all_len() {
                    return this.excl_tasks_all.length;
                },
                trigger() {
                    return this.excl_tasks_ahead_len;
                },
                monitor() {
                    debugInfo("设置广播监听器");

                    events.broadcast.on("init_scr_on_state_change", (v) => {
                        debugInfo("接收到初始屏幕开关状态广播");
                        if (!$$init.queue.queue.excl_tasks_ahead_len) {
                            debugInfo("根据广播消息修改状态参数");
                            $$app.init_scr_on_from_broadcast = v;
                        } else {
                            debugInfo(["放弃广播消息", ">当前任务正在排队中"]);
                        }
                    });

                    return this;
                },
                queue() {
                    timeRecorder("sc_q"); // script queue
                    timeRecorder("sc_q_total");

                    let _init_que_len = this.excl_tasks_ahead_len;
                    let _que_len = _init_que_len;
                    let _sto_max_que_t = $$cfg.max_queue_time_global;
                    debugInfo("排他性任务排队中: " + _que_len + "项");

                    let _init_max_que_t = _sto_max_que_t * _que_len;
                    let _max_que_t = _init_max_que_t;
                    debugInfo("已设置最大排队时间: " + _max_que_t + "分钟");

                    while ((_que_len = this.excl_tasks_ahead_len)) {
                        if (_que_len !== _init_que_len) {
                            debugInfo("排他性任务队列发生变更", "up");
                            let _amt = _init_que_len + "->" + _que_len;
                            debugInfo("任务数量: " + _amt + "项");
                            _init_que_len = _que_len;
                            _max_que_t = _sto_max_que_t * _que_len;
                            let _t = _init_max_que_t + "->" + _max_que_t;
                            debugInfo("最大排队: " + _t + "分钟");
                            _init_max_que_t = _max_que_t;
                            timeRecorder("sc_q", "save"); // refresh
                        }
                        if (timeRecorder("sc_q", "L", 60e3) >= _max_que_t) {
                            this.excl_tasks_ahead.forEach(e => e.forceStop());
                            debugInfo("强制停止队前所有排他性任务");
                            debugInfo(">已达最大排队等待时间");
                        }
                        sleep(Math.rand([500, 1.5e3]));
                    }

                    let _et = timeRecorder("sc_q_total", "L", "auto");
                    debugInfo("任务排队用时: " + _et, "Up");
                },
            };
        }
    },
    delay() {
        let _fg = fgAppBlistSetter();
        _fg.trigger() ? _fg.autoDelay() : _fg.clear();

        return this;

        // tool function(s) //

        function fgAppBlistSetter() {
            return {
                trigger() {
                    return _screenOn() && _inBlist();

                    // tool function(s) //

                    function _screenOn() {
                        if ($$unlk.is_init_screen_on) {
                            return true;
                        }
                        debugInfo(["跳过前置应用黑名单检测", ">屏幕未亮起"]);
                    }

                    function _inBlist() {
                        return ($$cfg.foreground_app_blacklist || []).some((o) => {
                            let [_nm, _pkg] = o.app_combined_name.split("\n");
                            if ($$app.init_fg_pkg === _pkg) {
                                return $$app.fg_black_app = _nm;
                            }
                        }) || debugInfo(["前置应用黑名单检测通过:", $$app.init_fg_pkg]);
                    }
                },
                autoDelay() {
                    messageAction("前置应用位于黑名单中:", 1, 0, 0, -1);
                    messageAction($$app.fg_black_app);

                    let _delay = delayInfoSetter();
                    let _ctr = _delay.continuous_times;
                    let _time = _delay.delay_time;
                    let _sum = _delay.delay_time_sum;
                    if ($$1(_ctr)) {
                        messageAction("本次任务自动推迟运行");
                    } else {
                        messageAction("本次任务自动推迟: " + _time + "分钟");
                        messageAction("当前连续推迟次数: " + _ctr);
                        messageAction("当前连续推迟总计: " + _sum + "分钟");
                    }

                    $$sto.af.put("fg_blist_ctr", _ctr);
                    $$app.setPostponedTask(_time, false); // `exit()` contained
                    sleep(10e3); // in case task isn't set successfully before exit;
                    exit(); // thoroughly prevent script from going on (main thread)

                    // tool function(s) //

                    function delayInfoSetter(minutes) {
                        let _mm = minutes || [1, 1, 2, 3, 5, 8, 10];
                        let _ctr = $$sto.af.get("fg_blist_ctr", 0);
                        let _max_mm = _mm[_mm.length - 1];
                        let _time = _mm[_ctr] || _max_mm;
                        let _sum = 0;
                        for (let i = 0; i < _ctr; i += 1) {
                            _sum += _mm[i] || _max_mm;
                        }
                        return {
                            continuous_times: _ctr + 1,
                            delay_time: _time,
                            delay_time_sum: _sum,
                        };
                    }
                },
                clear: () => $$sto.af.remove("fg_blist_ctr"),
            };
        }
    },
    monitor() {
        // instant monitors with trigger
        let _isu = insuranceMonSetter();
        _isu.trigger() && _isu.clean().deploy().monitor();

        // instant and private monitors
        let _ist = instantMonSetter();
        _ist.maxRun().volKeys().globEvt().logOut();

        // monitors put on standby for $$app invoking
        $$app.monitor = standbyMonSetter();
        $$app.monitor.insurance = _isu;

        return this;

        // monitor function(s) //

        function insuranceMonSetter() {
            let _keys = {
                ins_tasks: "insurance_tasks",
                ins_accu: "insurance_tasks_continuous_times",
                ins_accu_max: "timers_insurance_max_continuous_times",
                ins_itv: "timers_insurance_interval",
            };

            return {
                trigger() {
                    if (!$$cfg.timers_switch) {
                        return debugInfo("定时循环功能未开启");
                    }
                    if (!$$cfg.timers_self_manage_switch) {
                        return debugInfo("定时任务自动管理未开启");
                    }
                    if (!$$cfg.timers_insurance_switch) {
                        return debugInfo("意外保险未开启");
                    }
                    if ($$app.my_engine_argv.no_insurance_flag) {
                        return debugInfo('检测到"无需保险"引擎参数');
                    }
                    let _max = $$cfg[_keys.ins_accu_max];
                    if (++this._sto_accu <= _max) {
                        return true;
                    }
                    debugInfo("本次会话不再设置保险定时任务");
                    debugInfo(">任务已达最大连续次数限制: " + _max);
                    this.reset();
                },
                get id() {
                    if (this.task) {
                        return this.task.id || -1;
                    }
                },
                get _sto_accu() {
                    return +$$sto.af.get(_keys.ins_accu, 0);
                },
                set _sto_accu(v) {
                    $$sto.af.put(_keys.ins_accu, +v);
                },
                get _sto_ids() {
                    return $$sto.af.get(_keys.ins_tasks, [])
                        .filter(id => timersx.getTimedTask(id));
                },
                get _next_task_time() {
                    return $$app.ts + $$cfg[_keys.ins_itv] * 60e3;
                },
                clean() {
                    let _ids = this._sto_ids;
                    if (_ids.length) {
                        _ids.forEach(id => timersx.removeTimedTask(id));
                        debugInfo(["已移除意外保险定时任务:", "任务ID: " + (
                            _ids.length > 1 ? "[ " + _ids.join(", ") + " ]" : _ids[0]
                        )]);
                    }
                    $$sto.af.remove(_keys.ins_tasks);
                    return this;
                },
                reset() {
                    this.clean();
                    this._sto_accu = 0;
                    return this;
                },
                deploy() {
                    let _this = this;
                    threadsx.starts(function () {
                        _this.task = timersx.addDisposableTask({
                            path: $$app.cwp,
                            date: _this._next_task_time,
                        });
                        let _itv = setInterval(() => {
                            if (_this.task) {
                                let _id = _this.task.id;
                                clearInterval(_itv);
                                let _ids = _this._sto_ids.concat([_id]);
                                $$sto.af.put(_keys.ins_tasks, _ids);
                                debugInfo("已设置意外保险定时任务");
                                debugInfo("任务ID: " + _id);
                            }
                        }, 360);
                    });
                    return this;
                },
                monitor() {
                    let _this = this;
                    this._thread = threadsx.starts(function () {
                        setInterval(() => {
                            if (_this.task) {
                                _this.task.setMillis(_this._next_task_time);
                                timersx.updateTimedTask(_this.task);
                            }
                        }, 10e3);
                    });
                    return this;
                },
                interrupt() {
                    this._thread && this._thread.interrupt();
                    return this;
                },
                remove() {
                    this.id > 0 && timersx.removeTimedTask(this.id);
                    return this;
                }
            };
        }

        function instantMonSetter() {
            return {
                maxRun() {
                    let _max = +$$cfg.max_running_time_global;

                    _max && threadsx.starts(function () {
                        setTimeout(() => {
                            ui.post(() => messageAction("超时强制退出", 8, 1, 0, "2_n"));
                        }, _max * 60e3 + 3e3);
                    });

                    return this;
                },
                volKeys() {
                    debugInfo("设置音量键监听器");

                    threadsx.starts(function () {
                        let _keyMsg = (e) => {
                            let _code = e.getKeyCode();
                            let _name = android.view.KeyEvent.keyCodeToString(_code);
                            return _name + " (" + _code + ")";
                        };
                        events.observeKey();
                        events.setKeyInterceptionEnabled("volume_up", true);
                        events.onceKeyDown("volume_up", function (e) {
                            messageAction("强制停止所有脚本", 4, 0, 0, -1);
                            messageAction("触发按键: 音量加/VOL+", 4, 0, 1);
                            messageAction(_keyMsg(e), 4, 0, 1, 1);
                            engines.stopAllAndToast();
                        });
                        events.setKeyInterceptionEnabled("volume_down", true);
                        events.onceKeyDown("volume_down", function (e) {
                            messageAction("强制停止当前脚本", 3, 1, 0, -1);
                            messageAction("触发按键: 音量减/VOL-", 3, 0, 1);
                            messageAction(_keyMsg(e), 3, 0, 1, 1);
                            $$app.my_engine.forceStop();
                        });
                    });

                    return this;
                },
                globEvt() {
                    $$flag.glob_e_trig_counter = 0;
                    let _constr = constrParamsSetter();

                    let _call_stat = new Monitor("通话状态", "2 hr", _constr.phone);
                    _call_stat.valid() && _call_stat.monitor();

                    let _scr_off = new Monitor("屏幕关闭", "2 min", _constr.screen);
                    _scr_off.valid() && _scr_off.monitor();

                    return this;

                    // constructor(s) //

                    /**
                     * @param {string} [desc]
                     * -- will show in console as the monitor name
                     * @param {string|number} [limit=Infinity]
                     * @param params {object}
                     * @param {boolean|string} [params.switching]
                     * -- monitor may be disabled according to $$cfg
                     * @param params.trigger {function}
                     * @param {function} [params.onTrigger]
                     * @param params.onRelease {function}
                     * @constructor
                     */
                    function Monitor(desc, limit, params) {
                        let _desc = surroundWith(desc);
                        let _limit = _handleLimitParam(limit);
                        let _sw = _handleSwitch(params.switching);
                        let _trigger = params.trigger;
                        let _onTrigger = params.onTrigger;
                        let _onRelease = params.onRelease;

                        this.valid = function () {
                            debugInfo(_desc + "事件监测" + (_sw ? "已" : "未") + "开启");
                            return _sw;
                        };
                        this.monitor = function () {
                            let _o = {
                                onTrigger() {
                                    $$flag.glob_e_trig_counter++;
                                    $$func(_onTrigger) && _onTrigger();
                                },
                                onTriggerMsg() {
                                    timeRecorder("glob_e" + _desc);
                                    messageAction("触发" + _desc + "事件", 1, 1, 0, "up_dash");
                                    messageAction(_getCountdownMsg(), 1, 0, 0, "dash");

                                    // tool function(s) //

                                    function _getCountdownMsg() {
                                        // to keep _limit unchanged
                                        let _lmt = _limit;
                                        let _pref = "等待事件解除";
                                        let _tpl = (unit) => {
                                            let _suffix = +_lmt.toFixed(2) + unit;
                                            return _pref + " (最多" + _suffix + ")";
                                        };
                                        if (isInfinite(_lmt)) {
                                            return _pref;
                                        }
                                        if (_lmt < 1e3) {
                                            return _tpl("毫秒");
                                        }
                                        if ((_lmt /= 1e3) < 60) {
                                            return _tpl("秒");
                                        }
                                        if ((_lmt /= 60) < 60) {
                                            return _tpl("分钟");
                                        }
                                        if ((_lmt /= 60) < 24) {
                                            return _tpl("小时");
                                        }
                                        return _lmt /= 24 && _tpl("天");
                                    }
                                },
                                keepWaiting() {
                                    while (_trigger()) {
                                        if (timeRecorder("glob_e" + _desc, "L") >= _limit) {
                                            messageAction("强制停止脚本", 4, 1, 0, -1);
                                            messageAction(_desc + "事件解除超时", 8, 1, 1, 1);
                                        }
                                        sleep(300);
                                    }
                                },
                                onReleaseMsg() {
                                    messageAction("解除" + _desc + "事件", 1, 0, 0, "up_dash");
                                    let _et = timeRecorder("glob_e" + _desc, "L", "auto");
                                    messageAction("解除用时: " + _et, 1, 0, 1, "dash");
                                },
                                onRelease() {
                                    $$func(_onRelease) && _onRelease();
                                    $$flag.glob_e_trig_counter--;
                                },
                            };
                            threadsx.starts(function () {
                                while (1) {
                                    if (_trigger()) {
                                        _o.onTrigger();
                                        _o.onTriggerMsg();
                                        _o.keepWaiting();
                                        _o.onReleaseMsg();
                                        _o.onRelease();
                                    } else {
                                        sleep(200);
                                    }
                                }
                            });
                        };

                        // tool function(s) //

                        function _handleLimitParam(lmt) {
                            if (!$$str(lmt)) {
                                lmt = +lmt;
                                if (lmt < 1e3) {
                                    lmt *= 1e3; // take as seconds
                                }
                                if (!lmt || lmt <= 0) {
                                    lmt = Infinity; // endless monitoring
                                }
                                return lmt;
                            }
                            if (lmt.match(/h((ou)?rs?)?/)) {
                                return lmt.match(/\d+/)[0] * 3.6e6;
                            }
                            if (lmt.match(/m(in(utes?))?/)) {
                                return lmt.match(/\d+/)[0] * 60e3;
                            }
                            if (lmt.match(/s(ec(conds?))?/)) {
                                return lmt.match(/\d+/)[0] * 1e3;
                            }
                            if (lmt.match(/m(illi)?s(ec(conds?))?/)) {
                                return lmt.match(/\d+/)[0] * 1;
                            }
                            return Infinity;
                        }

                        function _handleSwitch(sw) {
                            return $$bool(sw) ? sw : $$str(sw) ? $$cfg[sw] : true;
                        }
                    }

                    // tool function(s) //

                    function constrParamsSetter() {
                        return {
                            phone: {
                                switching: "phone_call_state_monitor_switch",
                                trigger() {
                                    let _self = {
                                        state_key: "phone_call_state_idle_value",
                                        get cur_state() {
                                            return $$cfg[this.state_key];
                                        },
                                        set cur_state(val) {
                                            let _dat = {};
                                            let _key = this.state_key;
                                            $$cfg[_key] = _dat[_key] = val;
                                            $$sto.af_cfg.put("config", _dat);
                                        },
                                    };
                                    return devicex.getCallState() !== getCurState();

                                    // tool function(s) //

                                    function getCurState() {
                                        let _cur_state = _self.cur_state;
                                        if (!$$und(_cur_state)) {
                                            return _cur_state;
                                        }

                                        // won't write into storage
                                        _cur_state = devicex.getCallState();

                                        let _sto = _stoSetter();
                                        return $$und(_sto.filled_up) ? _sto.fillIn() : _sto.reap();

                                        // tool function(s) //

                                        function _stoSetter() {
                                            return {
                                                _key: "phone_call_states",
                                                get states() {
                                                    return $$sto.af.get(this._key, []);
                                                },
                                                set states(arr) {
                                                    $$sto.af.put(this._key, this.states.concat(arr));
                                                },
                                                get filled_up() {
                                                    let _states = this.states;
                                                    let _len = _states.length;
                                                    if (_len >= 5) {
                                                        let _tmp = [];
                                                        for (let i = 0; i < _len; i += 1) {
                                                            let n = _states[i];
                                                            if (_tmp[n]) {
                                                                if (_tmp[n] >= 4) {
                                                                    return _cur_state = n;
                                                                }
                                                                _tmp[n] += 1;
                                                            } else {
                                                                _tmp[n] = 1;
                                                            }
                                                        }
                                                    }
                                                },
                                                fillIn() {
                                                    if ($$und(_cur_state)) {
                                                        _cur_state = devicex.getCallState();
                                                    }
                                                    this.states = _cur_state;
                                                    debugInfo("已存储通话状态数据");
                                                    debugInfo("当前共计数据: " + this.states.length + "组");
                                                    return _cur_state;
                                                },
                                                reap() {
                                                    debugInfo("通话状态数据可信");
                                                    debugInfo("将当前数据应用于配置文件");
                                                    debugInfo("数据值: " + _cur_state);
                                                    $$sto.af.remove(this._key);
                                                    // write into storage and $$cfg
                                                    return _self.cur_state = _cur_state;
                                                },
                                            };
                                        }
                                    }
                                },
                                onRelease() {
                                    debugInfo('前置"支付宝"应用');
                                    app.launchPackage($$app.pkg_name);
                                },
                            },
                            screen: {
                                trigger() {
                                    return $$flag.dev_unlocked
                                        && !$$flag.glob_e_scr_paused
                                        && !device.isScreenOn();
                                },
                                onTrigger() {
                                    if ($$flag.glob_e_scr_privilege) {
                                        messageAction("允许脚本提前退出", 3, 1, 0, -1);
                                        messageAction("标识激活且屏幕关闭", 3, 0, 1, 1);
                                        exit();
                                    }
                                },
                                onRelease() {
                                    $$flag.glob_e_trig_counter++;
                                    $$unlk.isLocked() && $$unlk.unlock();
                                    $$flag.glob_e_trig_counter--;
                                },
                            },
                        };
                    }
                },
                logOut() {
                    threadsx.starts(function () {
                        debugInfo("已开启账户登出监测线程");

                        delete $$flag.acc_logged_out;
                        while (1) {
                            if ($$sel.getAndCache("acc_logged_out")) {
                                break;
                            }
                            if ($$acc.isInLoginPg()) {
                                break;
                            }
                            sleep(500);
                        }
                        $$flag.acc_logged_out = true;

                        messageAction("检测到账户登出状态", 1, 0, 0, -1);
                        if ($$sel.cache.load("acc_logged_out")) {
                            messageAction("账户在其他地方登录");
                        } else {
                            messageAction("需要登录账户");
                        }
                        messageAction("尝试自动登录主账户", 1, 0, 0, 1);

                        if (!$$acc.main.login({direct: true})) {
                            messageAction("脚本无法继续", 4, 0, 0, -1);
                            messageAction("无法登录主账户", 8, 1, 1, 1);
                        }
                    });

                    return this;
                },
            };
        }

        function standbyMonSetter() {
            return {
                mask_layer: new Monitor("遮罩层", function () {
                    let _ = maskLayerSetter();

                    while (_.trigger()) {
                        _.enforce();
                    }
                    _.dismiss();

                    // tool function(s) //

                    function maskLayerSetter() {
                        let _samples = [{
                            trig: "关闭蒙层",
                            desc: "蒙层遮罩",
                        }, {
                            trig: ["关闭", {bi$: [0, halfW, W, H]}],
                            desc: "关闭按钮遮罩",
                        }, {
                            trig: /.*treedialog.close/,
                            desc: "树对话框遮罩",
                        }].map((o) => {
                            if (!$$func(o.trig)) {
                                let _trig = o.trig;
                                o.trig = () => $$sel.pickup(_trig);
                            }
                            return o;
                        });
                        let _p = {
                            _cond() {
                                return _samples.some((o) => {
                                    let _w = o.trig();
                                    if (_w) {
                                        _p.smp = Object.assign({widget: _w}, o);
                                        return true;
                                    }
                                });
                            },
                            trigger() {
                                delete _p.smp;
                                return waitForAction(_p._cond, 8e3);
                            },
                            enforce() {
                                let _desc = _p.smp.desc;
                                debugInfo("检测到" + _desc);
                                timeRecorder("_mask_layer");

                                let _cA1 = () => clickAction(_p.smp.widget, "w");
                                let _cA2 = () => clickAction(_p.smp.widget, "click");
                                let _cA = () => _cA1() || _cA2();
                                let _cB1 = () => waitForAction(() => !_p.smp.trig(), 2e3, 80);
                                let _cB2 = () => !waitForAction(_p.smp.trig, 800, 80);
                                let _cB = () => _cB1() && _cB2();
                                if (_cA() && _cB()) {
                                    let _et = timeRecorder("_mask_layer", "L", "auto");
                                    debugInfo(["关闭" + _desc + "成功", "遮罩关闭用时: " + _et]);
                                } else {
                                    debugInfo("关闭" + _desc + "失败", 3);
                                }
                            },
                            dismiss: () => debugInfo("遮罩层监测线程结束"),
                        };
                        return _p;
                    }
                }),
                reload_btn: new Monitor('"重新加载"按钮', function () {
                    let _sel = () => $$sel.get("reload_fst_page");
                    let _click = () => clickAction(_sel(), "w");

                    while (sleep(3e3) || true) {
                        _click() && sleep(5e3);
                    }
                }),
                af_home_in_page: new Monitor("森林主页页面", function () {
                    while (sleep(360) || true) {
                        $$flag.af_home_in_page = !!$$app.page.af.isInPage();
                    }
                }),
                rl_in_page: new Monitor("排行榜页面", function () {
                    while (1) {
                        $$sel.cache.refresh("rl_title"); // including `save()
                        $$flag.rl_in_page = $$sel.cache.load("rl_title", "bounds");
                        sleep(120);
                    }
                }),
                rl_bottom: new Monitor("排行榜底部", function () {
                    while (sleep(500) || true) {
                        $$impeded("排行榜底部监测线程");
                        let _key = "rl_end_idt";
                        if (!$$sel.getAndCache(_key)) {
                            continue;
                        }
                        let _sel_str = $$sel.cache.load(_key, "sel_str");
                        let _bd = $$sel.cache.load(_key, "bounds");
                        let {left: _l, top: _t, right: _r, bottom: _b} = _bd;
                        let _w = _bd.width() - 3;
                        let _h = _bd.height() - 3;
                        if (_b - _t < cX(0.08)) {
                            continue;
                        }
                        let _bd_arr = [_l, _t, _r, _b];
                        let _bd_str = _bd_arr.join(", ");
                        let _sel_body = $$sel.cache.load(_key, _sel_str);
                        debugInfo("列表底部条件满足");
                        debugInfo(">bounds: [" + _bd_str + "]");
                        debugInfo(">" + _sel_str + ": " + _sel_body);

                        $$flag.rl_bottom_rch = true;

                        let _capt = imagesx.capt();
                        let _clip = images.clip(_capt, _l, _t, _w, _h);
                        let _path = $$app.page.rl.btm_tpl.path;
                        $$app.page.rl.btm_tpl.reclaim();
                        $$app.page.rl.btm_tpl.img = _clip;
                        images.save(_clip, _path);
                        debugInfo("已存储列表底部控件图片模板");

                        imagesx.reclaim(_capt, _clip);
                        _capt = _clip = null;

                        break;
                    }
                    return debugInfo("排行榜底部监测线程结束");
                }),
                tree_rainbow: new Monitor("彩虹对话框", function () {
                    let _sltr = idMatches(/.*J.rainbow.close.*/);
                    while (1) {
                        let _w = _sltr.findOnce();
                        if (_w && _w.click()) {
                            debugInfo("关闭主页彩虹对话框");
                        }
                        sleep(240);
                    }
                }),
                unregistered: new Monitor("未注册检测", function () {
                    while (1) {
                        if ($$sel.pickup(/.*\u300a.*用户须知.*\u300b,*/)) {
                            messageAction("脚本无法继续", 4, 0, 0, -1);
                            messageAction("用户未注册蚂蚁森林", 8, 1, 1, 1);
                        }
                    }
                }),
            };

            // constructor(s) //

            function Monitor(name, thr_f) {
                let _thd = $$app["_threads_" + name];
                this.start = function () {
                    if (this.disabled) {
                        return;
                    }
                    if (_thd && _thd.isAlive()) {
                        return _thd;
                    }
                    debugInfo("开启" + name + "监测线程");
                    return _thd = threadsx.starts(thr_f);
                };
                this.interrupt = function () {
                    if (_thd && !this.disabled) {
                        debugInfo("结束" + name + "监测线程");
                        return _thd.interrupt();
                    }
                };
                this.isAlive = () => _thd && _thd.isAlive();
                this.join = t => _thd && _thd.join(t);
                this.disable = function () {
                    this.interrupt();
                    this.disabled = true;
                };
            }
        }
    },
    unlock() {
        let _is_scr_on = $$unlk.is_init_screen_on;
        let _is_unlked = $$unlk.isUnlocked();
        let _err = m => {
            messageAction("脚本无法继续", 4, 0, 0, -1);
            messageAction(m, 8, 1, 1, 1);
        };

        if (!$$cfg.auto_unlock_switch) {
            _is_scr_on || _err("屏幕关闭且自动解锁功能未开启");
            _is_unlked || _err("设备上锁且自动解锁功能未开启");
        }

        _is_unlked && _is_scr_on ? debugInfo("无需解锁") : $$unlk.unlock();
        $$flag.dev_unlocked = true;

        return this;
    },
    prompt() {
        let _sc_cfg = scCfgSetter();
        _sc_cfg.trigger() && _sc_cfg.prompt();

        let _pre_run = preRunSetter();
        _pre_run.trigger() && _pre_run.prompt();

        return this;

        // tool function(s) //

        function scCfgSetter() {
            return {
                trigger() {
                    if (!$$sto.af.get("config_prompted")) {
                        debugInfo("显示参数调整提示对话框");
                        return true;
                    }
                },
                prompt() {
                    let _diag = _promptSetter();
                    let _action = _actionSetter();
                    _diag.show();
                    _action.wait();

                    // tool function(s) //

                    function _promptSetter() {
                        let _btnMsg = (btn_name) => {
                            let _btn = _diag_prompt.getActionButton(btn_name);
                            let _box = _diag_prompt.isPromptCheckBoxChecked();
                            debugInfo('用户' + (_box ? '已' : '没有') + '勾选"不再提示"');
                            debugInfo('用户点击"' + _btn + '"按钮');
                        };

                        let _diag_prompt = dialogsx.builds([
                            "参数调整提示", "settings_never_launched",
                            0, "跳过", "现在配置", 1, 1])
                            .on("negative", (ds) => {
                                _btnMsg("negative");
                                _action.negBtn(ds);
                            })
                            .on("positive", (ds) => {
                                _btnMsg("positive");
                                _action.posBtn(ds);
                            });

                        return dialogsx.disableBack(_diag_prompt);
                    }

                    function _actionSetter() {
                        return {
                            _commonAct(d, flag) {
                                d.dismiss();
                                let _box = d.isPromptCheckBoxChecked();
                                $$sto.af.put("config_prompted", flag || _box);
                                this._sgn_move_on = true;
                            },
                            posBtn(d) {
                                this._sgn_confirm = true;
                                $$sto.af.put("af_postponed", true);
                                this._commonAct(d, true);
                            },
                            negBtn(d) {
                                this._commonAct(d);
                            },
                            wait() {
                                let _this = this;
                                if (!waitForAction(() => _this._sgn_move_on, 60e3)) {
                                    _diag.dismiss();
                                    messageAction("强制结束脚本", 4, 0, 0, -1);
                                    messageAction("等待参数调整对话框操作超时", 8, 1, 0, 1);
                                }
                                if (this._sgn_confirm) {
                                    runJsFile("Ant_Forest_Settings");
                                    exit();
                                }
                            },
                        };
                    }
                },
            };
        }

        function preRunSetter() {
            return {
                trigger() {
                    let _skip = '跳过"运行前提示"';
                    if (!$$cfg.prompt_before_running_switch) {
                        return debugInfo('"运行前提示"未开启');
                    }
                    if ($$cfg.prompt_before_running_auto_skip) {
                        if (!$$unlk.is_init_screen_on) {
                            return debugInfo([_skip, ">屏幕未亮起"]);
                        }
                        if (!$$unlk.is_init_unlocked) {
                            return debugInfo([_skip, ">设备未解锁"]);
                        }
                    }
                    if (!$$app.my_engine_argv.instant_run_flag) {
                        return true;
                    }
                    return debugInfo([_skip, '>检测到"立即运行"引擎参数']);
                },
                prompt() {
                    let _sec = +$$cfg.prompt_before_running_countdown_seconds + 1;
                    let _diag = _promptSetter();
                    let _action = _actionSetter();
                    let _thd_et = threadsx.starts(_thdEt);

                    _diag.show();
                    _action.wait();

                    // tool function(s) //

                    function _promptSetter() {
                        let _btnMsg = (btn_name) => {
                            let _btn = _diag.getActionButton(btn_name);
                            let _rex = / *\[ *\d+ *] */;
                            debugInfo('用户点击"' + _btn.replace(_rex, "") + '"按钮');
                        };

                        let _diag = dialogsx.builds(["运行提示",
                            "\n即将在 " + _sec + " 秒内运行" + $$app.task_name + "任务\n",
                            ["推迟运行", "warn_btn_color"],
                            ["放弃任务", "caution_btn_color"],
                            ["立即开始  [ " + _sec + " ]", "attraction_btn_color"],
                            1])
                            .on("neutral", (d) => {
                                _btnMsg("neutral");
                                _action.neuBtn(d);
                            })
                            .on("negative", (d) => {
                                _btnMsg("negative");
                                _action.negBtn(d);
                            })
                            .on("positive", (d) => {
                                _btnMsg("positive");
                                _action.posBtn(d);
                            });

                        return dialogsx.disableBack(_diag, () => _action.pause(100));
                    }

                    function _actionSetter() {
                        return {
                            _negDiagCntBuilder() {
                                // language=JS
                                let _z = "`当前未设置任何${$$app.task_name}定时任务\n\n`".ts;
                                let _q = "确认要放弃本次任务吗";
                                let [_title, _cnt] = timersx.queryTimedTasks({path: $$app.cwp})
                                    .filter(task => task.id !== $$app.monitor.insurance.id).length
                                    ? [["提示", "title_default_color"], [_q, "content_default_color"]]
                                    : [["注意", "title_caution_color"], [_z + _q, "content_warn_color"]];
                                return [_title, _cnt, 0, "返回", ["确认放弃任务", "caution_btn_color"], 1];
                            },
                            posBtn(d) {
                                this._sgn_move_on = true;
                                this.pause(100);
                                d.dismiss();
                            },
                            negBtn(d) {
                                this.pause(300);
                                dialogsx.builds(this._negDiagCntBuilder())
                                    .on("negative", (ds) => {
                                        dialogsx.dismiss(ds);
                                    })
                                    .on("positive", (ds) => {
                                        dialogsx.dismiss(ds, d);
                                        $$app.monitor.insurance.interrupt().remove();
                                        // language=JS
                                        messageAction("`放弃${$$app.task_name}任务`".ts, 1, 1, 0, 2);
                                        exit();
                                    })
                                    .show();
                            },
                            neuBtn(d) {
                                this.pause(300);
                                let _cfg = {
                                    _key: "prompt_before_running_postponed_minutes",
                                    get sto_min() {
                                        return $$cfg[this._key].toString();
                                    },
                                    set sto_min(v) {
                                        let _new = {};
                                        _new[this._key] = +v;
                                        $$sto.af_cfg.put("config", _new);
                                        Object.assign($$cfg, _new);
                                    },
                                    get def_choices() {
                                        let _src = $$cfg[this._key + "_map"];
                                        let _res = {};
                                        _src.forEach(num => _res[num] = num + " min");
                                        return _res;
                                    },
                                    get user_min() {
                                        return $$cfg[this._key + "_user"].toString();
                                    },
                                    set user_min(v) {
                                        let _new = {};
                                        _new[this._key + "_user"] = +v;
                                        $$sto.af_cfg.put("config", _new);
                                        Object.assign($$cfg, _new);
                                    }
                                };
                                if (+_cfg.sto_min) {
                                    d.dismiss();
                                    $$app.monitor.insurance.interrupt().clean();
                                    return $$app.setPostponedTask(_cfg.sto_min);
                                }
                                let _map = _cfg.def_choices; // ["1 min", "5 min"...]
                                let _map_keys = Object.keys(_map); // [1, 2, 5, 10...]
                                dialogsx
                                    .builds(["设置任务推迟时间", "",
                                        0, "返回", ["确定", "warn_btn_color"],
                                        1, "记住设置且不再提示"], {
                                        items: _map_keys.map(v => _map[v]),
                                        itemsSelectMode: "single",
                                        itemsSelectedIndex: _map_keys.indexOf((_cfg.user_min))
                                    })
                                    .on("negative", (ds) => {
                                        ds.dismiss();
                                    })
                                    .on("positive", (ds) => {
                                        dialogsx.dismiss(ds, d);
                                        _cfg.user_min = _map_keys[ds.getSelectedIndex()];
                                        if (ds.isPromptCheckBoxChecked()) {
                                            _cfg.sto_min = _cfg.user_min;
                                        }
                                        $$app.monitor.insurance.interrupt().clean();
                                        $$app.setPostponedTask(_cfg.user_min);
                                    })
                                    .show();
                            },
                            pause(interval) {
                                _thd_et.interrupt();
                                setTimeout(() => {
                                    let _t = dialogsx.getContentText(_diag);
                                    let _c = _t.replace(/.*(".+".*任务).*/, "请选择$1运行选项");
                                    _diag.setContent(_c);

                                    let _pos = _diag.getActionButton("positive");
                                    let _pos_txt = _pos.replace(/ *\[ *\d+ *]$/, "");
                                    _diag.setActionButton("positive", _pos_txt);
                                }, interval || 800);
                            },
                            wait() {
                                if (!waitForAction(() => this._sgn_move_on, 5 * 60e3)) {
                                    _diag.dismiss();
                                    _thd_et = _diag = null;
                                    messageAction("强制结束脚本", 4, 0, 0, -1);
                                    messageAction("等待运行提示对话框操作超时", 8, 1, 0, 1);
                                }
                            },
                        };
                    }

                    // thread function(s) //

                    function _thdEt() {
                        while (--_sec) {
                            let _cont = dialogsx.getContentText(_diag);
                            _diag.setContent(_cont.replace(/\d+/, _sec));

                            let _pos = _diag.getActionButton("positive");
                            let _pos_str = _pos.replace(/ *\[ *\d+ *]$/, "");
                            let _pos_txt = _pos_str + "  [ " + _sec + " ]";
                            _diag.setActionButton("positive", _pos_txt);

                            sleep(1e3);
                        }
                        debugInfo(["运行提示计时器超时", "任务自动继续"]);
                        _action.posBtn(_diag);
                    }
                },
            };
        }
    },
    command() {
        let _ = cmdSetter();
        _.trigger() && _.exec();

        return this;

        // tool function(s) //

        function cmdSetter() {
            return {
                cmd: $$app.my_engine_argv.cmd,
                // property must be set as a getter
                // or be set outside of this object
                get cmd_list() {
                    let _cmd = this.commands;
                    return {
                        launch_rank_list: _cmd.lchRl.bind(_cmd),
                        get_rank_list_names: _cmd.friList.bind(_cmd),
                        get_current_account_name: _cmd.curAccName.bind(_cmd),
                    };
                },
                commands: {
                    _quit() {
                        let _aim = Array.from(arguments, s => s.toLowerCase());
                        _aim = _aim.length ? _aim : ["alipay", "app"];
                        _aim.includes("alipay") && $$app.page.alipay.close();
                        _aim.includes("app") && $$app.exit(true);
                    },
                    lchRl() {
                        $$app.page.rl.launch({first_time_run_message_flag: false});
                        this._quit("app");
                    },
                    friList() {
                        _launch() && _collect();
                        this._quit();

                        // tool function(s) //

                        function _launch() {
                            timeRecorder("get_rl_data", "save");
                            return $$app.page.rl.launch({first_time_run_message_flag: false});
                        }

                        function _collect() {
                            $$app.task_name = surroundWith("好友列表数据采集");
                            messageAction("正在采集好友列表数据", 1, 1, 0, 2);

                            let _thd_swipe = threadsx.starts(_thdSwipe);
                            let _thd_expand_lst = threadsx.starts(_thdExpandLst);
                            _thd_expand_lst.join(5 * 60e3);
                            _thd_expand_lst.interrupt();
                            _thd_swipe.interrupt();

                            let _ls_data = _getListData();
                            $$sto.af.remove("friends_list_data"); // discarded data
                            $$sto.af_flist.put("friends_list_data", _ls_data);

                            let _et = timeRecorder("get_rl_data", "L", "auto");
                            let _sum = _ls_data.list_length + " 项";
                            messageAction("采集完毕", 1, 1, 0, -1);
                            messageAction("用时 " + _et, 1, 0, 1);
                            messageAction("总计 " + _sum, 1, 0, 1, 1);

                            return $$flag.floaty_fin = 1;

                            // tool function(s) //

                            function _getListData() {
                                let _data = [];
                                $$sel.pickup($$app.rex_energy_amt, "wc").slice(1).forEach((w, i) => {
                                    let _nick = $$sel.pickup([w, "p2c2>0>0"], "txt");
                                    let _rank = i < 3 ? i + 1 : $$sel.pickup([w, "p2c0>0"], "txt");
                                    _data.push({rank_num: _rank.toString(), nickname: _nick});
                                });

                                let _max_len = _data[_data.length - 1].rank_num.length;
                                let _pad = new Array(_max_len).join("0");
                                _data.map(o => o.rank_num = (_pad + o.rank_num).slice(-_max_len));

                                return {
                                    timestamp: $$app.ts,
                                    list_data: _data,
                                    list_length: _data.length,
                                };
                            }

                            // thread function(s) //

                            function _thdSwipe() {
                                let _dist = $$cfg.rank_list_swipe_distance;
                                if (_dist < 1) {
                                    _dist = Math.trunc(_dist * H);
                                }
                                let _top = Math.trunc((uH - _dist) / 2);
                                while (!$$flag.rl_bottom_rch) {
                                    swipe(halfW, uH - _top, halfW, _top, 150);
                                }
                            }

                            function _thdExpandLst() {
                                let _cached = null;

                                _locate() && $$link(_text).$(_height).$(_signal);

                                // tool function(s) //

                                function _locate() {
                                    debugInfo("开始定位排行榜可滚动控件");
                                    $$flag.rl_end_locating = true;

                                    let _itv = 300;
                                    let _max = 9e3 / _itv;
                                    while (_max--) {
                                        let _w = scrollable().findOnce();
                                        if (_w) {
                                            debugInfo("已定位并缓存排行榜可滚动控件");
                                            return _cached = _w;
                                        }
                                        sleep(_itv);
                                    }
                                    debugInfo("未能定位排行榜可滚动控件", 3);
                                }

                                function _text() {
                                    $$flag.rl_end_str_matching = true;
                                    debugInfo("开始监测列表底部控件描述文本");

                                    while (1) {
                                        let _last = _cached;
                                        let _child_cnt;
                                        while ((_child_cnt = _last.childCount())) {
                                            _last = _last.child(_child_cnt - 1);
                                        }
                                        if ($$sel.pickup(_last, "txt").match(/没有更多/)) {
                                            debugInfo("列表底部控件描述文本匹配");
                                            delete $$flag.rl_end_str_matching;
                                            _cached = _last;
                                            break;
                                        }
                                        _cached.refresh();
                                    }
                                }

                                function _height() {
                                    $$flag.rl_end_pos_matching = true;
                                    debugInfo("开始监测列表底部控件屏幕高度");

                                    while (1) {
                                        let _bnd = $$sel.pickup(_cached, "bounds");
                                        if (_bnd && _bnd.height() > 20) {
                                            break;
                                        }
                                        _cached.refresh();
                                        sleep(200);
                                    }

                                    debugInfo("列表底部控件高度满足结束条件");
                                    _cached.recycle();
                                    delete $$flag.rl_end_pos_matching;
                                }

                                function _signal() {
                                    debugInfo("发送排行榜停检信号");
                                    $$flag.rl_bottom_rch = true;
                                }
                            }
                        }
                    },
                    curAccName() {
                        timeRecorder("cur_acc_nm");

                        let _name = _byPipeline() || "";
                        messageAction("采集完毕");

                        let _sto_key = "collected_current_account_name";
                        $$sto.af.remove(_sto_key);
                        $$sto.af.put(_sto_key, _name);

                        let _et = timeRecorder("cur_acc_nm", "L", "auto");
                        messageAction("用时 " + _et, 1, 0, 1);

                        $$flag.floaty_fin = 1;

                        this._quit();

                        // tool function(s) //

                        function _byPipeline() {
                            let _name = "";
                            let _thd_get_name = threadsx.starts(_thdGetName);
                            let _thd_mon_logout = threadsx.starts(_thdMonLogout);

                            waitForAction(() => _name || $$flag.acc_logged_out, 12e3);

                            _thd_get_name.interrupt();
                            _thd_mon_logout.interrupt();

                            if (_name) {
                                return _name;
                            }

                            if ($$flag.acc_logged_out) {
                                messageAction("账户已登出", 3, 1, 0, "2_dash");
                                delete $$flag.acc_logged_out;
                            }

                            // thread function(s) //

                            function _thdGetName() {
                                $$app.task_name = surroundWith("采集当前账户名");
                                $$app.page.alipay.home();

                                messageAction("正在采集当前账户名", 1, 0, 0, -1);

                                clickActionsPipeline([
                                    [["我的", "p1"]],
                                    [idMatches(/.*userinfo_view/)],
                                    [["个人主页", "p4"]],
                                    ["支付宝账户", null]], {
                                    name: "支付宝个人主页",
                                    default_strategy: "widget",
                                });

                                let _txt = "";
                                let _sel = () => $$sel.pickup(["支付宝账户", "s>1"], "txt");
                                waitForAction(() => _txt = _sel(), 2e3);

                                return _name = _txt ? $$acc.encode(_txt) : "";
                            }

                            function _thdMonLogout() {
                                delete $$flag.acc_logged_out;
                                while (!$$acc.isInLoginPg() && !$$sel.get("acc_logged_out")) {
                                    sleep(500);
                                }
                                $$flag.acc_logged_out = true;
                            }
                        }
                    },
                },
                trigger() {
                    if (this.cmd) {
                        if (this.cmd in this.cmd_list) {
                            return true;
                        }
                        messageAction("脚本无法继续", 4, 0, 0, -1);
                        messageAction("未知的传递指令参数:", 4, 1, 1);
                        messageAction(this.cmd, 8, 0, 1, 1);
                    }
                },
                exec() {
                    debugInfo(["执行传递指令:", this.cmd]);
                    this.cmd_list[this.cmd]();
                    sleep(4e3);
                },
            };
        }
    },
};

let $$af = {
    _launcher: {
        greet() {
            // language=JS
            messageAction("`开始${$$app.task_name}任务`".ts, 1, 1, 0, 2);

            return this;
        },
        assign() {
            $$af = Object.assign($$af, {
                emount_t_own: 0, // t: total
                emount_c_own: 0, // c: collected
                emount_c_fri: 0,
                /** @type AfHoughBallsResult|{} */
                home_balls_info: {},
                eballs(type, options) {
                    let _opt = options || {};
                    if (!_opt.cache || !Object.size(this.home_balls_info)) {
                        this.home_balls_info = imagesx.findAFBallsByHough({
                            no_debug_info: _opt.no_debug_info,
                            no_orange_ball: true,
                        });
                    }
                    return !type || type === "all"
                        ? this.home_balls_info.expand()
                        : this.home_balls_info[type] || [];
                },
                cleaner: {
                    imgWrapper() {
                        $$af && Object.keys($$af).forEach((key) => (
                            imagesx.reclaim($$af[key])
                        ));
                    },
                    eballs() {
                        $$af.home_balls_info = {};
                    },
                },
            });

            return this;
        },
        home() {
            $$app.monitor.unregistered.start();
            $$app.page.af.launch();
            $$app.monitor.unregistered.disable();

            return this;
        },
        ready() {
            $$link(_capt).$(_display).$(_language).$(_mainAcc);

            return this;

            // tool function(s) //

            function _capt() {
                // CAUTION:
                // imagesx.capt() contains imagesx.permitCapt()
                // however, which is not recommended to be used
                // within Java Thread at the first time,
                // as capture permission will be forcibly interrupted
                // with this thread killed in a short time (about 300ms)
                imagesx.permitCapt();
            }

            function _display() {
                scrO === 0 || devicex.getDisplay(true);
            }

            function _language() {
                let _tt = "";
                let _sel = () => _tt = $$sel.get("af_title", "txt");

                const _chs = "简体中文";

                if (waitForAction(_sel, 10e3, 100)) {
                    if (_tt.match(/蚂蚁森林/)) {
                        debugInfo("当前支付宝语言: " + _chs);
                    } else {
                        debugInfo("当前支付宝语言: 英语");
                        _changeLangToChs();
                        if ($$app.page.af.launch()) {
                            messageAction("切换支付宝语言: " + _chs, 1, 0, 0, 1);
                        } else {
                            messageAction("语言切换失败", 8, 1, 0, 1);
                        }
                    }
                    debugInfo("语言检查完毕");
                } else {
                    messageAction("语言检测已跳过", 3);
                    messageAction("语言检测超时", 3, 0, 1, 1);
                }

                // tool function(s) //

                function _changeLangToChs() {
                    if (_getReady()) {
                        toast("切换支付宝语言: " + _chs);

                        $$app.page.dismissPermissionDiag();

                        return clickActionsPipeline([
                            [["Me", "p1"]],
                            [["Settings", {clickable: true}]],
                            [["General", "p4"]],
                            [["Language", "p4"]],
                            [[_chs, "p4"], () => (
                                $$sel.pickup([_chs, "p3"], "children").length > 1
                            )],
                            ["Save"],
                        ], {name: _chs + "语言切换", default_strategy: "widget"});
                    }

                    // tool function(s) //

                    function _getReady() {
                        let _max_close = 12;
                        while ($$app.page.close() && _max_close--) {
                            sleep(500);
                        }

                        let _sltr = className("TextView").idContains("tab_description");
                        if (waitForAction(_sltr, 2e3)) {
                            return true;
                        }

                        let _max = 5;
                        while (_max--) {
                            killThisApp($$app.pkg_name);
                            app.launch($$app.pkg_name);
                            if (waitForAction(_sltr, 15e3)) {
                                break;
                            }
                        }
                        if (_max >= 0) {
                            return true;
                        }
                        messageAction("Language switched failed", 4, 1);
                        messageAction("Homepage failed to get ready", 4, 0, 1);
                    }
                }
            }

            function _mainAcc() {
                $$acc.main.login();
            }
        },
    },
    _collector: {
        own: {
            _getEmount(buf) {
                let _amt;
                let _max = buf ? 10 : 1;
                let _body = [/\d+g/, {bi$: [cX(0.6), 0, W, cYx(0.24)]}];
                while (1) {
                    _amt = $$sel.pickup(_body, "txt").match(/\d+/);
                    _amt = $$arr(_amt) ? Number(_amt[0]) : _amt;
                    if ($$num(_amt) || !--_max) {
                        break;
                    }
                    sleep(200);
                }
                return _max < 0 ? -1 : _amt;
            },
            trigger() {
                if ($$cfg.self_collect_switch) {
                    $$af.own = this;
                    return true;
                }
                debugInfo(["跳过自己能量检查", ">自收功能未开启"]);
            },
            init() {
                debugInfo("开始检查自己能量");

                $$af.emount_t_own = this._getEmount("buf");
                debugInfo("初始能量: " + $$af.emount_t_own + "g");

                if ($$app.avatar_checked_time) {
                    debugInfo("主账户检测耗时: " + $$app.avatar_checked_time);
                    delete $$app.avatar_checked_time;
                }

                $$af.min_ctd_own = Infinity;
                $$af.thrd_mon_own = $$cfg.homepage_monitor_threshold;
                $$af.thrd_bg_mon_own = $$cfg.homepage_bg_monitor_threshold;

                return this;
            },
            collect() {
                let _own = this;

                _detect() && _check();
                _result();

                return this;

                // tool function(s) //

                function _detect() {
                    let _eballs = $$af.eballs();
                    let _len = _eballs.length;
                    if (_len) {
                        let _comp = _eballs.filter(o => o.computed).length;
                        let _suff = _comp ? " (含" + _comp + "个计算球)" : "";
                        debugInfo("找到主页能量球: " + _len + "个" + _suff);
                        return true;
                    }
                    debugInfo("未发现主页能量球");
                }

                function _check() {
                    _prologue();
                    _chkRipeBalls();
                    _chkCountdown();
                    _chkWaterBalls();
                    _epilogue();

                    // tool function(s) //

                    function _prologue() {
                        $$app.monitor.tree_rainbow.start();
                    }

                    function _chkRipeBalls() {
                        _checkRipeBalls({cache: true});
                    }

                    function _checkRipeBalls(options) {
                        let _balls = _getRipeBallsData(options);
                        if (!_balls.length) {
                            return;
                        }

                        let _itv = $$cfg.balls_click_interval;
                        let _du = $$cfg.balls_click_duration;
                        let _max = 4;
                        do {
                            debugInfo("点击自己成熟能量球: " + _balls.length + "个");
                            _balls.forEach((o) => {
                                clickAction(o, "p", {press_time: _du});
                                sleep(_itv);
                            });
                            if (!_stableEmount()) {
                                debugInfo("自己能量的增量数据无效");
                                break; // timed out or mismatched
                            }
                            if (waitForAction(_noRipeBalls, 1.2e3)) {
                                debugInfo("未发现新的成熟能量球");
                                break; // all ripe balls picked
                            }
                            debugInfo("发现新的成熟能量球");
                        } while (--_max);

                        _max || debugInfo("本次成熟球收取出现异常", 3);

                        // returns if there were ripe balls
                        // no matter if balls picked successfully
                        return true;

                        // tool function(s) //

                        function _getRipeBallsData(options) {
                            let _opt = options || {};
                            let _no_dbg = _opt.no_debug_info;
                            let _stg = {
                                cache: () => $$af.eballs("ripe", {
                                    cache: true, no_debug_info: _no_dbg,
                                }),
                                refresh: () => $$af.eballs("ripe", {
                                    cache: false, no_debug_info: _no_dbg,
                                }),
                                fixed() {
                                    let _cache = $$af.eballs("all", {
                                        cache: true, no_debug_info: _no_dbg,
                                    });
                                    if (!_cache.length) {
                                        this.refresh();
                                        _cache = this.cache();
                                    }
                                    let _result = [];
                                    if (_cache.length) {
                                        let _capt = imagesx.capt();
                                        _cache.forEach((o) => {
                                            imagesx.isRipeBall(o, _capt, _result);
                                        });
                                        _capt.recycle();
                                        _capt = null;
                                    }
                                    return _result;
                                },
                            };
                            if (_opt.cache) {
                                return _balls = _stg.cache();
                            }
                            if (_opt.fixed) {
                                return _balls = _stg.fixed();
                            }
                            return _balls = _stg.refresh();
                        }

                        function _noRipeBalls() {
                            return !_getRipeBallsData({no_debug_info: true}).length;
                        }
                    }

                    function _stableEmount() {
                        let _t = $$af.emount_t_own;
                        let _getEm = buf => _own._getEmount(buf);
                        let _i = $$app.tool.stabilizer(_getEm, _t) - _t;
                        if (_i <= 0 || isNaN(_i)) {
                            $$af.emount_t_own = _getEm("buffer");
                            $$af.emount_c_own += $$af.emount_t_own - _t;
                        } else {
                            $$af.emount_t_own += _i;
                            $$af.emount_c_own += _i;
                        }
                        return !isNaN(_i) && _i > 0;
                    }

                    function _chkCountdown() {
                        if (_isSwitchOn()) {
                            while (_ctdTrigger()) {
                                _nonStopCheck();
                            }
                        }

                        // tool function(s) //

                        function _isSwitchOn() {
                            // i know it's perfect... [:lying_face:]

                            let _cA = $$cfg.homepage_background_monitor_switch;
                            let _cB1 = $$cfg.timers_switch;
                            let _cB2a = $$cfg.homepage_monitor_switch;
                            let _cB2b1 = $$cfg.timers_self_manage_switch;
                            let _cB2b2 = $$cfg.timers_countdown_check_own_switch;
                            let _cB2b = _cB2b1 && _cB2b2;
                            let _cB2 = _cB2a || _cB2b;
                            let _cB = _cB1 && _cB2;

                            return _cA || _cB;
                        }

                        function _ctdTrigger() {
                            debugInfo("开始检测自己能量球最小倒计时");

                            $$af.min_ctd_own = Infinity;
                            let _nor_balls = $$af.eballs("naught", {cache: true});
                            let _len = _nor_balls.length;
                            if (!_len) {
                                return debugInfo("未发现未成熟的能量球");
                            }
                            debugInfo("找到自己未成熟能量球: " + _len + "个");

                            let _t_spot = timeRecorder("ctd_own");
                            // timestamp until next ripe
                            let _min_own = Math.mini(_getOwnRipeTs());

                            if (!$$num(_min_own) || _min_own <= 0) {
                                return debugInfo("自己能量最小倒计时数据无效", 3);
                            }
                            if (isInfinite(_min_own)) {
                                return debugInfo("自己能量倒计时数据为空");
                            }

                            $$af.min_ctd_own = _min_own;

                            let _t = timeRecorder("ctd_own", "L", 60e3, [2], "", _min_own);
                            debugInfo("自己能量最小倒计时: " + _t + "分钟");
                            debugInfo("时间: " + $$app.tool.timeStr(_min_own));

                            let _cA = $$cfg.homepage_monitor_switch;
                            let _cB = _t <= $$af.thrd_mon_own;
                            if (_cA && _cB) {
                                debugInfo("触发成熟能量球监测条件");
                                return true;
                            }
                            debugInfo("自己能量球最小倒计时检测完毕");

                            // tool function(s) //

                            function _getOwnRipeTs() {
                                timeRecorder("ctd_data");

                                let _tt = 12e3;
                                let _alive = thd => thd && thd.isAlive();
                                let _kill = (thd) => {
                                    thd && thd.interrupt();
                                    thd = null;
                                };
                                let _remainT = () => _tt - timeRecorder("ctd_data", "L");
                                let _ctd_data = [];
                                let _thd_ocr = threadsx.starts(_thdOcr);
                                let _thd_toast = threadsx.starts(_thdToast);

                                _thd_toast.join(1.5e3);

                                if (_alive(_thd_toast)) {
                                    _kill(_thd_toast);
                                    debugInfo("Toast监控线程获取数据超时");
                                    debugInfo("强制停止Toast监控线程");
                                }

                                _thd_ocr.join(Math.max(_remainT(), 0));

                                if (_remainT() < 0) {
                                    _kill(_thd_toast);
                                    _kill(_thd_ocr);
                                    messageAction("获取自己能量倒计时超时", 3);
                                    _ctd_data.length
                                        ? messageAction("最小倒计时数据可能不准确", 3, 0, 0, 1)
                                        : messageAction("最小倒计时数据获取失败", 3, 0, 0, 1);
                                }

                                return _ctd_data.map((str) => {
                                    let _mch = str.match(/\d+:\d+/);
                                    if (!_mch) {
                                        messageAction("无效字串:", 3);
                                        messageAction(str, 3);
                                        return Infinity;
                                    }

                                    let _t_str = _mch[0];
                                    let [_hh, _mm] = _t_str.split(":").map(x => +x);
                                    let _m = _hh * 60 + _mm;

                                    debugInfo("[ " + _t_str + " ]  ->  " + _m + " min");

                                    return _t_spot + _m * 60e3;
                                }).filter(isFinite);

                                // thread function(s) //

                                function _thdOcr() {
                                    debugInfo("已开启倒计时数据OCR识别线程");

                                    let _capt = imagesx.capt();
                                    let [_cl, _ct, _cr, _cb] = $$cfg.forest_balls_rect_region;
                                    let _cw = _cr - _cl;
                                    let _ch = _cb - _ct;
                                    let _clip = images.clip(_capt, _cl, _ct, _cw, _ch);
                                    let _stitched = null;

                                    let _raw_data = baiduOcr(_stitchImg(), {
                                        fetch_times: 3,
                                        fetch_interval: 500,
                                        no_toast_msg_flag: true,
                                        capt_img: _clip,
                                    });

                                    debugInfo("OCR识别线程已获取数据");
                                    debugInfo("原始数据:");
                                    // nested data should be applied (not called)
                                    debugInfo(util.format.apply(util, _raw_data));

                                    let _rex_t = /(\d{2})\D(\d{2})/;
                                    let _proc_data = _raw_data
                                        .map((data) => {
                                            // eg: [["11:29"], ["11.25", "07|03", "3"], [""]]
                                            // --> [["11:29"], ["11.25", "07|03"], []]
                                            return data.filter(s => s.match(_rex_t));
                                        })
                                        .filter((data) => {
                                            // eg: [["11:29"], ["11.25", "07|03"], []]
                                            // --> [["11:29"], ["11.25", "07|03"]]
                                            return data.length > 0;
                                        })
                                        .map((data) => {
                                            let _map = s => s.replace(_rex_t, "$1:$2");
                                            let _sort = (a, b) => a === b ? 0 : a > b ? 1 : -1;
                                            // eg: [["11:29"], ["11.25", "07|03"]]
                                            // --> [["11:29"], ["11:25", "07:03"]] // map
                                            // --> [["11:29"], ["07:03", "11:25"]] // sort
                                            // --> ["11:29", "07:03"] // index(0)
                                            return data.map(_map).sort(_sort)[0];
                                        });

                                    debugInfo("加工数据:");
                                    // flat data should be called (not applied)
                                    debugInfo(util.format.call(util, _proc_data));

                                    imagesx.reclaim(_capt, _clip, _stitched);
                                    _capt = _clip = _stitched = null;

                                    if (!_proc_data.length) {
                                        debugInfo("OCR识别线程未能获取有效数据");
                                        return;
                                    }
                                    debugInfo("OCR识别线程已获取有效数据");

                                    if (_ctd_data.length) {
                                        debugInfo(["数据未被采纳", ">倒计时数据非空"]);
                                        return;
                                    }
                                    debugInfo("OCR识别线程数据已采纳");

                                    return _ctd_data = _proc_data;

                                    // tool function(s) //

                                    // to stitch af home balls image
                                    function _stitchImg() {
                                        let _toImg = o => images.clip(_capt,
                                            o.left, o.top, o.width(), o.height()
                                        );
                                        _stitched = _toImg(_nor_balls[0]);
                                        _nor_balls.slice(1).forEach((o) => {
                                            _stitched = images.concat.apply(images, [
                                                _stitched, _toImg(o), "BOTTOM"
                                            ]);
                                        });
                                        return _stitched;
                                    }
                                }

                                function _thdToast() {
                                    debugInfo("已开启倒计时数据Toast监控线程");

                                    let _data = [];
                                    let _du = $$cfg.balls_click_duration;

                                    _nor_balls.forEach((o) => {
                                        clickAction(o, "p", {press_time: _du});
                                        _data = _data.concat(
                                            observeToastMessage($$app.pkg_name, /才能收取/, 240)
                                        );
                                    });

                                    if (_data.length) {
                                        debugInfo("Toast监控线程已获取有效数据");
                                        if (_alive(_thd_ocr)) {
                                            _kill(_thd_ocr);
                                            debugInfo("强制停止OCR识别线程");
                                        }
                                        return _ctd_data = _data;
                                    }
                                    debugInfo("Toast监控线程未能获取有效数据");
                                }
                            }
                        }

                        function _nonStopCheck() {
                            let _debug_page_state_flip = 1;
                            let _thrd = $$af.thrd_mon_own;
                            let _tt = _thrd * 60e3 + 3e3;
                            let _old_em = $$af.emount_c_own;

                            toast("Non-stop checking time");
                            debugInfo("开始监测自己能量");
                            timeRecorder("monitor_own");

                            $$app.monitor.af_home_in_page.start();
                            devicex.keepOn(_tt);
                            while (timeRecorder("monitor_own", "L") < _tt) {
                                if ($$flag.af_home_in_page) {
                                    _debugPageState();
                                    // ripe balls recognition will be performed
                                    // in some fixed area(s) without new captures
                                    if (_checkRipeBalls({fixed: true})) {
                                        break;
                                    }
                                }
                                _debugPageState();
                                sleep(180);
                            }
                            devicex.cancelOn();
                            $$app.monitor.af_home_in_page.interrupt();

                            delete $$flag.af_home_in_page;
                            $$af.cleaner.eballs(); // clear cache

                            toast("Checking completed");
                            debugInfo("自己能量监测完毕");
                            debugInfo("本次监测收取结果: " + ($$af.emount_c_own - _old_em) + "g");
                            debugInfo("监测用时: " + timeRecorder("monitor_own", "L", "auto"));

                            // speculated helpful for _thdToast() within which
                            // toast message didn't show up after clickAction()
                            sleep(1.8e3); //// TEST ////

                            // tool function(s) //

                            function _debugPageState() {
                                let _fg = +$$flag.af_home_in_page;
                                if (_fg !== _debug_page_state_flip) {
                                    if (timeRecorder("monitor_own", "L") > 1e3) {
                                        debugInfo("当前页面" + (_fg ? "" : "不") + "满足森林主页条件");
                                        debugInfo((_fg ? "继续" : "暂停") + "监测自己能量");
                                    }
                                    _debug_page_state_flip = _fg;
                                }
                            }
                        }
                    }

                    function _chkWaterBalls() {
                        debugInfo("开始检测浇水回赠能量球");
                        let _wb_cache = $$af.eballs("water", {cache: true});
                        let _wb_info = {lmt: 300, ctr: 0};
                        if (_wb_cache.length) {
                            debugInfo("发现浇水回赠能量球");
                            _wb_cache.forEach(_fetch);
                            while (_trig()) {
                                _fetch();
                            }
                        }
                        if (_wb_info.ctr > 0) {
                            debugInfo("收取浇水回赠能量球: " + _wb_info.ctr + "个");
                        } else {
                            debugInfo("未发现浇水回赠能量球");
                        }
                        debugInfo("浇水回赠能量球检测完毕");

                        // tool function(s) //

                        function _trig() {
                            let _res = false;
                            delete _wb_info.coord;
                            if (!_wb_info.lmt--) {
                                messageAction("中断主页浇水回赠能量球检测", 3, 0, 0, -1);
                                messageAction("已达最大检查次数限制", 3, 0, 1, 1);
                                return _res;
                            }
                            let _capt = imagesx.capt();
                            for (let coord of _wb_cache) {
                                if (imagesx.isWaterBall(coord, _capt)) {
                                    _wb_info.coord = coord;
                                    _res = true;
                                    break;
                                }
                            }
                            _capt.recycle();
                            _capt = null;
                            return _res;
                        }

                        function _fetch(o) {
                            clickAction(o || _wb_info.coord, "p", {pt$: $$cfg.balls_click_duration});
                            sleep(240);

                            if (_stableEmount()) {
                                return _wb_info.ctr += 1;
                            }
                            debugInfo("浇水回赠能量球点击超时");
                            debugInfo("可能是能量球误匹配");
                            _wb_cache = [];
                        }
                    }

                    function _epilogue() {
                        $$app.monitor.tree_rainbow.interrupt();
                    }
                }

                function _result() {
                    let _em = $$af.emount_c_own;
                    if (_em < 0 || isInfinite(_em)) {
                        debugInfo("收取值异常: " + _em, 3);
                    } else if (!_em) {
                        debugInfo("无能量球可收取");
                    } else {
                        debugInfo("共计收取: " + _em + "g");
                        $$app.db.insertInto(["%SELF%", $$app.ts_sec, _em, 0]);
                    }
                    debugInfo("自己能量检查完毕");
                }
            },
            awake() {
                let _ctd_ts = $$af.min_ctd_own;
                let _cA = _ctd_ts && isFinite(_ctd_ts);
                let _cB = _ctd_ts - $$app.ts <= $$af.thrd_bg_mon_own * 60e3 + 9e3;
                if (_cA && _cB) {
                    messageAct("开始主页能量球返检监控", 1, 1, 0, 1);
                    $$app.page.af.launch();
                    this.init().collect();
                    return true;
                }
            },
        },
        fri: {
            _getSmp(cache_fg) {
                if (cache_fg && this.rl_samples) {
                    return this.rl_samples;
                }

                let _wc = $$sel.pickup(new RegExp("\\d+\u2019"), "wc");
                debugInfo("捕获好友能量倒计时数据: " + _wc.length + "项");

                return _parseWidgets.call(this);

                // tool function(s) //

                function _parseWidgets() {
                    let _smp = {};
                    _wc.forEach((w) => {
                        let _mm = +$$sel.pickup(w, "txt").match(/\d+/)[0];
                        let _nick = $$sel.pickup([w, "p2c2>0>0"], "txt");
                        if (_mm && _nick) {
                            _smp[_nick] = {
                                ts: $$app.ts + _mm * 60e3,
                                minute: _mm,
                            };
                        }
                    });

                    let _z = Object.size(_smp);
                    _z && debugInfo("解析好友有效倒计时数据: " + _z + "项");

                    return this.rl_samples = _smp;
                }
            },
            _chkMinCtd(cache_fg) {
                let _smp = this._getSmp(cache_fg);

                if (Object.size(_smp)) {
                    let _min_mm = Infinity;
                    let _min_ctd = Infinity;

                    Object.values(_smp).forEach((o) => {
                        if (o.ts < _min_ctd) {
                            _min_ctd = o.ts;
                            _min_mm = o.minute;
                        }
                    });

                    if (_min_mm > 0) {
                        $$af.min_ctd_fri = _min_ctd;
                        debugInfo("好友能量最小倒计时: " + _min_mm + "分钟");
                        debugInfo("时间数据: " + $$app.tool.timeStr(_min_ctd));
                        debugInfo("好友能量最小倒计时检测完毕");
                        return _min_mm <= $$cfg.rank_list_review_threshold;
                    }
                    debugInfo("好友倒计时数据无效: " + _min_mm, 3);
                }
            },
            eballs: {
                /** @type EnergyBallsInfo[] */
                orange: [],
                /** @type EnergyBallsInfo[] */
                ripe: [],
                /** @type EnergyBallsInfo[] */
                naught: [],
                /** @type EnergyBallsInfo[] */
                water: [],
                get length() {
                    return this.orange.length + this.ripe.length + this.naught.length;
                },
                reset() {
                    this.orange.splice(0);
                    this.ripe.splice(0);
                    this.naught.splice(0);
                    this.water.splice(0);
                },
            },
            trigger() {
                let _sw_pick = $$cfg.friend_collect_switch;
                let _sw_help = $$cfg.help_collect_switch;

                if (!_sw_pick) {
                    if (!_sw_help) {
                        debugInfo("跳过好友能量检查");
                        debugInfo(">收取功能与帮收功能均未开启");
                        return;
                    }
                    if (!_chkHelpSect()) {
                        debugInfo("跳过好友能量检查");
                        debugInfo(">收取功能未开启");
                        debugInfo(">且当前不在帮收有效时段内");
                        return;
                    }
                }

                Object.defineProperties($$af.fri = this, {
                    trig_pick: {get: () => _sw_pick},
                    trig_help: {get: () => _sw_help && _chkHelpSect()},
                });

                return true;

                // tool function(s) //

                function _chkHelpSect() {
                    let [_s0, _s1] = $$cfg.help_collect_section;

                    if (_s1 <= _s0) {
                        _s1 = _s1.replace(/\d{2}(?=:)/, $ => +$ + 24);
                    }

                    let _now_str = $$app.tool.timeStr($$app.now, "hh:mm");
                    let _res = $$str(_s0, "<=", _now_str, "<", _s1);

                    if (!_res && !$$flag.help_sect_hinted) {
                        debugInfo("当前时间不在帮收有效时段内");
                        $$flag.help_sect_hinted = true;
                    }

                    return _res;
                }
            },
            init() {
                $$link(greet).$(killH5).$(params);

                return this;

                // tool function(s) //

                function greet() {
                    debugInfo($$flag.rl_review ? "开始复查好友能量" : "开始检查好友能量");
                }

                function killH5() {
                    let _trig = () => {
                        return $$sel.get("af_title")
                            || $$sel.get("rl_title")
                            || $$app.page.fri.isInPage();
                    };
                    if (_trig()) {
                        let _max = 20;
                        let _ctr = 0;
                        do {
                            keycode(4, {double: true});
                            _ctr += 1;
                            sleep(500);
                        } while (_max-- && _trig());

                        debugInfo("关闭相关H5页面: " + _ctr + "页");
                    }
                }

                function params() {
                    delete $$flag.rl_valid_click;
                    delete $$flag.help_sect_hinted;
                    delete $$flag.rl_bottom_rch;
                    delete $$flag.rl_review;

                    $$af.min_ctd_fri = Infinity;
                }
            },
            launch() {
                $$app.page.rl.launch();
                $$app.monitor.rl_in_page.start();
                $$app.monitor.rl_bottom.start();
                $$app.user_nickname = _getNickname();

                return this;

                // tool function(s) //

                function _getNickname() {
                    if (!$$und($$app.user_nickname)) {
                        return $$app.user_nickname;
                    }
                    return _fromRl() || _fromActivity();

                    // tool function(s) //

                    function _fromRl() {
                        let _res = $$sel.pickup([$$app.rex_energy_amt, "p2c2>0>0"], "txt");
                        if (_res) {
                            debugInfo("已从排行榜获取当前账户昵称");
                            return _res;
                        }
                        debugInfo("排行榜获取到无效账户昵称", 3);
                    }

                    function _fromActivity() {
                        appx.startActivity({
                            action: "VIEW",
                            data: "alipays://platformapi/startapp?appId=20000141",
                        });

                        let _sltr = className("EditText");
                        let _nick = "";
                        let _sel = () => _nick = $$sel.pickup(_sltr, "txt");

                        if (!waitForAction(_sltr, 4.8e3, 60)) {
                            messageAction("无法获取当前账户昵称", 3, 0, 0, -1);
                            messageAction("进入昵称设置页面超时", 3, 1, 0, 1);
                        } else {
                            waitForAction(_sel, 480, 60);
                            $$app.page.back();
                        }

                        // make it easier for rl to launch
                        sleep(500);

                        if ($$str(_nick, "")) {
                            $$app.page.alipay.home({debug_info_flag: false});
                            clickAction($$sel.pickup(["我的", "p1"]), "w");

                            let _sltr = idMatches(/.*user_name_left/);
                            waitForAction(() => _nick = $$sel.pickup(_sltr, "txt"), 2.4e3);

                            _nick = _nick.slice(-2);
                        }

                        _nick && debugInfo("已从活动页面get_rank_list_names获取当前账户昵称");

                        return _nick;
                    }
                }
            },
            collect() {
                let _fri = this;
                let _rl = $$app.page.rl;

                // TODO cfg: max_not_targeted_swipe_times
                let _max_no_tar_swp = 200;
                let _max_no_tar_swp_bak = _max_no_tar_swp;

                let _awake = () => _fri.parent.own.awake();
                let _review = () => _fri.review();
                let _reboot = () => _fri.reboot();

                _rl.pool.add();

                while (1) {
                    if (_awake()) {
                        return _reboot();
                    }
                    if (_scan()) {
                        void _gather();
                    }
                    if (_quit()) {
                        break;
                    }
                    _swipe();
                }

                _review() ? _reboot() : _fin();

                // tool function(s) //

                function _scan() {
                    let _color_pick = $$cfg.friend_collect_icon_color;
                    let _color_help = $$cfg.help_collect_icon_color;

                    let _prop = {
                        pick: {
                            act_desc: "收取",
                            color: _color_pick,
                            col_thrd: $$cfg.friend_collect_icon_threshold,
                            mult_col: (() => {
                                let _mult = [
                                    [cX(38), cYx(35), _color_pick],
                                    [cX(23), cYx(26), -1],
                                ];

                                // from E6683
                                for (let i = 16; i <= 24; i += (4 / 3)) {
                                    _mult.push([cX(i), cY(i - 6, -1), -1]);
                                }

                                // from E6683
                                for (let i = 16; i <= 24; i += (8 / 3)) {
                                    _mult.push([cX(i), cY(i / 2 + 16, -1), -1]);
                                }

                                return _mult;
                            })(),
                            getTar() {
                                if (_fri.trig_pick) {
                                    return _chkByImgTpl.call(this);
                                }
                                if (!$$flag.dys_pick) {
                                    debugInfo(["不再采集收取目标样本", ">收取功能未开启"]);
                                    $$flag.dys_pick = true;
                                }
                                return [];
                            },
                        },
                        help: {
                            act_desc: "帮收",
                            color: _color_help,
                            col_thrd: $$cfg.help_collect_icon_threshold,
                            mult_col: [[cX(38), cYx(35), _color_help]],
                            getTar() {
                                if (_fri.trig_help) {
                                    return _chkByMultCol.call(this);
                                }
                                if (!$$flag.dys_help) {
                                    debugInfo(["不再采集帮收目标样本", ">帮收功能未开启"]);
                                    $$flag.dys_help = true;
                                }
                                return [];
                            },
                        },
                    };

                    timeRecorder("rl_scan");

                    _fri.tar = [_getTar("pick"), _getTar("help")];

                    return Math.sum(_fri.tar.map(x => x.length));

                    // tool function(s) //

                    function _chkByMultCol() {
                        let _l = cX(0.9);
                        let _t = 0;
                        let _color = this.color;
                        let _col_thrd = this.col_thrd || 10;
                        let _mult_col = this.mult_col;
                        let _capt = $$app.page.rl.capt_img;
                        let _tar = [];

                        while (_t < H) {
                            let _matched = _check();
                            if (!_matched) {
                                break;
                            }

                            let _y = _matched.y;
                            _t = _y + cYx(76);

                            _tar.unshift({
                                icon_x: _matched.x,
                                icon_y: _y,
                                item_y: _y + cYx(16),
                                act_desc: this.act_desc,
                            });
                        }

                        return _tar;

                        // tool function(s) //

                        function _check() {
                            let _mch = images.findMultiColors(
                                _capt, _color, _mult_col, {
                                    region: [_l, _t, W - _l, H - _t],
                                    threshold: _col_thrd,
                                }
                            );
                            if (_mch) {
                                return {x: _mch.x, y: _mch.y};
                            }
                        }
                    }

                    function _chkByImgTpl() {
                        let _ic_k = "ic_fetch";
                        let _ic_img = _getIcon(_ic_k);
                        let _capt = $$app.page.rl.capt_img;
                        let _x = cX(0.85);
                        let _y = 0;
                        let _w = _capt.getWidth() - _x;
                        let _h = _capt.getHeight() - _y;
                        let _clip = images.clip(_capt, _x, _y, _w, _h);
                        let _res = imagesx.matchTpl(_clip, _ic_img, {
                            name: _ic_k + "_" + W + "p",
                            max: 20,
                            range: [28, 30],
                            threshold_attempt: 0.94,
                            // region_attempt: [cX(0.8), 0, cX(0.2), uH],
                            threshold_result: 0.94,
                        });
                        _clip.recycle();
                        _clip = null;

                        let _tar = [];
                        if (_res) {
                            _res.points.forEach((pt) => {
                                _tar.unshift({
                                    icon_x: pt.x,
                                    icon_y: pt.y,
                                    item_y: pt.y,
                                    act_desc: this.act_desc,
                                });
                            });
                        }
                        return _tar;

                        // tool function(s) //

                        function _getIcon(key) {
                            let _ic = () => $$sto.treas.image_base64_data[key];
                            return $$sto[key] = $$sto[key] || images.fromBase64(_ic());
                        }
                    }

                    /**
                     * @param {"pick"|"help"} ident
                     */
                    function _getTar(ident) {
                        return _prop[ident].getTar().sort((a, b) => (
                            a.icon_y < b.icon_y ? 1 : -1
                        ));
                    }
                }

                function _gather() {
                    _lmt("reset");
                    _fri.tar.forEach(_act);
                    _fri.tar.splice(0);

                    // tool function(s) //

                    function _act(items) {
                        let _item = null;
                        let _next = () => _item = items.pop();

                        while (_next()) {
                            do {
                                $$link(_enter).$(_intro).$(_check).$(_back);
                            } while (_coda());
                        }

                        // tool function(s) //

                        function _enter() {
                            clickAction([halfW, _item.item_y], "p", {pt$: 64});

                            if ($$flag.six_review) {
                                debugInfo("复查当前好友");
                                $$flag.six_review -= 1;
                            } else {
                                debugInfo("点击" + _item.act_desc + "目标");
                            }
                            showSplitLineForDebugInfo();

                            // TODO cond: pool diff
                            // avoid touching widgets in rank list
                            sleep(500);

                            _fri.eballs.reset();
                        }

                        function _intro() {
                            let _nick = "";
                            let _sel = () => _nick = $$sel.get("fri_frst_tt", "txt");
                            if (waitForAction(_sel, 20e3, 80)) {
                                _nick = _nick.replace(/的蚂蚁森林$/, "");
                                $$app.fri_drop_by.ic(_nick);
                                messageAct($$af.nick = _nick, "t");
                            } else {
                                messageAction("标题采集好友昵称超时", 3, 1);
                            }
                            showSplitLineForDebugInfo();
                        }

                        function _check() {
                            if (!_inBlist() && _ready()) {
                                _monitor();
                                !_cover() && _collect();
                            }

                            // main function(s) //

                            function _inBlist() {
                                if ($$app.blist.get($$af.nick)) {
                                    $$app.fri_drop_by.dc($$af.nick);
                                    return true;
                                }
                            }

                            function _ready() {
                                delete $$flag.pick_off_duty;
                                return $$app.page.fri.getReady();
                            }

                            function _monitor() {
                                $$app.thd_info_collect = threadsx.starts(function () {
                                    debugInfo("已开启好友森林信息采集线程");

                                    let _eballs_o = imagesx.findAFBallsByHough({
                                        pool: $$app.page.fri.pool,
                                        keep_pool_data: true,
                                    });

                                    Object.keys(_eballs_o).forEach((k) => {
                                        if (k !== "duration") {
                                            _fri.eballs[k] = _eballs_o[k];
                                        }
                                    });

                                    _eballs_o.duration.showDebugInfo();
                                });
                            }

                            function _cover() {
                                let _is_covered = false;

                                let _pool = $$app.page.fri.pool;
                                _pool.getReady();
                                _pool.detectCover() && _handle();

                                return _is_covered;

                                // tool function(s) //

                                function _handle() {
                                    debugInfo("颜色识别检测到保护罩");
                                    _is_covered = true;

                                    debugInfo("终止好友森林信息采集线程");
                                    $$app.thd_info_collect.interrupt();

                                    let _w_lst = null;
                                    if (!waitForAction(() => _w_lst = $$sel.get("list"), 3e3, 80)) {
                                        return messageAction("未能通过列表获取能量罩信息", 3, 1, 1);
                                    }

                                    let _w_cvr = null;
                                    let _thd_auto_expand = threadsx.starts(_autoExpand);

                                    _getTs() && _addBlist();

                                    return true;

                                    // tool function(s) //

                                    function _autoExpand() {
                                        debugInfo("已开启动态列表自动展开线程");

                                        let _ctr = 0;
                                        let _w = null;
                                        let _btn = "点击加载更多";

                                        if (!waitForAction(() => _w = $$sel.pickup(_btn), 3e3)) {
                                            return messageAction('定位"' + _btn + '"按钮超时', 3);
                                        }

                                        while (_ctr++ < 50) {
                                            waitForAndClickAction(_w, 3e3, 120, {click_strategy: "w"});
                                            sleep(_ctr < 12 ? 200 : 900);
                                        }
                                    }

                                    function _getTs() {
                                        debugInfo("开始采集能量罩使用时间");

                                        let _getFeedLegends = () => (
                                            $$sel.pickup({className: "ListView"}, "children") || []
                                        ).filter((w) => w.childCount() === 0
                                            && w.indexInParent() < w.parent().childCount() - 1
                                        ).slice(0, 3);

                                        let _max = 8;
                                        let _selCover = () => $$sel.get("cover_used");
                                        while (_max--) {
                                            for (let w of _getFeedLegends()) {
                                                let _txt = $$sel.pickup(w, "txt");
                                                // more than 2 days; like: "03-22"
                                                let _gt2 = _txt.match(/\d{2}.\d{2}/);
                                                if (waitForAction(_selCover, 1e3, 80) || _gt2) {
                                                    debugInfo("能量罩信息已定位");
                                                    return _w_cvr = _selCover();
                                                }
                                            }
                                        }
                                        debugInfo("能量罩使用时间采集失败", 3);
                                    }

                                    function _addBlist() {
                                        _thd_auto_expand.interrupt();
                                        debugInfo("中断态列表自动展开线程");

                                        /* /今天|昨天/ or like: "05-23" */
                                        let _date_str = _getDateStr();
                                        debugInfo("捕获动态列表日期字串: " + _date_str);

                                        /* like: "03:19" */
                                        let _time_str = $$sel.pickup([_w_cvr, "p2c-1"], "txt");
                                        debugInfo("捕获动态列表时间字串: " + _time_str);

                                        $$app.blist.add($$af.nick, _ts(), $$app.blist.reason.cover);

                                        // tool function(s) //

                                        /** Returns timestamp when protect cover is invalid */
                                        function _ts() {
                                            let _offsetHr = _getOffsetHr();
                                            let _real_h = new Date().getHours() + _offsetHr;
                                            let _new_d = new Date().setHours(_real_h);
                                            _date_str = new Date(_new_d).toDateString();

                                            return new Date(_date_str + " " + _time_str).getTime();

                                            // tool function(s) //

                                            function _getOffsetHr() {
                                                if (_date_str.match(/昨天/)) {
                                                    return (-24) + 24;
                                                }
                                                if (_date_str.match(/今天/)) {
                                                    return (0) + 24;
                                                }
                                                let _d_str_mch = _date_str.match(/\d{2}.\d{2}/);
                                                if (!_d_str_mch) {
                                                    debugInfo("动态列表日期字串解析失败", 3);
                                                    debugInfo("日期字串: " + _date_str, 3);
                                                    debugInfo("使用默认延时时常: 24小时", 3);
                                                    return +24;
                                                }
                                                let _d_str = _d_str_mch[0];
                                                // like: _MM -> 12, _dd -> 31 (Dec 31)
                                                let [_MM, _dd] = _d_str.split(/\D/).map(x => Number(x));
                                                _MM -= 1;
                                                let _now = new Date(); // like: Jan 1, 2011
                                                let _n_yy = _now.getFullYear();
                                                let _n_MM = _now.getMonth();
                                                let _n_dd = _now.getDate();
                                                let _n_d_str = _now.toDateString();
                                                let _yy = _n_yy; // like: 2011
                                                if (_MM > _n_MM || _MM === _n_MM && _dd > _n_dd) {
                                                    _yy -= 1; // like: 2010
                                                }
                                                let _gap = new Date(_n_d_str) - new Date(_yy, _MM, _dd);
                                                return _gap / 3.6e6 + 24;
                                            }
                                        }

                                        function _getDateStr() {
                                            let _txt_cvr = $$sel.pickup(_w_cvr, "txt");
                                            let _date_str = "";
                                            void _w_lst.children().some((child) => {
                                                if (child.childCount()) {
                                                    return (
                                                        $$sel.pickup([child, "c1>1"], "txt") ||
                                                        $$sel.pickup([child, "c0>1"], "txt")
                                                    ) === _txt_cvr;
                                                }
                                                _date_str = $$sel.pickup(child, "txt");
                                            });
                                            return _date_str;
                                        }
                                    }
                                }
                            }

                            function _collect() {
                                $$app.thd_info_collect.join();
                                $$link(_pick).$(_help).$(_db);

                                // tool function(s) //

                                function _pick() {
                                    if (_fri.trig_pick) {
                                        $$app.thd_pick = threadsx.starts(function () {
                                            debugInfo("已开启能量球收取线程");
                                            let _eballs = _fri.eballs.ripe;
                                            if (_eballs.length) {
                                                _clickAndCount("pick", _eballs);
                                            } else {
                                                $$flag.pick_off_duty = true;
                                                debugInfo("没有可收取的能量球");
                                            }
                                        });
                                    } else {
                                        $$flag.pick_off_duty = true;
                                    }
                                }

                                function _help() {
                                    _ready() && _click() && _sixRev();

                                    if ($$app.thd_pick) {
                                        $$app.thd_pick.join();
                                        $$app.thd_pick = null;
                                    }

                                    // tool function(s) //

                                    function _ready() {
                                        if (_fri.trig_help) {
                                            debugInfo("帮收功能正在等待开始信号");
                                            if (waitForAction(() => $$flag.pick_off_duty, 2e3, 80)) {
                                                debugInfo("收取线程信号返回正常");
                                                return true;
                                            }
                                            messageAction("等待收取线程信号超时", 3, 0, 1);
                                        }
                                    }

                                    function _click() {
                                        let _eballs = _fri.eballs.orange;
                                        if (_eballs.length) {
                                            _clickAndCount("help", _eballs);
                                            return true;
                                        }
                                        debugInfo("没有可帮收的能量球");
                                    }

                                    function _sixRev() {
                                        if (_fri.eballs.length >= 6) {
                                            if (!$$cfg.six_balls_review_switch) {
                                                return debugInfo("六球复查未开启");
                                            }

                                            if ($$und($$flag.six_review)) {
                                                $$flag.six_review = 1;
                                            } else {
                                                $$flag.six_review += 1;
                                            }

                                            let _max = $$cfg.six_balls_review_max_continuous_times;
                                            if ($$flag.six_review > _max) {
                                                debugInfo(["清除六球复查标记", ">连续复查次数已达上限"]);
                                                delete $$flag.six_review;
                                            } else {
                                                debugInfo("设置六球复查标记: " + $$flag.six_review);
                                            }
                                        }
                                    }
                                }

                                function _db() {
                                    let _pick = _collect["cnt_pick"] || 0;
                                    let _help = _collect["cnt_help"] || 0;
                                    if (_pick || _help) {
                                        let _name = $$af.nick || "%NULL%";
                                        let _ts = $$app.ts_sec;
                                        $$app.db.insertInto([_name, _ts, _pick, _help]);
                                    }
                                }

                                /**
                                 * @param {"pick"|"help"} act
                                 * @param {EnergyBallsInfo[]} data
                                 */
                                function _clickAndCount(act, data) {
                                    let _prop = {
                                        pick: {
                                            src_pref: "收取",
                                            act_desc: "收取",
                                            ball_desc: "成熟能量球",
                                            pk_kw: "你收取TA",
                                            accu_key: "emount_c_fri",
                                            flag_key: "pick_off_duty",
                                        },
                                        help: {
                                            src_pref: "帮收",
                                            act_desc: "助力",
                                            ball_desc: "帮收能量球",
                                            pk_kw: "你给TA助力",
                                        },
                                    };

                                    let _cfg = _prop[act];
                                    let _ctr = threadsx.atomic(0);
                                    let _res = threadsx.atomic(-1);

                                    let _thds = {
                                        fx: {
                                            pk: {
                                                w_name: "PK面板",
                                                condition: () => $$sel.pickup(_cfg.pk_kw),
                                                getSum(agent) {
                                                    return agent.stab - agent.init;
                                                },
                                                getEmount() {
                                                    let _max = 10;
                                                    while (_max--) {
                                                        let _txt = $$sel.pickup(
                                                            [_cfg.pk_kw, "s>1"], "txt"
                                                        );
                                                        if (_txt.match(/\d+\s?(kg|t)/)) {
                                                            debugInfo("放弃低精度参照值");
                                                            return NaN;
                                                        }
                                                        let _mch = _txt.match(/\d+/);
                                                        if (_mch) {
                                                            return +_mch[0];
                                                        }
                                                    }
                                                    return NaN;
                                                },
                                            },
                                            feed: {
                                                w_name: "动态列表",
                                                condition: () => $$sel.get("list"),
                                                getSum(agent) {
                                                    let _sum = 0;
                                                    let _max = agent.stab - agent.init;
                                                    let _lst = $$sel.get("list", "cache");
                                                    let _ii = this.item_idx || 0;
                                                    for (let i = 1; i <= _max; i += 1) {
                                                        let _c = "c" + i + "c" + _ii + "c1";
                                                        let _s = $$sel.pickup([_lst, _c], "txt");
                                                        let _mch = _s.match(/\d+/);
                                                        _sum += _mch ? +_mch[0] : 0;
                                                    }
                                                    return _sum;
                                                },
                                                getEmount() {
                                                    let _w_lst = null;
                                                    let _this = this;
                                                    let _sel_lst = () => _w_lst = $$sel.get("list");
                                                    if (!waitForAction(_sel_lst, 1.2e3, 100)) {
                                                        return NaN;
                                                    }
                                                    let _str = (n, c) => $$sel.pickup([n, c], "txt");
                                                    if (_str(_w_lst, "c0") !== "今天") {
                                                        return 0;
                                                    }
                                                    return _getItemsLen();

                                                    // tool function(s) //

                                                    function _getRex() {
                                                        let _pref = act === "help" ? "帮忙" : "";
                                                        return new RegExp("^" + _pref + "收取\\d+g$");
                                                    }

                                                    function _getItemsLen() {
                                                        let _i = 1;
                                                        let _len = _w_lst.childCount();
                                                        let _rex = _getRex();
                                                        let _nick = $$app.user_nickname;
                                                        let _chk0 = n => _str(n, "c0") === _nick;
                                                        let _chk1 = n => _str(n, "c1").match(_rex);
                                                        for (; _i < _len; _i += 1) {
                                                            let _c = "c" + _i + "c" + _getItemIdx();
                                                            let _n = $$sel.pickup([_w_lst, _c]);
                                                            if (!_n || !_chk0(_n) || !_chk1(_n)) {
                                                                break;
                                                            }
                                                        }
                                                        return _i - 1;

                                                        // tool function(s) //

                                                        function _getItemIdx() {
                                                            if ($$und(_this.item_idx)) {
                                                                let _n = $$sel.pickup([_w_lst, "c1"]);
                                                                let _len = _n.childCount();
                                                                for (let i = 0; i < _len; i += 1) {
                                                                    if (_n.child(i).childCount()) {
                                                                        _this.item_idx = i;
                                                                        break;
                                                                    }
                                                                }
                                                            }
                                                            return _this.item_idx;
                                                        }
                                                    }
                                                },
                                            },
                                        },
                                        pool: [],
                                        startAll() {
                                            Object.values(this.fx).forEach((fxo) => {
                                                this.pool.push({
                                                    name: _cfg.src_pref + fxo.w_name,
                                                    f: threads.start(_thdMaker(fxo)),
                                                });
                                            });
                                        },
                                        killAll() {
                                            this.pool.forEach((o) => {
                                                if (o.f.isAlive()) {
                                                    debugInfo("中断" + o.name + "数据统计线程");
                                                    o.f.interrupt();
                                                }
                                            });
                                        },
                                        isAllDead() {
                                            return this.pool.every(o => !o.f.isAlive());
                                        },
                                        ready(agent) {
                                            let _name = agent.src_name;
                                            let _init = agent.getEmount();
                                            debugInfo("初始" + _name + "数据: " + _init);

                                            _ctr.incrementAndGet();

                                            if (isNaN(_init)) {
                                                return debugInfo("初始" + _name + "数据无效");
                                            }
                                            agent.init_emount = _init;

                                            if (waitForAction(() => $$flag.pick_off_duty, 2e3, 50)) {
                                                return true;
                                            }
                                            debugInfo(_cfg.src_pref + "操作未就绪");
                                        },
                                        stable(agent) {
                                            let _name = agent.src_name;
                                            let _init = agent.init_emount;

                                            debugInfo("等待" + _name + "数据稳定");
                                            let _stab = $$app.tool.stabilizer(agent.getEmount, _init);

                                            if (!isNaN(_stab)) {
                                                agent.stable_emount = _stab;
                                                debugInfo(_name + "数据已稳定: " + _stab);
                                                return true;
                                            }
                                            debugInfo(_name + "稳定数据无效");
                                        },
                                    };

                                    _thds.startAll();
                                    _item.avail_clicked = true;

                                    _ready() && $$link(_click).$(_stat);

                                    // tool function(s) //

                                    function _ready() {
                                        let _max = 60;
                                        while (1) {
                                            if (_ctr.get()) {
                                                return true;
                                            }
                                            if (!_max-- || _thds.isAllDead()) {
                                                return messageAction("数据统计初始化失败", 3);
                                            }
                                            sleep(50);
                                        }
                                    }

                                    function _click() {
                                        let _desc = _cfg.ball_desc;
                                        let _du = $$cfg.balls_click_duration;

                                        debugInfo("点击" + _desc + ": " + data.length + "个");

                                        data.forEach((o) => {
                                            clickAction(o, "p", {pt$: _du});
                                            sleep($$cfg.balls_click_interval);
                                        });

                                        $$flag.rl_valid_click = true;
                                        $$app.fri_drop_by.dc($$af.nick);

                                        if (_cfg.flag_key) {
                                            $$flag[_cfg.flag_key] = true;
                                        }
                                    }

                                    function _stat() {
                                        waitForAction(() => ~_res.get(), 2.4e3, 80);

                                        let _sum = _res.get();
                                        let _act = _cfg.act_desc;
                                        let _accu = _cfg.accu_key;

                                        _thds.killAll();

                                        if (~_sum) {
                                            $$af[_accu] += _accu ? _sum : 0;
                                            _collect["cnt_" + act] = _sum;
                                            messageAct(_act + ": " + _sum + "g", +!!_sum, 0, 1);
                                        } else {
                                            messageAct(_act + ": 统计数据无效", 0, 0, 1);
                                        }
                                    }

                                    function _thdMaker(fxo) {
                                        let _maker = {
                                            init: NaN,
                                            stab: NaN,
                                            agent: {
                                                src_name: _cfg.src_pref + fxo.w_name,
                                                init_emount: NaN,
                                                stable_emount: NaN,
                                                getEmount: fxo.getEmount.bind(fxo),
                                            },
                                            ready() {
                                                let _agt = this.agent;
                                                if (waitForAction(fxo.condition, 3e3, 50)) {
                                                    if (_thds.ready(_agt)) {
                                                        this.init = _agt.init_emount;
                                                        return true;
                                                    }
                                                } else {
                                                    debugInfo(_agt.src_name + "控件准备超时", 3);
                                                }
                                            },
                                            stable() {
                                                if (_thds.stable(this.agent)) {
                                                    this.stab = this.agent.stable_emount;
                                                    return true;
                                                }
                                            },
                                            stat() {
                                                let _n = fxo.getSum(this);
                                                _res.compareAndSet(-1, _n);
                                                debugInfo(this.agent.src_name + "统计结果: " + _n);
                                            },
                                            fx() {
                                                this.ready() && this.stable() && this.stat();
                                            },
                                        };
                                        return new java.lang.Runnable({run: _maker.fx.bind(_maker)});
                                    }
                                }
                            }
                        }

                        function _back() {
                            $$app.page.rl.backTo();
                        }

                        function _coda() {
                            if (!_item.avail_clicked) {
                                messageAct("无能量球可操作", 0, 0, 1);
                            }
                            showSplitLine();

                            delete _item.avail_clicked;
                            delete $$af.nick;
                            $$app.page.fri.pool.clear();

                            return $$flag.six_review;
                        }
                    }
                }

                function _quit() {
                    if ($$flag.rl_bottom_rch) {
                        debugInfo("检测到排行榜停检信号");
                        return true;
                    }
                    if (!_lmt()) {
                        debugInfo("无目标滑动次数已达上限");
                        return true;
                    }
                }

                function _lmt(reset) {
                    if (!reset) {
                        return _max_no_tar_swp--;
                    }
                    _max_no_tar_swp = _max_no_tar_swp_bak;
                }

                function _fin() {
                    let _swA = $$cfg.timers_switch;
                    let _swB = $$cfg.timers_self_manage_switch;
                    let _swC = $$cfg.timers_countdown_check_friends_switch;
                    let _cond = _swA && _swB && _swC;

                    if (!_cond) {
                        $$af.min_ctd_fri = Infinity;
                    } else if (isInfinite($$af.min_ctd_fri)) {
                        _fri._chkMinCtd("cache");
                    }

                    _awake() ? _reboot() : debugInfo("好友能量检查完毕");
                }

                function _swipe() {
                    $$link(_swipeUp).$(_chkCaptDiff).$(_chkRlBottom);

                    // tool function(s) //

                    function _swipeUp() {
                        $$impeded("排行榜滑动流程");

                        let _et_scan = timeRecorder("rl_scan", "L") || 0;
                        let _itv = $$cfg.rank_list_swipe_interval.clamp(5, 800);
                        let _du = $$cfg.rank_list_swipe_time.clamp(100, 800);
                        let _dist = $$cfg.rank_list_swipe_distance;
                        if (_dist < 1) {
                            _dist = Math.trunc(_dist * H);
                        }
                        let _top = Math.trunc((uH - _dist) / 2);
                        if (_top <= 0) {
                            _autoAdjust();
                        }
                        let _btm = uH - _top;

                        _swipeOnce();

                        // tool function(s) //

                        function _autoAdjust() {
                            let _dist0 = Math.trunc(uH * 0.95);
                            let _top0 = Math.trunc((uH - _dist0) / 2);
                            let _af_cfg = $$sto.af_cfg.get("config", {});
                            let _data = {rank_list_swipe_distance: _dist0};
                            let _combined = Object.assign({}, _af_cfg, _data);

                            messageAction("滑动区域超限", 3);

                            _top = _top0;
                            messageAction("自动修正滑动距离参数:", 3);
                            messageAction("swipe_top: " + _top0, 3);

                            $$sto.af_cfg.put("config", _combined);
                            $$cfg.rank_list_swipe_distance = _dist0;
                            messageAction("自动修正配置文件数据:", 3);
                            messageAction("rank_list_swipe_distance: " + _dist0, 3);
                        }

                        function _swipeOnce() {
                            let _l = cX(0.75);
                            let _dt = cY(0.025);
                            if (
                                swipe(_l, _btm, _l, _btm + _dt, 50) &&
                                swipe(_l, _btm, _l, _top, _du)
                            ) {
                                // just to prevent screen from turning off
                                // maybe this is not a good idea
                                click(1e5, 1e5);
                            } else {
                                messageAction("swipe(): false", 3, 0, 0, "2_dash");
                            }
                            sleep(Math.max(0, _itv - _et_scan));
                        }
                    }

                    function _chkCaptDiff() {
                        if (_diffTrig() || _forcChk()) {
                            _chkRlUnexp();
                        }

                        // tool function(s) //

                        function _diffTrig() {
                            let _pool = _rl.pool;
                            let _ctr = $$flag.rl_capt_pool_ctr || 0;
                            let _ctrTrig = () => _ctr && !(_ctr % 4);

                            _pool.add().filter().trim();

                            return !_diffLmtRch() && _ctrTrig();

                            // tool function(s) //

                            function _diffLmtRch() {
                                if (_pool.isDiff()) {
                                    delete $$flag.rl_capt_pool_ctr;
                                    return;
                                }

                                let _max = $$cfg.rank_list_capt_pool_diff_check_threshold;

                                debugInfo("排行榜截图样本池差异检测:");
                                debugInfo("检测未通过: (" + ++_ctr + "/" + _max + ")");

                                if (_ctr >= _max) {
                                    debugInfo("发送排行榜停检信号");
                                    debugInfo(">已达截图样本池差异检测阈值");
                                    delete $$flag.rl_capt_pool_ctr;
                                    return $$flag.rl_bottom_rch = true;
                                }
                                $$flag.rl_capt_pool_ctr = _ctr;
                            }
                        }

                        function _forcChk() {
                            if ($$flag.rl_forc_chk) {
                                delete $$flag.rl_forc_chk;
                                return true;
                            }
                        }

                        function _chkRlUnexp() {
                            $$link(_chkLoading).$(_chkBottom).$(_chkDozing);

                            // tool function(s) //

                            function _chkLoading() {
                                let _sel = () => $$sel.pickup(/正在加载.*/);

                                if (_sel()) {
                                    let _max = 2;
                                    debugInfo('检测到"正在加载"按钮');
                                    debugInfo("等待按钮消失 (最多" + _max + "分钟)");

                                    if (waitForAction(() => !_sel(), _max * 60e3)) {
                                        delete $$flag.rl_bottom_rch;
                                        debugInfo("排行榜停检信号撤销");
                                        debugInfo('>"正在加载"按钮已消失');
                                    } else {
                                        debugInfo('等待"正在加载"按钮消失超时', 3);
                                    }
                                }
                            }

                            function _chkBottom() {
                                let _widget = $$sel.get("rl_end_idt");

                                if (_widget) {
                                    let _bnd = _widget.bounds();
                                    let _w = _bnd.width();
                                    let _h = _bnd.height();
                                    if (_h > 3) {
                                        if (_rl.btm_h === _h) {
                                            debugInfo("发送排行榜停检信号");
                                            debugInfo(">已匹配列表底部控件");
                                            $$flag.rl_bottom_rch = true;

                                            let _capt = imagesx.capt();
                                            let _clip = images.clip(_capt,
                                                _bnd.left, _bnd.top, _w - 3, _h - 3);
                                            let _path = $$app.page.rl.btm_tpl.path;

                                            $$app.page.rl.btm_tpl.reclaim();
                                            $$app.page.rl.btm_tpl.img = _clip;
                                            images.save(_clip, _path);
                                            debugInfo("列表底部控件图片模板已更新");

                                            imagesx.reclaim(_capt, _clip);
                                            _capt = _clip = null;
                                        } else {
                                            _rl.btm_h = _h;
                                            $$flag.rl_forc_chk = true;
                                        }
                                    }
                                }
                            }

                            function _chkDozing() {
                                let _sel = () => $$sel.pickup(/.*打瞌睡.*/);
                                if (waitForAction(_sel, 2, 360)) {
                                    let _w = $$sel.pickup("再试一次");
                                    waitForAndClickAction(_w, 12e3, 600, {click_strategy: "w"});
                                    delete $$flag.rl_bottom_rch;
                                    debugInfo(["排行榜停检信号撤销", '>检测到"服务器打瞌睡"页面']);
                                }
                            }
                        }
                    }

                    function _chkRlBottom() {
                        if (_btmTpl() || _invtBtn()) {
                            $$flag.rl_bottom_rch = true;
                        }

                        // tool function(s) //

                        function _btmTpl() {
                            let _tpl = $$app.page.rl.btm_tpl.img;
                            if (_tpl) {
                                if ($$num(cX(0.04), "<=", _tpl.height, "<=", cX(0.18))) {
                                    let _mch = images.findImage(_rl.capt_img, _tpl, {
                                        level: 1, region: [0, cY(0.8)],
                                    });
                                    if (_mch) {
                                        $$app.monitor.rl_bottom.interrupt();
                                        debugInfo("列表底部条件满足");
                                        debugInfo(">已匹配列表底部控件图片模板");
                                        return true;
                                    }
                                } else {
                                    files.remove($$app.page.rl.btm_tpl.path);
                                    delete $$app.page.rl.btm_tpl.img;
                                    debugInfo("列表底部控件图片模板已清除", 3);
                                    debugInfo(">图片模板高度值异常: " + _tpl.height, 3);
                                    $$app.monitor.rl_bottom.start();
                                }
                            }
                        }

                        function _invtBtn() {
                            let _color = "#30bf6c";
                            let _mch = images.findMultiColors(
                                _rl.capt_img, _color, _rl.invt_colors || _invtColors(), {
                                    region: [cX(0.71), cY(0.62), cX(0.28), cY(0.37)],
                                    threshold: 10,
                                }
                            );
                            if (_mch) {
                                debugInfo(["列表底部条件满足", ">区域内匹配邀请按钮颜色成功"]);
                                return true;
                            }

                            // tool function(s) //

                            function _invtColors() {
                                //        x0            x1            x2
                                //        --            --            --
                                // y0:    XX            G1
                                // y1:    G2                          G3
                                // y2:                  G4
                                // y3:    G5                          G6
                                // y4:                  W1            W2

                                let _c_green = _color, _c_white = "#ffffff";
                                let _dx = cX(45), _dy = cYx(9);
                                let _x0 = 0, _y0 = 0;
                                let _x1 = _dx, _x2 = _dx * 2;
                                let _y1 = _dy * 2, _y2 = _dy * 3;
                                let _y3 = _dy * 4, _y4 = _dy * 6;

                                return _rl.invt_colors = [
                                    [_x1, _y0, _c_green], // G1
                                    [_x0, _y1, _c_green], // G2
                                    [_x2, _y1, _c_green], // G3
                                    [_x1, _y2, _c_green], // G4
                                    [_x0, _y3, _c_green], // G5
                                    [_x2, _y3, _c_green], // G6
                                    [_x1, _y4, _c_white], // W1
                                    [_x2, _y4, _c_white], // W2
                                ];
                            }
                        }
                    }
                }
            },
            review() {
                let _m_q = "放弃排行榜样本复查:"; // quit

                if (!$$cfg.timers_switch) {
                    return debugInfo([_m_q, "定时循环功能未开启"]);
                }
                if (!$$cfg.rank_list_review_switch) {
                    return debugInfo([_m_q, "排行榜样本复查功能未开启"]);
                }
                if ($$flag.rl_review_stop) {
                    return debugInfo([_m_q, "检测到复查停止信号"]);
                }

                let _trig = (s) => {
                    debugInfo(["触发排行榜样本复查条件:", s], "both");
                    return $$flag.rl_review = true;
                };

                if ($$cfg.rank_list_review_difference_switch) {
                    let _smp = this.rl_samples;
                    let _old_keys = _smp && Object.keys(_smp);
                    let _new_keys = Object.keys(this._getSmp());
                    if (!equalObjects(_old_keys, _new_keys)) {
                        return _trig("列表状态差异");
                    }
                }
                if ($$cfg.rank_list_review_samples_clicked_switch) {
                    if ($$flag.rl_valid_click) {
                        return _trig("样本点击记录");
                    }
                }
                if ($$cfg.rank_list_review_threshold_switch) {
                    if (this._chkMinCtd(/* cache_fg */
                        $$cfg.rank_list_review_difference_switch
                    )) {
                        return _trig("最小倒计时阈值");
                    }
                }
            },
            reboot() {
                this.init().launch().collect();
            },
        },
    },
    _timers_setter: {
        trigger() {
            if (!$$cfg.timers_switch) {
                return debugInfo("定时循环功能未开启");
            }
            if (!$$cfg.timers_self_manage_switch) {
                return debugInfo("定时任务自动管理未开启");
            }
            return true;
        },
        autoTask() {
            let _ahd_own = $$cfg.timers_countdown_check_own_timed_task_ahead;
            let _ahd_fri = $$cfg.timers_countdown_check_friends_timed_task_ahead;
            let _min_own = ($$af.min_ctd_own || Infinity) - _ahd_own * 60e3;
            let _min_fri = ($$af.min_ctd_fri || Infinity) - _ahd_fri * 60e3;
            let _nxt_min_ctd = Math.min(_min_own, _min_fri);
            let _nxt_unintrp = _nxtUnintrp() || Infinity;

            let _type = _nxt_min_ctd > _nxt_unintrp
                ? {name: "uninterrupted", desc: "延时接力"}
                : {name: "min_countdown", desc: "最小倒计时"};
            let _next = Math.min(_nxt_min_ctd, _nxt_unintrp);

            if (isFinite(_next)) {
                _chkAutoTaskSect();
                _setAutoTask();
            } else {
                debugInfo("无定时任务可设置");
            }

            // tool function(s) //

            function _nxtUnintrp() {
                return _trigger() && _getNxt();

                // tool function(s) //

                function _trigger() {
                    if (!$$cfg.timers_uninterrupted_check_switch) {
                        return debugInfo("延时接力机制未开启");
                    }
                    // eg: [{section: ["06:30", "00:00"], interval: 60}]
                    let _sto_sxn = $$cfg.timers_uninterrupted_check_sections;
                    if (!_sto_sxn || !_sto_sxn.length) {
                        return debugInfo("无延时接力区间数据");
                    }
                    return _nxtUnintrp.sto_sxn = _sto_sxn;
                }

                function _getNxt() {
                    let _now = $$app.now;
                    let _rec_ts = _now.getTime();
                    let _d_ms = 24 * 3.6e6;
                    let _d_str = _now.toDateString() + " ";

                    debugInfo("开始计算最小延时接力时间数据");

                    let _res = Object.values(_nxtUnintrp.sto_sxn).map((sxn) => {
                        let _sxn = sxn.section;
                        if (_sxn && _sxn.length) {
                            let _min_ts = Date.parse(_d_str + _sxn[0]);
                            let _max_ts = Date.parse(_d_str + _sxn[1]);
                            while (_max_ts <= _min_ts) {
                                _max_ts += _d_ms;
                            }
                            let _delay = sxn.interval * 60e3;
                            let _next_ts = _rec_ts + _delay;
                            if (_rec_ts < _min_ts) {
                                _next_ts = Math.max(_next_ts, _min_ts);
                            }
                            if (_next_ts > _max_ts) {
                                if (_rec_ts > _max_ts) {
                                    _next_ts = _min_ts + _d_ms;
                                } else {
                                    _next_ts = _max_ts;
                                }
                            }
                            return _next_ts;
                        }
                    }).filter(x => !!x).sort()[0];

                    debugInfo("时间数据: " + $$app.tool.timeStr(_res));

                    return _res;
                }
            }

            function _chkAutoTaskSect() {
                return _trigger() && _modifyNxt();

                // tool function(s) //

                function _trigger() {
                    let _sxn = $$cfg.timers_auto_task_sections;
                    if (_sxn && _sxn.length) {
                        return _chkAutoTaskSect.sto_sxn = _sxn;
                    }
                    debugInfo("未设置自动定时任务有效时段");
                }

                function _modifyNxt() {
                    let _inf = [];
                    let _d_ms = 24 * 3.6e6;
                    // language=JS
                    let _d_str = "`${$$app.now.toDateString()} `".ts;
                    let _today_min = Date.parse(_d_str);
                    let _today_max = _today_min + _d_ms;
                    let _sto_sxn = _chkAutoTaskSect.sto_sxn;

                    debugInfo("开始分析自动定时任务有效时段");

                    for (let i = 0, l = _sto_sxn.length; i < l; i += 1) {
                        let _tss = []; // [[ts1, ts2], [ts3, ts4]]
                        let _sxn = _sto_sxn[i];
                        if (_sxn && _sxn.length) {
                            let _sxn_l = Date.parse(_d_str + _sxn[0]);
                            let _sxn_r = Date.parse(_d_str + _sxn[1]);
                            if (_sxn_r <= _sxn_l) {
                                _tss.push([_today_min, _sxn_r]);
                                _tss.push([_sxn_l, _today_max]);
                            } else {
                                _tss.push([_sxn_l, _sxn_r]);
                            }
                            if (_tss.some(a => $$num(a[0], "<=", _next, "<=", a[1]))) {
                                debugInfo(["匹配到有效时段:", _getSxnStr(_sxn)]);
                                return;
                            }
                            _sxn_l = _sxn_l > _next ? _sxn_l : _sxn_l + _d_ms;
                            _inf.push({left_ts: _sxn_l, sxn: _sxn});
                        }
                    }

                    debugInfo("时间数据不在有效时段范围内");

                    let {sxn: _sxn, left_ts: _ts} = _inf.sort((a, b) => {
                        let _a = a.left_ts, _b = b.left_ts;
                        return _a === _b ? 0 : _a > _b ? 1 : -1;
                    })[0];

                    _next = _ts;
                    $$app.next_avail_sxn_str = _getSxnStr(_sxn);

                    // tool function(s) //

                    function _getSxnStr(sxn) {
                        let [_l, _r] = sxn;
                        _r += _r <= _l ? " (+1)" : "";
                        return "[ " + _l + " - " + _r + " ]";
                    }
                }
            }

            function _setAutoTask() {
                timeRecorder("set_auto_task");

                let _sxn_str = $$app.next_avail_sxn_str;
                if (_sxn_str) {
                    _type.desc += " (顺延)";
                    _type.name += "_restrained";
                }

                $$app.thd_set_auto_task = threadsx.starts(function () {
                    let _task = _update() || _add();
                    let _nxt_str = $$app.tool.timeStr(_next);
                    messageAct("任务ID: " + _task.id, 1, 0, 1);
                    messageAct("下次运行: " + _nxt_str, 1, 0, 1);
                    _sxn_str && messageAct("受制区间: " + _sxn_str, 1, 0, 1);
                    messageAct("任务类型: " + _type.desc, 1, 0, 1, 1);
                });

                // tool function(s) //

                function _update() {
                    let _sto_nxt = $$app.getAutoTask();
                    let _sto_id = _sto_nxt.task_id;
                    if (_sto_id) {
                        let _sto_task = timersx.getTimedTask(_sto_id);
                        if (_sto_task) {
                            return _updateTask(_sto_task);
                        }
                    }

                    // tool function(s) //

                    function _updateTask(task) {
                        debugInfo("开始更新自动定时任务");
                        task.setMillis(_next);
                        let _task = $$app.setAutoTask(() => (
                            timersx.updateTimedTask(task)
                        ), _next, _type.name);
                        showSplitLineForDebugInfo();
                        _sxn_str
                            ? messageAct("已更新并顺延自动定时任务")
                            : messageAct("已更新自动定时任务");
                        return _task;
                    }
                }

                function _add() {
                    let _par = {path: $$app.cwp, date: _next};
                    let _task = $$app.setAutoTask(() => (
                        timersx.addDisposableTask(_par, "wait")
                    ), _next, _type.name);
                    showSplitLineForDebugInfo();
                    _sxn_str
                        ? messageAct("已添加并顺延自动定时任务")
                        : messageAct("已添加自动定时任务");
                    return _task;
                }
            }
        },
    },
    _epilogue_setter: {
        logBackIFN: () => $$acc.logBack(),
        showResult() {
            return new Promise((reso) => {
                let _e_own = $$af.emount_c_own;
                let _e_fri = $$af.emount_c_fri;
                let _swA = $$cfg.message_showing_switch;
                let _swB = $$cfg.result_showing_switch;
                if (_swA && _swB) {
                    debugInfo("开始展示统计结果");
                    debugInfo("自己能量收取值: " + _e_own);
                    debugInfo("好友能量收取值: " + _e_fri);
                    showSplitLineForDebugInfo();
                    return _e_own >= 0 && _e_fri >= 0
                        ? reso(_showMsg(_eStr(_e_fri, _e_own)))
                        : reso(_showMsg("数据统计失败"));
                }
                return reso();

                // tool function(s) //

                function _eStr(fri, own) {
                    let _str = [];
                    own && _str.push("Energy from yourself: " + own + "g");
                    fri && _str.push("Energy from friends: " + fri + "g");
                    return _str.join("\n") || "A fruitless attempt";
                }

                function _showMsg(msg) {
                    let _m_arr = msg.split("\n");
                    let _isLast = i => i === _m_arr.length - 1;
                    _m_arr.forEach((m, i) => {
                        messageAction(m, 1, 0, 0, +_isLast(i));
                    });
                    if (msg.match(/失败/)) {
                        _e_own = -1;
                    }
                    if ($$cfg.floaty_result_switch) {
                        _floatyResult();
                    } else {
                        toast(msg);
                        debugInfo("统计结果展示完毕");
                    }

                    // tool function(s) //

                    function _floatyResult() {
                        debugInfo("开始绘制Floaty");

                        $$flag.floaty_fin = 0;
                        $$flag.floaty_err = 1;
                        $$flag.floaty_usr_touch = false;

                        let _ctd = $$cfg.floaty_result_countdown;
                        let _tt = _ctd * 1e3;
                        debugInfo("时间参数: " + _tt);

                        let _cvr_win = floaty.rawWindow(
                            <frame id="cover" gravity="center" bg="#7f000000"/>
                        );
                        // prevent touch event from being
                        // transferred to the view beneath
                        _cvr_win.setTouchable(true);
                        _cvr_win.setSize(-1, -1);
                        _cvr_win["cover"].setOnClickListener({
                            onClick() {
                                if ($$flag.floaty_usr_touch) {
                                    debugInfo("触发遮罩层触摸事件");
                                    debugInfo("提前结束Floaty结果展示");
                                    debugInfo("发送Floaty消息结束等待信号");
                                    $$flag.floaty_fin = 1;
                                    $$flag.floaty_err = 0;
                                    floaty.closeAll();
                                } else {
                                    debugInfo('模拟一次"深度返回"操作');
                                    debugInfo(">检测到非用户点击行为");
                                    keycode(4, {double: true});
                                }
                            },
                        });
                        _cvr_win["cover"].setOnTouchListener({
                            onTouch(view, e) {
                                if (!$$flag.floaty_usr_touch) {
                                    let _act = e.getAction();
                                    if (_act === android.view.MotionEvent.ACTION_DOWN) {
                                        $$flag.floaty_usr_touch = e.getY() > cYx(0.12);
                                    }
                                    if (_act === android.view.MotionEvent.ACTION_MOVE) {
                                        $$flag.floaty_usr_touch = true;
                                    }
                                    if (_act === android.view.MotionEvent.ACTION_UP) {
                                        let _diff = e.getEventTime() - e.getDownTime();
                                        $$flag.floaty_usr_touch = _diff > 200;
                                    }
                                }
                                // touch event will be given to the 'cover' view
                                // instead of being consumed
                                return false;
                            },
                        });

                        _setFloaty();

                        // tool function(s) //

                        function _setFloaty() {
                            let _h = _getHeights();
                            let _lyt = _getLayouts();

                            let _msg_win = floaty.rawWindow(_lyt.msg);
                            let _sum = _e_own + _e_fri;
                            _sum = _sum < 0 ? "Statistics Failed" : _sum.toString();

                            _msg_win.text.setText(_sum);
                            _msg_win.setSize(-2, 0);

                            let _hints = _getHints();
                            let _hint_len = _hints.length;

                            let _wA = _msg_win.getWidth();
                            let _wB = cX(0.54);
                            let _wC = cX(0.25) * _hint_len;
                            let _min_w = Math.max(_wA, _wB, _wC);
                            let _l_pos = (W - _min_w) / 2;

                            _msg_win.setPosition(_l_pos, _h.base);
                            _msg_win.setSize(_min_w, _h.msg);

                            let _hint_t_pos = _h.base - _h.col - _h.hint;
                            let _col_up_t_pos = _h.base - _h.col;
                            let _col_dn_t_pos = _h.base + _h.msg;
                            let _tt_t_pos = _h.base + _h.msg + _h.col;
                            let _avg_w = Math.trunc(_min_w / _hint_len);
                            let _colors = {
                                YOU: "#7dae17",
                                FRI: "#2ba653",
                                SOR: "#a3555e", // SORRY
                                OTHER: "#907aa3",
                            };

                            for (let i = 0; i < _hint_len; i += 1) {
                                let _cur_hint = _hints[i];
                                let _abbr = _cur_hint.slice(0, 3);
                                let _col_value = _colors[_abbr] || _colors["OTHER"];
                                let _cur_hint_col = "#cc" + _col_value.slice(1);
                                let _stripe_bg = colors.parseColor(_cur_hint_col);
                                let _cur_l_pos = _l_pos + _avg_w * i;
                                let _cur_w = _min_w - (_hint_len - 1) * _avg_w;
                                if (i !== _hint_len - 1) {
                                    _cur_w = _avg_w;
                                }

                                let _col_dn_win = floaty.rawWindow(_lyt.col);
                                _col_dn_win.setSize(1, 0);
                                _col_dn_win.text.setBackgroundColor(_stripe_bg);
                                _col_dn_win.setPosition(_cur_l_pos, _col_dn_t_pos);

                                let _col_up_win = floaty.rawWindow(_lyt.col);
                                _col_up_win.setSize(1, 0);
                                _col_up_win.text.setBackgroundColor(_stripe_bg);
                                _col_up_win.setPosition(_cur_l_pos, _col_up_t_pos);

                                let _hint_win = floaty.rawWindow(_lyt.hint);
                                _hint_win.setSize(1, 0);
                                _hint_win.text.setText(_cur_hint);
                                _hint_win.setPosition(_cur_l_pos, _hint_t_pos);

                                _col_dn_win.setSize(_cur_w, _h.col);
                                _col_up_win.setSize(_cur_w, _h.col);
                                _hint_win.setSize(_cur_w, _h.hint);
                            }

                            let _tt_win = floaty.rawWindow(_lyt.tt);
                            _tt_win.setSize(1, 0);
                            _tt_win.setPosition(_l_pos, _tt_t_pos);
                            _tt_win.setSize(_min_w, _h.tt);

                            debugInfo(["Floaty绘制完毕", "开始Floaty倒计时"]);
                            timeRecorder("flo_tt");

                            _setFloTxt(_ctd);
                            setIntervalBySetTimeout(() => {
                                let _rmng_t = _tt - timeRecorder("flo_tt", "L");
                                let _rmng_ctd = Math.ceil(_rmng_t / 1e3);
                                if (_ctd > _rmng_ctd) {
                                    _ctd = _rmng_ctd;
                                    _setFloTxt(Math.max(0, _ctd));
                                }
                            }, 200, () => {
                                if (_ctd <= 0 || $$flag.floaty_fin) {
                                    if ($$flag.floaty_err) {
                                        messageAction("此设备可能无法使用Floaty功能", 3, 1);
                                        messageAction("建议改用Toast方式显示收取结果", 3);
                                    }

                                    if (!$$flag.floaty_usr_touch) {
                                        let _pref = $$flag.floaty_err ? "强制" : "";
                                        debugInfo(_pref + "关闭所有Floaty窗口");
                                        floaty.closeAll();

                                        if ($$flag.floaty_fin === 0) {
                                            $$flag.floaty_fin = 1;
                                            debugInfo(_pref + "发送Floaty消息结束等待信号");
                                        }
                                        debugInfo(["Floaty倒计时结束", "统计结果展示完毕"]);
                                    }

                                    return reso() || true;
                                }
                            });

                            // tool function(s) //

                            function _getHints() {
                                let _res = [];

                                if (!~_e_own) {
                                    _res.push("SORRY");
                                } else {
                                    _e_own && _res.push("YOURSELF: " + _e_own);
                                    _e_fri && _res.push("FRIENDS: " + _e_fri);
                                }

                                let _len = _res.length;
                                debugInfo("消息数量参数: " + _len);
                                if ($$2(_len)) {
                                    // @returns %alias%.slice(0, 3) + ": \d+g"
                                    _res.forEach((s, i, a) => {
                                        a[i] = s.replace(/(\w{3})\w+(?=:)/, "$1");
                                    });
                                } else if ($$1(_len)) {
                                    // @returns %alias% only
                                    _res.forEach((s, i, a) => {
                                        a[i] = s.replace(/(\w+)(?=:).*/, "$1");
                                    });
                                } else if (!_len) {
                                    let _notes = ("NEVER.contains(SAY+DIE)%5cn" +
                                        "LIFE+!%3d%3d+ALL+ROSES%5cn" +
                                        "IMPOSSIBLE+%3d%3d%3d+undefined%5cn" +
                                        "GOD.FAIR()+%3d%3d%3d+true%5cn" +
                                        "%2f((%3f!GIVE+(UP%7cIN)).)%2b%2fi%5cn" +
                                        "WORKMAN+%3d+new+Work()%5cn" +
                                        "LUCK.length+%3d%3d%3d+Infinity%5cn" +
                                        "LLIST.next+%3d%3d%3d+LUCKY%5cn" +
                                        "BLESSING.discard(DISGUISE)%5cn" +
                                        "WATER.drink().drink()").split("%5cn");
                                    let _len = _notes.length;
                                    let _ran = Math.trunc(Math.rand(_len));
                                    let _raw = _notes[_ran];
                                    let _dec = decodeURIComponent(_raw);
                                    let _hint = _dec.replace(/\+(?!\/)/g, " ");
                                    debugInfo("随机挑选提示语");
                                    _res = [_hint];
                                }

                                return _res;
                            }

                            function _setFloTxt(ctd) {
                                try {
                                    debugInfo("设置倒计时数据文本: " + ctd);
                                    _tt_win.text.setText(surroundWith(ctd, "(", ")"));
                                    delete $$flag.floaty_err;
                                } catch (e) {
                                    if (!$$flag.floaty_fin) {
                                        debugInfo(["Floaty倒计时文本设置单次失败:", e.message]);
                                    }
                                }
                            }
                        }

                        function _getLayouts() {
                            return {
                                msg: <frame gravity="center">
                                    <text id="text" gravity="center" size="24"
                                          bg="#cc000000" color="#ccffffff" padding="10 2"/>
                                </frame>,
                                tt: <frame gravity="center">
                                    <text id="text" gravity="center" size="14"
                                          bg="#cc000000" color="#ccffffff" text=""/>
                                </frame>,
                                col: <frame gravity="center">
                                    <text id="text" gravity="center" size="24"
                                          bg="#ffffff" color="#ffffff" padding="10 2"/>
                                </frame>,
                                hint: <frame gravity="center">
                                    <text id="text" gravity="center" size="14"
                                          bg="#cc000000" color="#ccffffff"/>
                                </frame>,
                            };
                        }

                        function _getHeights() {
                            let _base_h = cY(2 / 3);
                            let _msg_h = cYx(80);
                            let _hint_h = _msg_h * 0.7;
                            return {
                                base: _base_h,
                                msg: _msg_h,
                                hint: _hint_h,
                                tt: _hint_h,
                                col: _msg_h * 0.2, // color stripe
                            };
                        }
                    }
                }
            });
        },
        readyExit() {
            return Promise.resolve()
                .then(_cleanerReady)
                .then(_floatyReady)
                .then(_autoTaskReady)
                .catch(this.err);

            // tool function(s) //

            function _cleanerReady() {
                $$af.cleaner.imgWrapper();
                $$app.blist.save();
                $$app.page.rl.pool.clean();
                $$app.monitor.insurance.interrupt().reset();
                $$app.page.closeIntelligently();
                $$app.page.autojs.spring_board.remove();
                $$flag.glob_e_scr_privilege = true;
            }

            function _floatyReady() {
                return new Promise((reso) => {
                    if (!$$cfg.floaty_result_switch) {
                        $$flag.floaty_fin = 1;
                    }
                    if ($$flag.floaty_fin === 1) {
                        return reso();
                    }

                    timeRecorder("flo_msg");
                    debugInfo("等待Floaty消息结束等待信号");
                    setIntervalBySetTimeout(_reso, 200, _cond);

                    // tool function(s) //

                    function _cond() {
                        if ($$1($$flag.floaty_fin)) {
                            return reso() || true;
                        }
                    }

                    function _reso() {
                        let _ctd = $$cfg.floaty_result_countdown;
                        let _max = (_ctd + 3) * 1e3;
                        if (timeRecorder("flo_msg", "L") > _max) {
                            $$flag.floaty_fin = 1;
                            debugInfo("放弃等待Floaty消息结束信号", 3);
                            debugInfo(">等待结束信号超时", 3);
                        }
                    }
                });
            }

            function _autoTaskReady() {
                return new Promise((reso) => {
                    let _thd = $$app.thd_set_auto_task;
                    if (!_cond()) {
                        debugInfo("等待定时任务设置完成");
                        setIntervalBySetTimeout(_reso, 200, _cond);
                    }

                    // tool function(s) //

                    function _cond() {
                        if (!_thd || !_thd.isAlive()) {
                            return reso() || true;
                        }
                    }

                    function _reso() {
                        let _max = 10e3;
                        if (timeRecorder("set_auto_task", "L") > _max) {
                            messageAction("放弃等待定时任务设置完成", 4);
                            messageAction("等待超时", 4, 0, 1);
                            _thd.interrupt();
                            reso();
                        }
                    }
                });
            }
        },
        scrOffIFN() {
            if ($$bool($$app.init_scr_on_from_broadcast)) {
                $$app.init_scr_on = $$app.init_scr_on_from_broadcast;
            }

            if ($$init.queue.queue.excl_tasks_all_len > 1) {
                return debugInfo(["跳过关闭屏幕", ">当前存在排他性排队任务"]);
            }

            if ($$app.init_scr_on) {
                return debugInfo("无需关闭屏幕");
            }

            $$flag.glob_e_scr_paused = true;
            debugInfo("尝试关闭屏幕");

            if (_scrOffByKeyCode()) {
                return debugInfo("关闭屏幕成功");
            }

            let _err = e => messageAction(e.message, 4, 0, 1, 1);
            return Promise.resolve()
                .then(_scrOffBySetAsync)
                .catch(_err)
                .then(r => debugInfo("关闭屏幕" + (r ? "成功" : "失败")));

            // tool function(s) //

            function _scrOffByKeyCode() {
                debugInfo("尝试策略: 模拟电源按键");

                if (!_bugModel() && !_noRootAccess()) {
                    timeRecorder("scr_off_tt");
                    let _n = 26;
                    if (keycode(_n, {no_err_msg: true})) {
                        let _et = timeRecorder("scr_off_tt", "L", "auto");
                        debugInfo(["策略执行成功", "用时: " + _et]);
                        return true;
                    }
                    debugInfo(["策略执行失败", ">按键模拟失败", ">键值: " + _n]);
                }

                // tool function(s) //

                function _bugModel() {
                    let _bug_models = [/[Mm]eizu/];
                    return _bug_models.some((mod) => {
                        if (device.brand.match(mod)) {
                            debugInfo("跳过当前策略");
                            debugInfo(">设备型号不支持KeyCode方法");
                            debugInfo("`>设备型号: ${device.brand}`".ts);
                            return true;
                        }
                    });
                }

                function _noRootAccess() {
                    if (!$$app.has_root) {
                        debugInfo(["跳过当前策略", ">设备未获取Root权限"]);
                        return true;
                    }
                }
            }

            // by modifying android settings provider
            function _scrOffBySetAsync() {
                let System = android.provider.Settings.System;
                let Global = android.provider.Settings.Global;
                let Secure = android.provider.Settings.Secure;

                let _sto = storages.create("scr_off_by_set");
                let _scr_off_tt = System.SCREEN_OFF_TIMEOUT;
                let _dev_set_enabl = Secure.DEVELOPMENT_SETTINGS_ENABLED;
                let _stay_on_plug = Global.STAY_ON_WHILE_PLUGGED_IN;
                let _ctx_reso = context.getContentResolver();
                let _tt_k = "SCREEN_OFF_TIMEOUT";
                let _stay_on_k = "STAY_ON_WHILE_PLUGGED_IN";
                let _res = false;

                debugInfo("尝试策略: 修改屏幕超时参数");

                if (!System.canWrite(context)) {
                    let _nm = "Auto.js_Write_Settings_Permission_Helper";
                    let _path = files.path("./Tools/" + _nm + ".js");
                    let _msg = '需要"修改系统设置"权限';

                    messageAction("策略执行失败", 3, 0, 0, -1);
                    messageAction(_msg, 3, 0, 1);
                    messageAction("可使用以下工具获得帮助支持", 3, 0, 1);
                    messageAction(_path, 3, 0, 1, 1);

                    return toast("关闭屏幕失败\n" + _msg, "Long");
                }

                return Promise.resolve()
                    .then(_initScrOffState)
                    .then(_monScrStatAsync)
                    .then(_restoreScrState)
                    .catch(e => messageAction(e, 4));

                // tool function(s) //

                function _initScrOffState() {
                    timeRecorder("set_provider");
                    $$link(_toast).$(_backup).$(_listeners);

                    // tool function(s) //

                    function _toast() {
                        toast(
                            "正在尝试关闭屏幕...\n" +
                            "请勿操作屏幕或按键...\n" +
                            "此过程可能需要数十秒...", "Long"
                        );
                    }

                    function _backup() {
                        _sto.put(_tt_k, System.getInt(_ctx_reso, _scr_off_tt, 0));
                        _setScrOffTt(0); // screen off asap
                        _sto.remove(_stay_on_k);

                        let _aim_stay_on = 0;
                        let _cur_stay_on = Global.getInt(_ctx_reso, _stay_on_plug, 0);
                        let _cur_dev_enabl = Secure.getInt(_ctx_reso, _dev_set_enabl, 0);

                        if (_cur_dev_enabl && _cur_stay_on) {
                            if (_cur_stay_on !== _aim_stay_on) {
                                _sto.put(_stay_on_k, _cur_stay_on);
                                _setStayOnStat(_aim_stay_on);
                            }
                        }
                    }

                    function _listeners() {
                        $$link(_scrTouch).$(_keyPress);

                        // tool function(s) //

                        function _scrTouch() {
                            let _cvr_win = $$app.flo_cvr_win = floaty.rawWindow(
                                <frame id="cover" gravity="center"/>
                            );
                            _cvr_win.setTouchable(true);
                            _cvr_win.setSize(-1, -1);
                            _cvr_win["cover"].setOnTouchListener({
                                onTouch() {
                                    $$flag.scr_off_intrp_by_usr = true;
                                    _msg("中止屏幕关闭", "检测到屏幕触碰");
                                    _cvr_win.close();
                                },
                            });
                        }

                        function _keyPress() {
                            events.observeKey();
                            events.on("key_down", function (kc) {
                                $$flag.scr_off_intrp_by_usr = true;
                                _msg("中止屏幕关闭", "检测到按键行为", "键值: " + kc);
                            });
                        }

                        function _msg() {
                            let _args = [].slice.call(arguments);
                            toast(_args.join("\n"), "Long", "Force");
                            debugInfo("__split_line__");
                            debugInfo(_args);
                            debugInfo("__split_line__");
                        }
                    }
                }

                function _monScrStatAsync() {
                    return new Promise((reso) => {
                        setIntervalBySetTimeout(_check, 200, _cond);

                        // tool function(s) //

                        function _check() {
                            if (timeRecorder("set_provider", "L") > 40e3) {
                                debugInfo(["策略执行失败", ">等待屏幕关闭时间已达阈值"]);
                                debugInfo([">有关此策略更多信息", ">可使用并参阅以下工具:"]);
                                debugInfo(">" + files.path(
                                    "./Tools/Auto.js_Write_Settings_Permission_Helper.js"
                                ));
                                reso(_monScrStatAsync.uphold = false);
                            }
                            if ($$flag.scr_off_intrp_by_usr) {
                                reso(_monScrStatAsync.uphold = false);
                            }
                        }

                        function _cond() {
                            if ($$F(_monScrStatAsync.uphold)) {
                                return true;
                            }
                            if (!device.isScreenOn()) {
                                let _et = timeRecorder("set_provider", "L", "auto");
                                debugInfo(["策略执行成功", "用时: " + _et]);
                                reso(_res = true);
                                return true;
                            }
                        }
                    });
                }

                function _restoreScrState() {
                    debugInfo("恢复修改前的设置参数:");

                    _setScrOffTt(_sto.get(_tt_k, 60e3));
                    _setStayOnStat(_sto.get(_stay_on_k));

                    storages.remove("scr_off_by_set");

                    return _res;
                }

                function _setScrOffTt(tt_value) {
                    if (!$$und(tt_value)) {
                        debugInfo(_tt_k + ": " + tt_value);
                        System.putInt(_ctx_reso, _scr_off_tt, tt_value);
                    }
                }

                function _setStayOnStat(stat) {
                    if (!$$und(stat)) {
                        debugInfo(_stay_on_k + ": " + stat);
                        Global.putInt(_ctx_reso, _stay_on_plug, stat);
                    }
                }
            }
        },
        exitNow: () => $$app.exit(),
        err(e) {
            messageAction(e.message, 4, 1, 0, -1);
            messageAction(e.stack, 4, 0, 0, 1);
            this.exitNow();
        },
    },
    launch() {
        this._launcher.greet().assign().home().ready();
        return $$af;
    },
    collect() {
        let {own, fri} = this._collector;
        own.trigger() && own.init().collect();
        fri.trigger() && fri.init().launch().collect();
        return $$af;
    },
    timers() {
        let t = this._timers_setter;
        t.trigger() && t.autoTask();
        return $$af;
    },
    epilogue() {
        let _ = this._epilogue_setter;
        _.logBackIFN();
        Promise.all([_.showResult(), _.readyExit()])
            .then(_.scrOffIFN)
            .then(_.exitNow)
            .catch(_.err);
    },
    bind() {
        let _c = this._collector;
        _c.parent = this;
        _c.own.parent = _c.fri.parent = _c;
        delete this.bind; // optional
        return this;
    },
}.bind();

// entrance //
$$init.check().global().queue().delay().monitor().unlock().prompt().command();

$$af.launch().collect().timers().epilogue();

/**
 * @appendix Code abbreviation dictionary
 * May be helpful for code readers and developers
 * Not all items showed up in this project
 * @abbr a11y: accessibility | acc: account | accu: accumulated | act: action; activity | add: additional | af: ant forest | agn: again | ahd: ahead | amt: amount | anm: animation | app: application | arci: archive(d) | args: arguments | argv: argument values | asg: assign | asgmt: assignment | async: asynchronous | avail: available | avt: avatar | b: bottom; bounds; backup; bomb | bak: backup | bd: bound(s) | blist: blacklist | blt: bilateral | bnd: bound(s) | btm: bottom | btn: button | buf: buffer | c: compass; coordination(s) | cf: comparison (latin: conferatur) | cfg: configuration | cfm: confirm | chk: check | cln: clean | clp: clip | cmd: command | cnsl: console | cnt: content; count | cntr: container | col: color | compr: compress(ed) | cond: condition | constr: constructor | coord: coordination(s) | ctd: countdown | ctr: counter | ctx: context | cur: current | cvr: cover | cwd: current working directory | cwp: current working path | cxn: connection | d: dialog | dat: data | dbg: debug | dc: decrease | dec: decode; decrypt | def: default | del: delete; deletion | desc: description | dev: device; development | diag: dialog | dic: dictionary | diff: difference | dis: dismiss | disp: display | dist: distance; disturb; disturbance | dn: down | dnt: donation | drxn: direction | ds: data source | du: duration | dupe: duplicate; duplicated; duplication | dys: dysfunctional | e: error; engine; event | eball(s): energy ball(s) | egy: energy | ele: element | emount: energy amount | enabl: enable; enabled | enc: encode; encrypt | ens: ensure | ent: entrance | eq: equal | eql: equal | et: elapsed time | evt: event | exc: exception | excl: exclusive | excpt: exception | exec: execution | exp: expected | ext: extension | fg: foreground; flag | flg: flag | flo: floaty | fltr: filter | forc: force; forcible; forcibly | frac: fraction | fri: friend | frst: forest | fs: functions | fst: forest | fx: function | fxo: function object (an object with some functions) | gdball(s): golden ball(s) | glob: global | grn: green | gt: greater than | h: height; head(s) | his: history | horiz: horizontal | i: intent; increment | ic: increase | ident: identification | idt: identification | idx: index | ifn: if needed | inf: information | info: information | inp: input | ins: insurance | inst: instant | intrp: interrupt | invt: invitation | ipt: input | itball(s): initialized ball(s) | itp: interpolate | itv: interval | js: javascript | k: key | kg: keyguard | kw: keyword | l: left | lbl: label | lch: launch | len: length | lmt: limit | ln: line | ls: list | lsn(er(s)): listen; listener(s) | lv: level | lyr: layer | lyt: layout | man: manual(ly) | mch: matched | mod: module | mon: monitor | monit: monitor | msg: message | mthd: method | mv: move | n: name; nickname | nball(s): normal ball(s) | nec: necessary | neg: negative | neu: neutral | nm: name | num: number | nxt: next | o: object | oball(s): orange ball(s) | opr: operation | opt: option; optional | or: orientation | org: orange | oth: other | ovl: overlap | p: press; parent | par: parameter | param: parameter | pat: pattern | pct: percentage | pg: page | pkg: package | pos: position | pref: prefix | prog: progress | prv: privilege | ps: preset | pwr: power | q: queue | qte: quote | que: queue | r: right; region | ran: random | rch: reach; reached | rec: record; recorded; rectangle | rect: rectangle | relbl: reliable | req: require; request | res: result; restore | reso: resolve; resolver | resp: response | ret: return | rev: review | rl: rank list | rls: release | rm: remove | rmng: remaining | rsn: reason | rst: reset | s: second(s); stack | sav: save | sc: script | scr: screen | sec: second | sect: section | sel: selector; select(ed) | sels: selectors | set: settings | sep: separator | sgl: single | sgn: signal | simpl: simplify | sltr: selector | smp: sample | spl: special | src: source | stab: stable | stat: statistics | stg: strategy | sto: storage | str: string | succ: success; successful | suff: suffix | svc: service | svr: server | sw: switch | swp: swipe | sxn: section(s) | sym: symbol | sz: size | t: top; time | tar: target | thd(s): thread(s) | thrd: threshold | tmo: timeout | tmp: temporary | tpl: template | treas: treasury; treasuries | trig: trigger; triggered | ts: timestamp | tt: title; timeout | tv: text view | txt: text | u: unit | uncompr: uncompressed | unexp: unexpected | unintrp: uninterrupted | unlk: unlock: unlocked | usr: user | util: utility | v: value | val: value | vert: vertical | w: widget | wball(s): water ball(s) | wc: widget collection | win: window
 */