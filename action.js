import fs from 'fs'

import chalk from 'chalk'
import inquirer from 'inquirer'
import axios from 'axios'
import { parse, stringify } from 'csv/sync'

import DB from './db.js'
import Task from './task.js'

const error= chalk.redBright.bold
const warn= chalk.yellowBright.bold
const success= chalk.greenBright.bold

export default class Action {
    static list() {
        const tasks= Task.getAllTasks(true);
        if(tasks.length) {
            console.table(tasks);
        }else {
            console.log(warn("There is no task."));
        }
    }
    
    static async add() {
        const answers= await inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: `Enter the title of your new task`,
                validate: (value)=>{
                    if(value.length < 3) {
                        return "The title must be at least 3 charachtar"
                    }
                    return true
                }
            },
            {
                type: "confitm",
                name: "completed",
                message: 'Is this a completed task?',
                default: false,
            }
        ])

        try {
            const task= new Task(answers.title, answers.completed);
            task.save();
            console.log(success("New Task saved successfully."));
        } catch (err) {
            console.log(error(err.message));
        }
    }
    
    static async delete() {
        const tasks= Task.getAllTasks(true);
        const choices= [];

        for(let task of tasks) {
            choices.push(task.title);
        }

        const answer= await inquirer.prompt({
            type: "list",
            name: "title",
            message: "Select a task to delete",
            choices
        })

        const task= Task.getTaskByTitle(answer.title);
        try {
            DB.deleteTask(task.id)
            console.log(success("Task deleted successfully"));
        } catch (err) {
            console.log(error(err.message));
        }
    }
    
    static async deleteAll() {
        const answer= await inquirer.prompt({
            type: "confirm",
            name: "confirmed",
            message: "Are you sure to delete all tasks?",
            default: false
        })

        if(answer.confirmed) {
            try {
                DB.resetDB();
                console.log(success("All Tasks Deleted Successfully"))
            }catch(err) {
                console.log(error(err.message));
            }
        }
    }
    
    static async edit() {
        const tasks= Task.getAllTasks(true);
        const choices= [];

        for(let task of tasks) {
            choices.push(task.title);
        }

        const selecedTask= await inquirer.prompt({
            type: "list",
            name: "title",
            message: "Select task to edit",
            choices
        })
        const task= Task.getTaskByTitle(selecedTask.title);
        const answer= await inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: "Enter task title",
                validate: (value)=>{
                    if(value.length < 3) {
                        return "The title must be at least 3 charachtar"
                    }
                    return true
                },
                default: task.title
            },
            {
                type: "confirm",
                name: "completed",
                default: false
            }
        ])
        try {
            DB.saveTask(answer.title, answer.completed, task.id)
            console.log(success("Selected Task editted successfully"));
        } catch (err) {
            console.log(error(err.message));
        }
    }
    
    static async export() {
        const answer= await inquirer.prompt({
            type: "input",
            name: "filename",
            message: "Enter output filename",
            validate: (value)=> {
                if(!(/^[\w .-]{1,50}$/ .test(value))) {
                    return "Please enter a valid filename"
                }
                return true
            }
        })

        const tasks= Task.getAllTasks(true)
        const output= stringify(tasks, {
            header: true,
            cast: {
                boolean: (value, context)=> {
                    return String(value)
                }
            }
        })

        try {
            fs.writeFileSync(answer.filename, output)
        } catch (err) {
            console.log(error("Can not write to "+ answer.filename));
        }

    }
    
    static async import() {
        const answer= await inquirer.prompt({
            type: "input",
            name: "filename",
            message: "Enter input file: "            
        })
        if(fs.readFileSync(answer.filename)) {
            try {
                const input= fs.readFileSync(answer.filename)
                const data= parse(input, {
                    columns: true,
                    cast: (value, context)=> {
                        if(context.column === "id") {
                            return Number(value)
                        }else if(context.column === "compeleted") {
                            return value.toLowerCase() === "true" ? true : false;
                        }
                        return value
                    }
                })
                DB.insertBulkData(data);
                console.log(success("Data imported successfully"));
            } catch (err) {
                console.log(error(err.message));
            }
        }else {
            console.log(error("That file you entered is not found"));
        }
    }
    
    static async download() {
        const baseURL= process.env.BASE_URL
        const answer= await inquirer.prompt({
            type: "input",
            name: "filename",
            message: "Enter filename to download",            
        })
        const config= {
            baseURL: baseURL,
            url: answer.filename
        }
        console.log(config);
        try {
            const response= await axios(config);
            console.log(response);
            console.log(response.data);
            const data= parse(response.data, {
                columns: true,
                cast: (value, context)=> {
                    if(context.column === "id") {
                        return Number(value)
                    }else if(context.column === "compeleted") {
                        return value.toLowerCase() === "true" ? true : false;
                    }
                    return value
                }
            })
            DB.insertBulkData(data);
            console.log(success("Data downloaded and imported successfully"));
        } catch (err) {
            console.log(error(err.message));
        }
    }

}