<div align="center">

# TaskFlow

### A calmer way to move good work forward.

Plan projects, keep tasks visible, and make the next step clear.

![React](https://img.shields.io/badge/React-UI-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-typed-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-styling-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)

</div>

---

## What is TaskFlow?

TaskFlow is a responsive project management and task tracking app for turning a busy list of work into clear, manageable next steps. See progress at a glance, organize tasks by project, and keep priorities, owners, and deadlines together.

## What you can do

- **Track progress:** A dashboard summarizes all tasks, completed work, active work, and items to do.
- **Move work forward:** Organize tasks on a Kanban board with **To do**, **In progress**, and **Done** columns. Drag cards between columns or change status from a task.
- **Organize projects:** Create projects and see their task counts and completion progress.
- **Keep task details together:** Add a project, description, priority, deadline, and assignee to each task. Edit task details later.
- **Make it yours:** Update your profile name and email, and switch between light and dark themes.
- **Pick up where you left off:** Projects, tasks, profile settings, and theme are saved in your browser.

## Technology

| Technology | What it does |
| --- | --- |
| React | Builds the interactive interface |
| TypeScript | Adds types to application data and behavior |
| Vite | Runs the development preview and creates production builds |
| Tailwind CSS | Styles the responsive interface and themes |
| Lucide React | Provides interface icons |
| Radix UI and shadcn-style components | Provide accessible dialogs, forms, menus, and controls |
| React Hook Form and Zod | Handle form state and validation |
| Wouter | Handles page navigation |
| Browser `localStorage` | Keeps TaskFlow data on the current device |
| pnpm workspaces | Manage the project packages |

## Run TaskFlow locally

### Requirements

- Node.js 24 or newer
- pnpm

### Start the app

From the project root:

```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/taskflow run dev
```

Then open [http://localhost:5173](http://localhost:5173).

To check the TaskFlow TypeScript files:

```bash
pnpm --filter @workspace/taskflow run typecheck
```

## Data and privacy

TaskFlow currently stores its sample and user-created workspace data in the browser's `localStorage`. That means data stays in that browser on that device; it does not sync to other devices or other people's accounts. Clearing the browser's site data can remove the saved workspace.

The profile page edits the name and email shown in the app. It is not an account sign-in system.

## Repository layout

```text
artifacts/
  taskflow/       TaskFlow web application
  api-server/     Shared API server package
  mockup-sandbox/ Component preview and design workspace
lib/              Shared API, database, and validation packages
scripts/          Workspace utility scripts
```

TaskFlow's current features run in the browser and do not require the shared API server or database.

---

<div align="center">
Built for clear priorities, thoughtful progress, and work that feels manageable.
</div>
