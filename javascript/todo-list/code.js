import { UI } from './ui.js';

export class Project {
    constructor(title) {
        this.title = title;
        this.todos = [];
    }

    setTodo(...todo) {
        this.todos = todo;
    }

    addTodo(todo) {
        this.todos.push(todo);
    }

    removeTodo(index) {
        this.todos.splice(index, 1);
    }
}

export class Todo {
    constructor(title, description, dueDate) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.done = false;
    }

    setDone(done) {
        this.done = done;
    }
}

export class Store {
    constructor() {
        this.projects = [];
        this.activeProjectIndex = 0;
    }

    addProject(project) {
        this.projects.push(project);
    }

    getActiveProject() {
        return this.projects[this.activeProjectIndex];
    }

    setActiveProject(index) {
        this.activeProjectIndex = index;
    }

    removeProject(index) {
        this.projects.splice(index, 1);
        if (this.activeProjectIndex >= this.projects.length) {
            this.activeProjectIndex = Math.max(0, this.projects.length - 1);
        }
        else if (index < this.activeProjectIndex) {
            this.activeProjectIndex--;
        }
    }
}

function initApp() {
    let defaultProject = new Project("Default");
    let todo1 = new Todo("Get updated with movie news", "Check DiscussingFilm on X", new Date());
    let todo2 = new Todo("Learn JavaScript", "Complete the DOM module", new Date(2024, 11, 15));
    let todo3 = new Todo("Build a project", "Create a todo app with classes", new Date(2024, 11, 20));
    let todo4 = new Todo("Review code", "Check pull requests", new Date(2024, 11, 10));

    defaultProject.setTodo(todo1, todo2, todo3, todo4);

    let workProject = new Project("Work");
    workProject.addTodo(new Todo("Daily Standup", "Zoom meeting at 10 AM", new Date()));

    const store = new Store();
    store.addProject(defaultProject);
    store.addProject(workProject);

    const ui = new UI(store);
}

document.addEventListener('DOMContentLoaded', initApp);