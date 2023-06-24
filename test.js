import "dotenv/config"
import DB from "./db.js"
import Task from './task.js'
console.clear();
// DB.resetDB();
// console.log(DB.getAllTasks());
// DB.saveTask("Learn NodeJs")
// DB.deleteTaske(1)

const task1= new Task("saman", false)
console.log(task1);
task1.title="samannnnnnnnn222222222"
task1.save();
task1.title= "sam"
task1.save();


// console.log(Task.getAllTasks());