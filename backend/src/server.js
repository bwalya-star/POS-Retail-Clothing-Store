require("dotenv").config();

const createApp = require("./app");
const { getConnection } = require("./db/connection");

const PORT = process.env.PORT || 4000;

const db = getConnection();
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`POS backend listening on http://localhost:${PORT}`);
});
