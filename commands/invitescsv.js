
const { keith } = require('../keizzah/keith');
const { Pool } = require('pg');
const fs = require('fs');
const { Parser } = require('json2csv');

const pool = new Pool({
  connectionString: 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2',
  ssl: {
    rejectUnauthorized: false
  }
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
    // First check if table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'saved_contacts'
      );
    `);

    if (!checkTable.rows[0].exists) {
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_contacts (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) UNIQUE,
          saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return repondre("Created new contacts table. No contacts saved yet.");
    }

    const result = await pool.query('SELECT phone_number, saved_date FROM saved_contacts ORDER BY saved_date DESC');
    
    if (result.rows.length === 0) {
      return repondre("No contacts found in database.");
    }

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
    
    await repondre(`Successfully exported ${result.rows.length} contacts to CSV.`);
  } catch (error) {
    console.error('Error generating CSV:', error);
    await repondre(`Error: ${error.message}. Please try again.`);
  }
});
