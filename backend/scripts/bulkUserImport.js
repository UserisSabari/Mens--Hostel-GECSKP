require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');

// Adjust the path to your User model as needed
const User = require(path.join(__dirname, '../src/models/User'));

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// 2. Setup nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 3. Helper to generate strong password
function generatePassword(length = 12) {
  return [...Array(length)].map(() => (Math.random()*36|0).toString(36)).join('');
}

// 4. Main function
async function importUsersFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  let created = 0, skipped = 0, errors = [];

  for (const row of rows) {
    // Handle name construction
    // let baseName = '';
    // if (row.name) {
    //   baseName = row.name.replace(/\s+/g, '_');
    // } else if (row['first name']) {
    //   const firstName = (row['first name'] || '').trim();
    //   const lastName = (row['last name'] || '').trim();
    //   baseName = firstName;
    //   if (lastName) {
    //     baseName += `_${lastName}`;
    //   }
    //   baseName = baseName.replace(/\s+/g, '_');
    // } else {
    //   baseName = 'unknown';
    // }
    // const name= `${baseName}_${row['year of study']}`;
    const name = `${row.name.replace(/\s+/g, '_')}_${row['year of study']}`;
    const email = row.email;
    const password = generatePassword().trim();
    // Create user with plain password - pre-save hook will hash it
    const user = new User({ name, email, password, role: 'student' });

    // Check for existing user
    const exists = await User.findOne({ email });
    if (exists) {
      skipped++;
      continue;
    }

    try {
      await user.save();

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Hostel Mess App Account',
        text: `Hello ${name},\n\nYour mess account has been created.\nUsername: ${name}\nEmail: ${email}\nPassword: ${password}\n\nPlease log in at https://mens-hostel-gecskp.vercel.app/ using the above credentials.\n`,
      });

      created++;
    } catch (err) {
      errors.push({ email, error: err.message });
    }
  }

  console.log(`Created: ${created}, Skipped (existing): ${skipped}, Errors: ${errors.length}`);
  if (errors.length) console.log(errors);

  mongoose.disconnect();
}

// 5. Run the script
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/bulkUserImport.js <path-to-excel-file>');
  process.exit(1);
}
importUsersFromExcel(filePath); 