// Serverless API - 邀请码功能合并端点（查询开关 + 即时校验）_7ree
import { INVITATION_CONFIG_7ree, validateInvitation_7ree } from '../config/invitationConfig.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // 查询开关
            return res.status(200).json({
                enabled: !!INVITATION_CONFIG_7ree.ENABLED
            });
        }

        if (req.method === 'POST') {
            // 即时校验
            const { invitation_7ree } = req.body || {};

            // 未启用则直接视为有效（兼容前端逻辑）
            if (!INVITATION_CONFIG_7ree?.ENABLED) {
                return res.status(200).json({ valid: true });
            }

            if (!invitation_7ree || typeof invitation_7ree !== 'string') {
                return res.status(400).json({ error: '邀请码不能为空' });
            }

            const ok = validateInvitation_7ree(invitation_7ree);
            if (!ok) {
                return res.status(400).json({ error: '邀请码无效或已过期，请检查后重试' });
            }

            return res.status(200).json({ valid: true });
        }

        // 其他方法不允许
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('邀请码合并端点错误:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}