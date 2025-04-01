
const { keith } = require("../keizzah/keith");

keith({
  nomCom: "vcardinfo",
  desc: "Get detailed information from a shared contact",
  categorie: "General",
  reaction: "📇"
}, async (dest, zk, commandeOptions) => {
  const { repondre, msgRepondu } = commandeOptions;

  if (!msgRepondu) {
    return repondre("Please reply to a contact message.");
  }

  if (!msgRepondu.message?.contactMessage) {
    return repondre("This is not a contact message.");
  }

  const contact = msgRepondu.message.contactMessage;
  let info = "*Contact Information*\n\n";

  // Extract basic info
  info += `🔖 *Name:* ${contact.displayName || 'N/A'}\n`;
  
  // Extract phone number from vCard
  const phoneMatch = contact.vcard?.match(/TEL[^:]*:([\+\d\-\s\(\)]+)/i);
  const waMatch = contact.vcard?.match(/waid=(\d+)/);
  const phoneNumber = waMatch?.[1] || phoneMatch?.[1]?.replace(/[^0-9]/g, '') || 'N/A';
  
  info += `📱 *Phone:* +${phoneNumber}\n`;

  // Extract additional vCard fields
  if (contact.vcard) {
    // Get organization
    const orgMatch = contact.vcard.match(/ORG:([^\n]+)/i);
    if (orgMatch) info += `🏢 *Organization:* ${orgMatch[1].trim()}\n`;

    // Get email
    const emailMatch = contact.vcard.match(/EMAIL[^:]*:([^\n]+)/i);
    if (emailMatch) info += `📧 *Email:* ${emailMatch[1].trim()}\n`;

    // Get address
    const addressMatch = contact.vcard.match(/ADR[^:]*:([^\n]+)/i);
    if (addressMatch) info += `📍 *Address:* ${addressMatch[1].trim()}\n`;
  }

  info += `\n🤖 _Analyzed by ${conf.BOT}_`;

  await repondre(info);
});
