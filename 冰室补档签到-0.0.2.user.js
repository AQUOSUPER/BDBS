// ==UserScript==
// @name              冰室补档签到
// @namespace         https://manhuabudangbbs.com
// @version           0.0.2
// @description       自动签到脚本，帮助用户在网站上完成每日签到
// @author            AQUOS
// @match             https://www.manhuabudangbbs.com/u.php
// @require           https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_xmlhttpRequest
// @noframes
// ==/UserScript==

/* global axios */

// 样式优化：更现代的提示框
const tipStyle = `
z-index: 9999;
padding: 12px 24px;
position: fixed;
right: 20px;
bottom: 20px;
background: #fff;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
border-left: 4px solid;
font-family: system-ui, sans-serif;
display: flex;
align-items: center;
`;

// 显示提示框的函数
function showTips(text, color = "#00c8f5") {
    const existingTip = document.getElementById('signInBox');
    if (existingTip) existingTip.remove();

    const tip = document.createElement('div');
    tip.id = "signInBox";
    tip.innerHTML = text;
    tip.style = tipStyle;
    tip.style.borderLeftColor = color;

    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 5000);
}

// 获取关键参数
function getFormParams(html) {
    const verify = html.match(/name="verify" value="([^"]+)"/)?.[1];
    const step = html.match(/name="step" value="([^"]+)"/)?.[1];

    if (!verify || !step) {
        throw new Error("无法提取签到所需参数");
    }

    return { verify, step };
}

// 核心签到逻辑
async function performSignIn() {
    try {
        // 检查今日是否已签到
        const lastSign = GM_getValue('lastSign');
        if (lastSign === new Date().toDateString()) {
            showTips("今日已签到，请明天再来", "#ffa500");
            return;
        }

        // 获取基础页面
        const { data } = await axios.get('https://www.manhuabudangbbs.com/u.php', {
            responseType: 'text',
            timeout: 5000
        });

        // 检查登录状态
        if (!data.includes('logout.php?formhash=')) {
            throw new Error("未检测到登录状态，请先登录");
        }

        // 提取表单参数
        const { verify, step } = getFormParams(data);

        // 提交签到请求
        const response = await axios.post(
            `https://www.manhuabudangbbs.com/jobcenter.php?action=punch&verify=${verify}`,
            `step=${step}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 8000
            }
        );

        // 解析结果
        const result = response.data.match(/message":'(.*?)'/)?.[1] || "未知响应";

        if (result.includes('成功') || result.includes('已打卡')) {
            GM_setValue('lastSign', new Date().toDateString());
            showTips(result, "#4CAF50");
        } else {
            showTips(result, "#F44336");
        }
    } catch (error) {
        console.error(`[签到失败] ${error.message}`);
        showTips(`签到失败：${error.message}`, "#F44336");
    }
}

// 执行入口
(function() {
    'use strict';

    // 确保只在主框架运行
    if (window.self !== window.top) return;

    // 加入延时避免阻塞页面加载
    setTimeout(performSignIn, 3000);
})();