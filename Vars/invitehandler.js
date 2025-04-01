
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2'
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
  
  console.log("Invite handler triggered with auto:", global.INVITE_AUTO);

  try {
    const msg = ms.message;
    let phoneNumber = null;

    // Extract phone number from vCard
    if (msg.contactMessage) {
      phoneNumber = msg.contactMessage.vcard.match(/TEL.*?:(.*?)\n/)?.[1]?.replace(/[^0-9]/g, '');
    } 
    // Extract direct phone number
    else if (msg.conversation) {
      phoneNumber = msg.conversation.match(/\d{10,}/)?.[0];
    }

    if (phoneNumber) {
      await saveContact(phoneNumber);
      await zk.sendMessage(phoneNumber + '@s.whatsapp.net', {
        text: "You've been already saved......save Trekker"
      });
    }
  } catch (error) {
    console.error('Error in invite handler:', error);
  }
}

module.exports = handleInvite;
