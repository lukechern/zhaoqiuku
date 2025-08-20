// Serverless API - 邀请码开关查询（_7ree）
import { INVITATION_CONFIG_7ree } from '../config/invitationConfig.js';

export default async function handler(req, res) {
    // 仅允许GET与OPTIONS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        return res.status(200).json({
            enabled: !!INVITATION_CONFIG_7ree.ENABLED
        });
    } catch (error) {
        console.error('读取邀请码配置失败:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}