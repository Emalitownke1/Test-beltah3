
const { keith } = require('../keizzah/keith');
const { Pool } = require('pg');
const fs = require('fs');
const { Parser } = require('json2csv');

const pool = new Pool({
  connectionString: 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2'
});

keith({
  nomCom: 'invitescsv',
  categorie: "system"
}, async (chatId, zk, context) => {
  const { repondre, superUser, ms } = context;

  if (!superUser) {
    return repondre("This command is restricted to the bot owner");
  }

  try {
    const result = await pool.query('SELECT phone_number, TO_CHAR(saved_date, \'YYYY-MM-DD HH24:MI:SS\') as saved_date FROM saved_contacts ORDER BY saved_date DESC');
    const fields = ['phone_number', 'saved_date'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(result.rows);
    
    fs.writeFileSync('saved_contacts.csv', csv);

    await zk.sendMessage(chatId, {
      document: fs.readFileSync('saved_contacts.csv'),
      mimetype: 'text/csv',
      fileName: 'saved_contacts.csv'
    }, { quoted: ms });

    fs.unlinkSync('saved_contacts.csv');
  } catch (error) {
    console.error('Error generating CSV:', error);
    repondre("Error generating contacts CSV");
  }
});
