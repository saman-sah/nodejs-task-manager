import "dotenv/config"
import DB from "./db.js"
console.clear();
// DB.resetDB();
// console.log(DB.getAllTasks());
DB.saveTask("Learn NodeJs")
// DB.deleteTaske(1)