/*
 * ========================================
 * 📨 邀请码配置与校验（_7ree）
 * ========================================
 * 通过配置开关控制是否启用邀请码；当启用时，完整邀请码由：
 * MAIN_CODE + 动态附加码 组成。
 * 动态附加码支持两种算法：
 * - YEAR_MONTH: 年月（yyMM），例如：2025年08月 → 2508
 * - MONTH_DAY:  月日（MMdd），例如：08月09日 → 0809
 */

export const INVITATION_CONFIG_7ree = {
    ENABLED: true,                // 是否启用邀请码
    MAIN_CODE: '777777',           // 主验证码字串（自行修改）
    SUFFIX_MODE: 'MONTH_DAY'      // 附加码算法：'YEAR_MONTH' | 'MONTH_DAY'
};

// 计算动态附加码
export function getDynamicSuffix_7ree(date = new Date()) {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    if (INVITATION_CONFIG_7ree.SUFFIX_MODE === 'YEAR_MONTH') {
        // 年月：yyMM → 2508
        return `${yy}${mm}`;
    }
    // 默认按月日：MMdd → 0809
    return `${mm}${dd}`;
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