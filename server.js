import app from "./src/app.js";
import dotenv from "dotenv";
import { testDatabase } from "./src/utils/test-db.js";

dotenv.config();

testDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ShopDesk API running on port ${PORT}`);
});
