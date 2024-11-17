const axios = require('axios');

async function getIceServers() {
    try {
        const response = await axios.put(
            'https://global.xirsys.net/_turn/dating-web',
            {
                format: "urls"
            },
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(
                        `${process.env.XIRSYS_API_KEY}:${process.env.XIRSYS_CREDENTIAL}`
                    ).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.v) {
            return response.data.v.iceServers;
        }
        throw new Error('Invalid response from XirSys');
    } catch (error) {
        console.error('XirSys error:', error);
        // Fallback to public STUN servers if XirSys fails
        return [{
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        }];
    }
}

module.exports = { getIceServers };