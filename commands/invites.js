
const { keith } = require('../keizzah/keith');
const { Pool } = require('pg');

// Static PostgreSQL connection config
const pool = new Pool({
  connectionString: 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2'
});

// Create table if not exists
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_contacts (
        phone_number VARCHAR(20) PRIMARY KEY,
        saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initDatabase();

// Function to save contact to database
async function saveContact(phoneNumber) {
  try {
    await pool.query('INSERT INTO saved_contacts (phone_number) VALUES ($1) ON CONFLICT DO NOTHING', [phoneNumber]);
    return true;
  } catch (error) {
    console.error('Error saving contact:', error);
    return false;
  }
}

keith({
  nomCom: 'invites',
  categorie: "system"
}, async (chatId, zk, context) => {
  const { repondre, superUser, arg } = context;

  if (!superUser) {
    return repondre("This command is restricted to the bot owner");
  }

  if (!arg[0]) {
    return repondre('Type ".invites yes" to enable or ".invites no" to disable');
  }

  const option = arg.join(' ').toLowerCase();
  switch (option) {
    case "yes":
      global.INVITE_AUTO = 'yes';
      responseMessage = 'Auto invite has been enabled successfully ✅';
      break;

    case "no":
      s.INVITE_AUTO = 'no';
      responseMessage = 'Auto invite has been disabled successfully.';
      break;

    default:
      return repondre("Please use 'yes' or 'no' only");
  }

  await repondre(responseMessage);
});
