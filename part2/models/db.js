const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'DogWalkService',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

// async function getUserByUsernameAndPassword(username, password) {
//   const [rows] = await pool.query(
//     'SELECT * FROM Users WHERE username = ? AND password_hash = ?', [username, password]
//   );
//   return rows[0];
// }

// module.exports = {
//   getUserByUsernameAndPassword,
//   pool
// };

