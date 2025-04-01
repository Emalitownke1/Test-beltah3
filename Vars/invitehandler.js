
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2',
  ssl: {
    rejectUnauthorized: false
  }
});

async function saveContact(phoneNumber) {
  try {
    await pool.query('INSERT INTO saved_contacts (phone_number) VALUES ($1) ON CONFLICT DO NOTHING', [phoneNumber]);
    return true;
  } catch (error) {
    console.error('Error saving contact:', error);
    return false;
  }
}

async function handleInvite(zk, ms, conf) {
  if (global.INVITE_AUTO !== 'yes') return;
  
  try {
    // Check if it's a private chat
    if (!ms.key.remoteJid.endsWith('@g.us')) {
      let phoneNumber = null;
      let contactName = null;

      // Handle contact message type
      if (ms.message?.contactMessage) {
        const vcard = ms.message.contactMessage.vcard;
        phoneNumber = vcard.match(/waid=(\d+)/)?.[1] || 
                     vcard.match(/TEL.*?:(.+?)(?=\n|$)/i)?.[1]?.replace(/[^0-9]/g, '');
        contactName = vcard.match(/FN:(.*)/i)?.[1]?.trim();
      } 
      // Handle direct number in text
      else if (ms.message?.conversation) {
        phoneNumber = ms.message.conversation.match(/(\+?\d{10,})/)?.[1]?.replace(/[^0-9]/g, '');
      }

      if (phoneNumber) {
        // Format phone number
        if (!phoneNumber.startsWith('254')) {
          if (phoneNumber.startsWith('+254')) {
            phoneNumber = phoneNumber.substring(1);
          } else if (phoneNumber.startsWith('0')) {
            phoneNumber = '254' + phoneNumber.substring(1);
          }
        }

        // Save contact to database
        await saveContact(phoneNumber);
        
        // Send message to the contact
        try {
          await zk.sendMessage(phoneNumber + '@s.whatsapp.net', {
            text: "your been already saved......save Trekker"
          });

          // Confirm to sender
          await zk.sendMessage(ms.key.remoteJid, {
            text: `✅ Contact ${phoneNumber} ${contactName ? `(${contactName})` : ''} has been saved and messaged.`
          });
        } catch (error) {
          console.error('Error sending message:', error);
          await zk.sendMessage(ms.key.remoteJid, {
            text: `❌ Failed to send message to ${phoneNumber}. Contact saved.`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in invite handler:', error);
  }
}

module.exports = handleInvite;
