/*
 * ========================================
 * 📨 邀请码配置与校验（_7ree）
 * ========================================
 * 通过配置开关控制是否启用邀请码；当启用时，完整邀请码由：
 * MAIN_CODE + 动态附加码 组成。
 * 动态附加码支持三种算法：
 * - YEAR_MONTH: 年月（yyMM），例如：2025年08月 → 2508
 * - MONTH_DAY:  月日（MMdd），例如：08月09日 → 0809
 * - DAY_HOUR:   日时（ddHH），例如：08月09日 14时 → 0914
 */

export const INVITATION_CONFIG_7ree = {
    ENABLED: true,                // 是否启用邀请码
    MAIN_CODE: '7777',           // 主验证码字串（自行修改）
    SUFFIX_MODE: 'DAY_HOUR'      // 附加码算法：'YEAR_MONTH' | 'MONTH_DAY' | DAY_HOUR
};

// 固定用于计算附加码的时区（与前端显示保持一致）
const TIMEZONE_7REE = 'Asia/Shanghai';

// 基于指定时区获取日期组成部分
function getDatePartsInTZ_7ree(date = new Date(), timeZone = TIMEZONE_7REE) {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = fmt.formatToParts(date);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return { y, m, d };
}

// 基于指定时区获取小时
function getHourInTZ_7ree(date = new Date(), timeZone = TIMEZONE_7REE) {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        hour12: false
    });
    const parts = fmt.formatToParts(date);
    const h = parts.find(p => p.type === 'hour').value;
    return h.padStart(2, '0');
}

// 计算动态附加码（按固定时区）
export function getDynamicSuffix_7ree(date = new Date()) {
    const { y, m, d } = getDatePartsInTZ_7ree(date);
    const yy = y.slice(-2);

    if (INVITATION_CONFIG_7ree.SUFFIX_MODE === 'YEAR_MONTH') {
        // 年月：yyMM → 2508
        return `${yy}${m}`;
    } else if (INVITATION_CONFIG_7ree.SUFFIX_MODE === 'DAY_HOUR') {
        // 日时：ddHH → 0914
        const h = getHourInTZ_7ree(date);
        return `${d}${h}`;
    }
    // 默认按月日：MMdd → 0809
    return `${m}${d}`;
}

// 生成今日完整邀请码
export function getTodayFullInvitation_7ree(date = new Date()) {
    return `${INVITATION_CONFIG_7ree.MAIN_CODE}${getDynamicSuffix_7ree(date)}`;
}

// 校验邀请码
export function validateInvitation_7ree(inputCode, date = new Date()) {
    if (!INVITATION_CONFIG_7ree.ENABLED) return true; // 未启用则始终通过
    if (!inputCode) return false;
    const expected = getTodayFullInvitation_7ree(date);
    return inputCode === expected;
}