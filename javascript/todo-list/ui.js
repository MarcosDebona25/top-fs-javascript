import { Todo } from './code.js';

export class UI {
    constructor(store) {
        this.store = store;

        this.projectsList = document.getElementById('projects-list');
        this.todoList = document.getElementById('todo-list');
        this.currentProjectTitle = document.getElementById('current-project-title');

        this.addTodoBtn = document.getElementById('add-todo-btn');
        this.todoModal = document.getElementById('todo-modal');
        this.todoForm = document.getElementById('todo-form');
        this.closeModalBtn = document.getElementById('close-modal-btn');

        this.todoTitleInput = document.getElementById('todo-title');
        this.todoDescInput = document.getElementById('todo-desc');
        this.todoDateInput = document.getElementById('todo-date');

        this.init();
    }

    init() {
        this.renderProjects();
        this.renderTodos();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addTodoBtn.addEventListener('click', () => {
            this.todoForm.reset();
            this.todoModal.showModal();
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.todoModal.close();
        });

        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTodo();
        });
    }

    renderProjects() {
        this.projectsList.innerHTML = '';
        this.store.projects.forEach((project, index) => {
            const li = document.createElement('li');
            li.textContent = project.title;
            li.classList.add('project-item');

            if (index === this.store.activeProjectIndex) {
                li.classList.add('active');
            }

            li.addEventListener('click', () => {
                this.store.setActiveProject(index);
                this.renderProjects();
                this.renderTodos();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.title = "Delete Project";
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this project?")) {
                    this.store.removeProject(index);
                    this.renderProjects();
                    this.renderTodos();
                }
            });

            li.appendChild(deleteBtn);

            this.projectsList.appendChild(li);
        });
    }

    renderTodos() {
        const activeProject = this.store.getActiveProject();
        this.currentProjectTitle.textContent = activeProject ? activeProject.title : 'No Project Selected';
        this.todoList.innerHTML = '';

        if (!activeProject) return;

        activeProject.todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.classList.add('todo-item');
            if (todo.done) li.classList.add('done');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.done;
            checkbox.addEventListener('change', (e) => {
                todo.setDone(e.target.checked);
                this.renderTodos();
            });

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('todo-content');

            const titleP = document.createElement('p');
            titleP.classList.add('todo-title');
            titleP.textContent = todo.title;
            contentDiv.appendChild(titleP);

            if (todo.description) {
                const descP = document.createElement('p');
                descP.classList.add('todo-desc');
                descP.textContent = todo.description;
                contentDiv.appendChild(descP);
            }

            if (todo.dueDate) {
                let dateStr = todo.dueDate instanceof Date
                    ? todo.dueDate.toLocaleDateString()
                    : new Date(todo.dueDate).toLocaleDateString();

                if (dateStr !== 'Invalid Date') {
                    const dateP = document.createElement('p');
                    dateP.classList.add('todo-date');
                    dateP.textContent = dateStr;
                    contentDiv.appendChild(dateP);
                }
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&#10006';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.title = "Delete Todo";
            deleteBtn.addEventListener('click', () => {
                activeProject.removeTodo(index);
                this.renderTodos();
            });

            li.appendChild(checkbox);
            li.appendChild(contentDiv);
            li.appendChild(deleteBtn);

            this.todoList.appendChild(li);
        });
    }

    handleAddTodo() {
        const title = this.todoTitleInput.value;
        const desc = this.todoDescInput.value;
        const dateStr = this.todoDateInput.value;

        if (!title.trim()) return;

        let dateObj = null;
        if (dateStr) {
            const [year, month, day] = dateStr.split('-');
            if (year && month && day) {
                dateObj = new Date(year, month - 1, day);
            }
        }

        const newTodo = new Todo(title, desc, dateObj);
        const activeProject = this.store.getActiveProject();
        if (activeProject) {
            activeProject.addTodo(newTodo);
            this.renderTodos();
        }

        this.todoModal.close();
    }
}
