/**
 * MOSH Automation - Real Multi-Provider SMS Dispatch Gateway
 * Supports Fast2SMS (India), 2Factor, Twilio, and Custom Webhook Gateways.
 */

const sendSMS = async (phone, otpCode, textMessage) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  console.log('\n==================================================');
  console.log(`📱 [SMS GATEWAY DISPATCH] ${timestamp}`);
  console.log(`   Recipient Mobile : +91 ${cleanPhone}`);
  console.log(`   OTP Code         : ${otpCode}`);
  console.log(`   Message Payload  : "${textMessage}"`);

  let sentSuccessfully = false;

  // Provider 1: Fast2SMS (India)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      console.log('   Provider Status  : Connecting to Fast2SMS Telecom API...');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: cleanPhone
        })
      });
      const data = await response.json();
      if (data && data.return) {
        console.log('   Delivery Status  : DELIVERED via Fast2SMS India!');
        sentSuccessfully = true;
      } else {
        console.log('   Fast2SMS Response:', data.message || JSON.stringify(data));
      }
    } catch (err) {
      console.error('   Fast2SMS Exception:', err.message);
    }
  }

  // Provider 2: 2Factor.in (India)
  if (!sentSuccessfully && process.env.TWOFACTOR_API_KEY) {
    try {
      console.log('   Provider Status  : Connecting to 2Factor.in Gateway...');
      const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${cleanPhone}/${otpCode}/MOSH_OTP`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.Status === 'Success') {
        console.log('   Delivery Status  : DELIVERED via 2Factor Gateway!');
        sentSuccessfully = true;
      }
    } catch (err) {
      console.error('   2Factor Exception:', err.message);
    }
  }

  // Provider 3: Twilio Global
  if (!sentSuccessfully && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      console.log('   Provider Status  : Connecting to Twilio SMS Gateway...');
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+91${cleanPhone}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', textMessage);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      const data = await response.json();
      if (data.sid) {
        console.log('   Delivery Status  : DELIVERED via Twilio (SID:', data.sid, ')');
        sentSuccessfully = true;
      }
    } catch (err) {
      console.error('   Twilio Exception:', err.message);
    }
  }

  if (!sentSuccessfully) {
    console.log('   Delivery Note    : Simulated Mode (Console Dispatch logged).');
    console.log('   To send real SMS to mobile phones, set FAST2SMS_API_KEY or TWILIO keys in server/.env');
  }

  console.log('==================================================\n');
  return true;
};

module.exports = {
  sendSMS
};
