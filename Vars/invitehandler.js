
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
        const contact = ms.message.contactMessage;
        phoneNumber = contact.vcard?.match(/waid=(\d+)/)?.[1] || 
                     contact.vcard?.match(/TEL[^:]*:([\+\d\-\s\(\)]+)/i)?.[1]?.replace(/[^0-9]/g, '') ||
                     contact.phoneNumber?.replace(/[^0-9]/g, '');
        contactName = contact.displayName || contact.pushName || contact.vcard?.match(/FN:(.*)/i)?.[1]?.trim() || "User";
        
        // Add logging
        console.log("Contact received:", {phoneNumber, contactName, rawContact: contact});
      } 
      // Handle contactsArrayMessage type
      else if (ms.message?.contactsArrayMessage) {
        const contact = ms.message.contactsArrayMessage[0];
        phoneNumber = contact.vcard?.match(/waid=(\d+)/)?.[1] || 
                     contact.vcard?.match(/TEL[^:]*:([\+\d\-\s\(\)]+)/i)?.[1]?.replace(/[^0-9]/g, '');
        contactName = contact.displayName;
      }
      // Handle direct number in text
      else if (ms.message?.conversation || ms.message?.extendedTextMessage?.text) {
        const text = ms.message?.conversation || ms.message?.extendedTextMessage?.text;
        phoneNumber = text.match(/(\+?\d{10,})/)?.[1]?.replace(/[^0-9]/g, '');
      }

      if (phoneNumber) {
        // Format phone number
        if (phoneNumber) {
          // Remove any non-numeric characters
          phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
          
          // Convert to international format
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '254' + phoneNumber.substring(1);
          } else if (phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.substring(1);
          } else if (!phoneNumber.startsWith('254')) {
            phoneNumber = '254' + phoneNumber;
          }
          
          console.log("Formatted phone number:", phoneNumber);
        }

        // Save contact to database
        await saveContact(phoneNumber);
        
        try {
          // Send message to the contact
          await zk.sendMessage(phoneNumber + '@s.whatsapp.net', {
            text: "Hello! You've been added to my contacts. Please save my number too!"
          });

          // Confirm to sender
          await zk.sendMessage(ms.key.remoteJid, {
            text: `✅ Contact ${phoneNumber} ${contactName ? `(${contactName})` : ''} has been saved and messaged successfully.`
          });
        } catch (error) {
          console.error('Error sending message:', error);
          await zk.sendMessage(ms.key.remoteJid, {
            text: `❌ Failed to send message to ${phoneNumber}. However, contact was saved to database.`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in invite handler:', error);
  }
}

module.exports = handleInvite;
