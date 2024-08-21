const axios = require('axios');
const { POWER_BI_CLIENT_ID, POWER_BI_CLIENT_SECRET, POWER_BI_TENANT_ID, POWER_BI_REPORT_ID, POWER_BI_GROUP_ID } = require('../config/config');

const getPowerBIReport = async (req, res) => {
  try {
    const authResponse = await axios.post(`https://login.microsoftonline.com/${POWER_BI_TENANT_ID}/oauth2/v2.0/token`, null, {
      params: {
        grant_type: 'client_credentials',
        client_id: POWER_BI_CLIENT_ID,
        client_secret: POWER_BI_CLIENT_SECRET,
        scope: 'https://api.powerbi.com/.default'
      }
    });

    const accessToken = authResponse.data.access_token;

    const reportResponse = await axios.get(`https://api.powerbi.com/v1.0/myorg/groups/${POWER_BI_GROUP_ID}/reports/${POWER_BI_REPORT_ID}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const embedTokenResponse = await axios.post(`https://api.powerbi.com/v1.0/myorg/groups/${POWER_BI_GROUP_ID}/reports/${POWER_BI_REPORT_ID}/GenerateToken`, null, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    res.json({
      embedUrl: reportResponse.data.embedUrl,
      embedToken: embedTokenResponse.data.token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching Power BI report' });
  }
};

module.exports = { getPowerBIReport };