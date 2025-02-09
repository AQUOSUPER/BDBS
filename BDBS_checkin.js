// ==UserScript==
// @name              BDBS_checkin
// @namespace         https://manhuabudangbbs.com
// @version           0.0.1
// @description       自动签到脚本，帮助用户在网站上完成每日签到
// @author            AQUOS
// @match             https://www.manhuabudangbbs.com/u.php
// @require           https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @grant             GM_setValue
// @grant             GM_getValue
// @noframes
// ==/UserScript==

/* global axios */

// 显示提示框的函数
function showTips(text, position = 0, color = "#00c8f5") {
    var Msg = document.createElement('div');
    Msg.id = "signInBox";
    Msg.innerHTML = text;
    Msg.style = `z-index: 1000; background-color: #fff; height: 40px; width: 300px; position: fixed; text-align: center; font-weight: bold; font-size: 16px; line-height: 40px; border-top: 2px solid ${color}; border-bottom: 2px solid ${color};`;

    switch (position) {
        case 1:
            Msg.style.left = '10px';
            Msg.style.bottom = '10px';
            break;
        case 2:
            Msg.style.left = '10px';
            Msg.style.top = '10px';
            break;
        case 3:
            Msg.style.right = '10px';
            Msg.style.top = '10px';
            break;
        default:
            Msg.style.right = '10px';
            Msg.style.bottom = '10px';
            break;
    }

    document.body.appendChild(Msg);
    setTimeout(() => {
        document.body.removeChild(Msg);
    }, 5000); // 5秒后移除提示框
}

console.log("脚本开始执行");

async function run(param) {
    try {
        console.log("开始获取页面数据");
        const resp = await axios.get('https://www.manhuabudangbbs.com/u.php');

        // 检查是否已登录
        if (/您还没有登录或注册/.test(resp.data)) {
            throw new Error("需要登录");
        }

        // 获取隐藏字段 verify 和 step
        const verifyMatch = /<input type="hidden" name="verify" value="([^"]+)/.exec(resp.data);
        const stepMatch = /<input type="hidden" name="step" value="([^"]+)/.exec(resp.data);

        if (!(verifyMatch && verifyMatch[1])) {
            throw new Error("未找到 verify ！");
        }
        if (!(stepMatch && stepMatch[1])) {
            throw new Error("未找到 step ！");
        }

        // 执行签到操作
        const resp1 = await axios.post(`https://www.manhuabudangbbs.com/jobcenter.php?action=punch&verify=${verifyMatch[1]}`,
            `step=${stepMatch[1]}`);

        // 解析返回的消息
        const messageMatch = /message":'(.*?)'/.exec(resp1.data);
        if (!(messageMatch && messageMatch[1])) {
            throw new Error("签到信息中未返回 message ！");
        }

        // 检查是否已经签到
        if (messageMatch[1] === '你已经打卡,请明天再试') {
            showTips("重复签到", 0, "#ff5733"); // 红色表示错误
            return "重复签到";
        }

        // 显示签到成功的提示框
        showTips(messageMatch[1], 0, "#28a745"); // 绿色表示成功

        return messageMatch[1]; // 返回签到成功的消息

    } catch (error) {
        console.error("发生错误:", error.message);
        showTips(`发生错误: ${error.message}`, 0, "#ff5733"); // 红色提示错误
        return `发生错误: ${error.message}`;
    }
}

async function check(param) {
    try {
        // 检查是否已登录
        const resp = await axios.get("https://www.manhuabudangbbs.com/u.php");
        return !(/您还没有登录或注册/.test(resp.data));
    } catch (error) {
        console.error("检查登录状态时发生错误:", error.message);
        return false;
    }
}

// 执行签到操作
run();
