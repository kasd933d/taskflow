import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, Route, Switch as RouteSwitch, useLocation, Router as WouterRouter } from 'wouter';
import {
  Activity, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2,
  ChevronDown, Circle, CircleDot, Clock3, Command, FolderKanban, LayoutDashboard, ListTodo,
  Menu, Moon, MoreHorizontal, Plus, Search, Settings2, Sun, Target,
} from 'lucide-react';

type Status = 'todo' | 'in-progress' | 'done';
type Priority = 'high' | 'medium' | 'low';
type Project = { id: string; name: string; description: string; color: string };
type Task = { id: string; projectId: string; title: string; description: string; status: Status; priority: Priority; deadline: string; assignee: string };
type Profile = { name: string; email: string };
type Store = { projects: Project[]; tasks: Task[]; profile: Profile; theme: 'light' | 'dark' };

const KEY = 'taskflow-workspace-v1';
const dateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const seed: Store = {
  projects: [
    { id: 'p1', name: 'Website refresh', description: 'A clearer, faster home for the brand.', color: '#2f8067' },
    { id: 'p2', name: 'Spring campaign', description: 'Make the next launch feel unmistakable.', color: '#d28a4e' },
    { id: 'p3', name: 'Product foundation', description: 'Small improvements that add up.', color: '#7187b5' },
  ],
  tasks: [
    { id: 't1', projectId: 'p1', title: 'Approve the new homepage direction', description: 'Review the latest type and layout explorations.', status: 'in-progress', priority: 'high', deadline: dateFromToday(3), assignee: 'Maya Chen' },
    { id: 't2', projectId: 'p2', title: 'Write launch email sequence', description: 'Three concise emails for the early access list.', status: 'todo', priority: 'medium', deadline: dateFromToday(5), assignee: 'You' },
    { id: 't3', projectId: 'p3', title: 'Map first-run experience', description: 'Capture the moments that need to feel effortless.', status: 'done', priority: 'low', deadline: dateFromToday(-1), assignee: 'Jon Bell' },
    { id: 't4', projectId: 'p1', title: 'Collect customer quotes', description: 'Pull fresh stories from recent interviews.', status: 'todo', priority: 'low', deadline: dateFromToday(7), assignee: 'Maya Chen' },
    { id: 't5', projectId: 'p2', title: 'Build campaign landing page', description: 'Bring the creative direction into a responsive page.', status: 'in-progress', priority: 'high', deadline: dateFromToday(2), assignee: 'You' },
    { id: 't6', projectId: 'p3', title: 'Triage onboarding feedback', description: 'Sort the first wave of product notes.', status: 'done', priority: 'medium', deadline: dateFromToday(-3), assignee: 'Jon Bell' },
    { id: 't7', projectId: 'p1', title: 'Polish mobile navigation', description: 'Make the menu feel calmer on small screens.', status: 'todo', priority: 'medium', deadline: dateFromToday(9), assignee: 'You' },
  ],
  profile: { name: 'Alex Morgan', email: 'alex@taskflow.team' },
  theme: 'light',
};

const taskSchema = z.object({
  title: z.string().trim().min(3, 'Give this task a little more detail.').max(90, 'Keep the title under 90 characters.'),
  description: z.string().max(240).default(''),
  projectId: z.string().min(1, 'Choose a project.'),
  priority: z.enum(['high', 'medium', 'low']),
  deadline: z.string().min(1, 'Choose a due date.'),
  assignee: z.string().trim().min(1, 'Add an owner.'),
  status: z.enum(['todo', 'in-progress', 'done']),
});
type TaskForm = z.infer<typeof taskSchema>;
const projectSchema = z.object({ name: z.string().trim().min(2, 'Project name is required.').max(48), description: z.string().max(160).default('') });
type ProjectForm = z.infer<typeof projectSchema>;
const profileSchema = z.object({ name: z.string().trim().min(2, 'Enter your name.'), email: z.string().email('Enter a valid email address.') });
type ProfileForm = z.infer<typeof profileSchema>;

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/board', label: 'Board', icon: CircleDot },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];
const statusLabels: Record<Status, string> = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' };
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

function useWorkspace() {
  const [data, setData] = useState<Store>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...seed, ...JSON.parse(saved) } : seed;
    } catch { return seed; }
  });
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
    document.documentElement.classList.toggle('dark', data.theme === 'dark');
  }, [data]);
  const update = (patch: Partial<Store>) => setData((current) => ({ ...current, ...patch }));
  const setTask = (task: Task) => setData((s) => ({ ...s, tasks: s.tasks.some((item) => item.id === task.id) ? s.tasks.map((item) => item.id === task.id ? task : item) : [task, ...s.tasks] }));
  return { data, update, setTask };
}

const queryClient = new QueryClient();
function App() {
  const workspace = useWorkspace();
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Workspace {...workspace} /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

function Workspace({ data, update, setTask }: ReturnType<typeof useWorkspace>) {
  const [location, setLocation] = useLocation();
  const [taskOpen, setTaskOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const openTask = (task?: Task) => { setEditTask(task ?? null); setTaskOpen(true); };
  const closeTask = (open: boolean) => { setTaskOpen(open); if (!open) setEditTask(null); };
  const filteredTasks = useMemo(() => data.tasks.filter((task) => (projectFilter === 'all' || task.projectId === projectFilter) && `${task.title} ${task.assignee}`.toLowerCase().includes(searchText.toLowerCase())), [data.tasks, projectFilter, searchText]);
  return (
    <div className="min-h-[100dvh] bg-background text-foreground transition-colors duration-300">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform md:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/" className="mb-9 flex items-center gap-3 px-2" data-testid="link-taskflow-home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Command size={18} strokeWidth={2.3} /></span>
          <span className="font-display text-[19px] font-extrabold tracking-[-.06em]">taskflow<span className="text-primary">.</span></span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Workspace</div>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileNav(false)} data-testid={`link-nav-${label.toLowerCase()}`} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${location === href ? 'bg-primary text-primary-foreground shadow-sm' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Icon size={17} /><span>{label}</span>{label === 'Board' && <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${location === href ? 'bg-white/15' : 'bg-sidebar-accent'}`}>{data.tasks.filter(t => t.status !== 'done').length}</span>}</Link>)}
        </nav>
        <div className="mb-3 mt-9 flex items-center justify-between px-3"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Projects</span><button onClick={() => setProjectOpen(true)} className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" aria-label="Create project" data-testid="button-add-project-sidebar"><Plus size={15} /></button></div>
        <div className="space-y-1">{data.projects.map(project => <button key={project.id} onClick={() => { setProjectFilter(project.id); setLocation('/projects'); }} data-testid={`button-project-${project.id}`} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent"><span className="size-2 rounded-full" style={{ backgroundColor: project.color }} /><span className="truncate">{project.name}</span><span className="ml-auto text-[10px] text-muted-foreground">{data.tasks.filter(t => t.projectId === project.id && t.status !== 'done').length}</span></button>)}</div>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3.5">
          <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-semibold">Weekly momentum</span><Activity size={14} className="text-primary" /></div>
          <div className="flex items-end gap-1.5">{[30, 48, 38, 66, 52, 83, 62, 96, 72, 57, 85, 70].map((height, i) => <span key={i} className={`h-8 flex-1 rounded-sm ${i === 7 ? 'bg-primary' : 'bg-primary/25'}`} style={{ height: `${height}%` }} />)}</div>
          <p className="mt-2 text-[10px] text-muted-foreground">A little progress, every day.</p>
        </div>
        <button onClick={() => update({ theme: data.theme === 'light' ? 'dark' : 'light' })} className="mt-4 flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent" data-testid="button-theme-sidebar"><span className="flex items-center gap-2">{data.theme === 'light' ? <Moon size={15} /> : <Sun size={15} />} {data.theme === 'light' ? 'Switch to dark' : 'Switch to light'}</span><ChevronDown size={14} /></button>
        <Link href="/settings" className="mt-2 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4" data-testid="link-user-profile">
          <span className="grid size-9 place-items-center rounded-full bg-[#e3c6a8] text-[11px] font-bold text-[#493b31]">{initials(data.profile.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{data.profile.name}</span><span className="block truncate text-[10px] text-muted-foreground">Personal workspace</span></span><MoreHorizontal size={16} className="text-muted-foreground" />
        </Link>
      </aside>
      {mobileNav && <button className="fixed inset-0 z-30 bg-black/30 md:hidden" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
      <div className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-muted md:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={19} /></button><div className="hidden text-xs text-muted-foreground sm:block">Workspace <span className="mx-1.5">/</span> <span className="font-semibold text-foreground">{navItems.find(item => item.href === location)?.label ?? 'Workspace'}</span></div></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="relative hidden sm:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Find a task..." className="h-9 w-[190px] rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60" data-testid="input-search-tasks" /></label>
            <Button onClick={() => openTask()} size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-xs font-bold" data-testid="button-create-task"><Plus size={15} /> <span className="hidden xs:inline">New task</span></Button>
          </div>
        </header>
        <main className="page-enter mx-auto max-w-[1440px] px-4 pb-12 pt-7 sm:px-7 lg:px-10">
          <RouteSwitch>
            <Route path="/"><Dashboard data={data} filteredTasks={filteredTasks} onCreate={() => openTask()} onEdit={openTask} /></Route>
            <Route path="/board"><Board data={data} tasks={filteredTasks} setTask={setTask} onCreate={() => openTask()} onEdit={openTask} filter={projectFilter} setFilter={setProjectFilter} /></Route>
            <Route path="/projects"><Projects data={data} tasks={filteredTasks} filter={projectFilter} setFilter={setProjectFilter} openProject={() => setProjectOpen(true)} onCreateTask={() => openTask()} /></Route>
            <Route path="/settings"><Settings data={data} update={update} /></Route>
            <Route><NotFound /></Route>
          </RouteSwitch>
        </main>
      </div>
      <TaskDialog open={taskOpen} onOpenChange={closeTask} task={editTask} projects={data.projects} onSave={setTask} />
      <ProjectDialog open={projectOpen} onOpenChange={setProjectOpen} onSave={project => update({ projects: [...data.projects, project] })} />
    </div>
  );
}

function Heading({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-primary"><span className="size-1.5 rounded-full bg-primary" />{eyebrow}</div><h1 className="font-display text-[30px] font-extrabold leading-tight tracking-[-.055em] sm:text-[36px]">{title}</h1><p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{description}</p></div>{action}</div>;
}

function Dashboard({ data, filteredTasks, onCreate, onEdit }: { data: Store; filteredTasks: Task[]; onCreate: () => void; onEdit: (task: Task) => void }) {
  const total = data.tasks.length, done = data.tasks.filter(t => t.status === 'done').length, doing = data.tasks.filter(t => t.status === 'in-progress').length, todo = total - done - doing;
  const upcoming = [...filteredTasks].filter(t => t.status !== 'done').sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4);
  return <div className="space-y-8">
    <Heading eyebrow={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())} title={<>Good morning, {data.profile.name.split(' ')[0]}<span className="text-primary">.</span></>} description="A clear view of what’s moving, and what could use a little nudge." action={<Button onClick={onCreate} variant="outline" className="h-10 gap-2 rounded-xl bg-card px-4 text-xs font-bold shadow-sm" data-testid="button-dashboard-new-task"><Plus size={15} /> Add a task</Button>} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Task totals">
      <Metric label="All tasks" value={total} note="Across your workspace" icon={ListTodo} color="mint" testId="metric-total" />
      <Metric label="Completed" value={done} note={`${total ? Math.round(done / total * 100) : 0}% of all tasks`} icon={CheckCircle2} color="blue" testId="metric-completed" />
      <Metric label="In progress" value={doing} note="Moving forward now" icon={Activity} color="orange" testId="metric-progress" />
      <Metric label="To do" value={todo} note="Ready when you are" icon={Clock3} color="lilac" testId="metric-pending" />
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_32px_-24px_rgba(42,51,45,.3)] sm:p-6">
        <div className="mb-6 flex items-start justify-between"><div><h2 className="font-display text-[16px] font-extrabold tracking-tight">Project momentum</h2><p className="mt-1 text-xs text-muted-foreground">The work taking shape across your workspace.</p></div><Link href="/projects" className="flex items-center gap-1 text-[11px] font-bold text-primary hover:gap-2 transition-all" data-testid="link-all-projects">All projects <ArrowRight size={13} /></Link></div>
        <div className="space-y-5">{data.projects.map(project => {
          const tasks = data.tasks.filter(t => t.projectId === project.id), complete = tasks.filter(t => t.status === 'done').length, percent = tasks.length ? Math.round(complete / tasks.length * 100) : 0;
          return <Link href="/projects" key={project.id} className="group block w-full text-left" data-testid={`project-momentum-${project.id}`}><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="size-2.5 rounded-[4px]" style={{ background: project.color }} /><span className="text-[13px] font-bold">{project.name}</span></div><span className="text-[11px] tabular-nums text-muted-foreground">{complete}/{tasks.length} complete</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: project.color }} /></div><p className="mt-1.5 text-[10px] text-muted-foreground">{project.description}</p></Link>;
        })}</div>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-[#244c43] p-5 text-[#f4f2e9] shadow-sm sm:p-6">
        <div className="absolute -right-7 -top-12 size-44 rounded-full border border-white/10" /><div className="absolute -right-1 -top-6 size-32 rounded-full border border-white/10" />
        <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em]">This week</span><Target size={18} className="text-[#a9d7bd]" /></div><p className="mt-7 font-display text-[35px] font-extrabold tracking-[-.07em]">{done}<span className="ml-2 text-[13px] font-medium tracking-normal text-white/65">tasks finished</span></p><div className="mt-3 h-px bg-white/15" /><div className="mt-4 flex items-center justify-between"><div><p className="text-[11px] text-white/65">Keep the rhythm</p><p className="mt-1 text-sm font-semibold">{doing} things are in motion</p></div><span className="grid size-10 place-items-center rounded-full bg-[#a9d7bd] text-[#244c43]"><ArrowUpRight size={18} /></span></div></div>
      </div>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_32px_-24px_rgba(42,51,45,.3)] sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[16px] font-extrabold tracking-tight">Coming up next</h2><p className="mt-1 text-xs text-muted-foreground">A few things worth keeping in view.</p></div><Link href="/board" className="text-[11px] font-bold text-primary" data-testid="link-view-board">Open board <ArrowRight size={12} className="ml-1 inline" /></Link></div>
        {upcoming.length ? <div className="divide-y divide-border/70">{upcoming.map(task => <TaskRow key={task.id} task={task} project={data.projects.find(p => p.id === task.projectId)} onClick={() => onEdit(task)} />)}</div> : <EmptyState title="Nothing on deck" text="Create a task to give your next work session a head start." onAction={onCreate} />}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_32px_-24px_rgba(42,51,45,.3)] sm:p-6">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-[16px] font-extrabold tracking-tight">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">Small wins add up.</p></div><span className="grid size-8 place-items-center rounded-lg bg-accent text-primary"><Activity size={15} /></span></div>
        <div className="space-y-5">{data.tasks.filter(t => t.status === 'done').slice(0, 3).map(task => <div key={task.id} className="flex gap-3" data-testid={`activity-item-${task.id}`}><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-primary"><Check size={13} /></span><div className="min-w-0"><p className="text-xs font-semibold leading-snug">{task.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{task.assignee} · {data.projects.find(p => p.id === task.projectId)?.name}</p></div></div>)}</div>
        <div className="mt-6 rounded-xl bg-muted/70 p-3.5"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">A gentle reminder</p><p className="mt-1.5 text-xs leading-relaxed">Progress isn't always a straight line. Keep making the next right move.</p></div>
      </div>
    </section>
  </div>;
}

function Metric({ label, value, note, icon: Icon, color, testId }: { label: string; value: number; note: string; icon: typeof ListTodo; color: string; testId: string }) {
  const colors: Record<string, string> = { mint: 'bg-[#dcebe4] text-[#2f8067] dark:bg-[#26483d] dark:text-[#a9d7bd]', blue: 'bg-[#e1e8f2] text-[#607ba4] dark:bg-[#303e53] dark:text-[#b1c4e2]', orange: 'bg-[#f5e7d9] text-[#b97135] dark:bg-[#4a392b] dark:text-[#e6b483]', lilac: 'bg-[#ece5f1] text-[#866998] dark:bg-[#403449] dark:text-[#c9afd9]' };
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_26px_-24px_rgba(42,51,45,.3)] sm:p-5" data-testid={testId}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span><span className={`grid size-8 place-items-center rounded-lg ${colors[color]}`}><Icon size={16} /></span></div><div className="mt-4 flex items-end justify-between"><span className="font-display text-[31px] font-extrabold leading-none tracking-[-.06em] tabular-nums">{value.toString().padStart(2, '0')}</span><span className="text-[10px] text-muted-foreground">{note}</span></div></div>;
}

function TaskRow({ task, project, onClick }: { task: Task; project?: Project; onClick: () => void }) {
  const due = new Date(`${task.deadline}T12:00:00`);
  const late = due < new Date(new Date().toDateString()) && task.status !== 'done';
  return <button onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40" data-testid={`task-row-${task.id}`}><span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${project?.color ?? '#777'}18`, color: project?.color }}><Circle size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{task.title}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{project?.name} · {task.assignee}</span></span><span className={`hidden items-center gap-1 text-[10px] sm:flex ${late ? 'text-destructive' : 'text-muted-foreground'}`}><CalendarDays size={12} />{dateLabel(task.deadline)}</span><PriorityTag priority={task.priority} /></button>;
}

function PriorityTag({ priority }: { priority: Priority }) {
  const style = priority === 'high' ? 'bg-[#f7e4df] text-[#b85f4e] dark:bg-[#4a302e] dark:text-[#efa497]' : priority === 'medium' ? 'bg-[#f4ead7] text-[#a47531] dark:bg-[#483b28] dark:text-[#e4c17d]' : 'bg-muted text-muted-foreground';
  return <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold capitalize ${style}`}>{priority}</span>;
}

function Board({ data, tasks, setTask, onCreate, onEdit, filter, setFilter }: { data: Store; tasks: Task[]; setTask: (task: Task) => void; onCreate: () => void; onEdit: (task: Task) => void; filter: string; setFilter: (id: string) => void }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const columns: { status: Status; label: string; icon: typeof Circle; tint: string }[] = [
    { status: 'todo', label: 'To do', icon: Circle, tint: 'bg-[#d28a4e]' },
    { status: 'in-progress', label: 'In progress', icon: CircleDot, tint: 'bg-[#6f88b6]' },
    { status: 'done', label: 'Done', icon: CheckCircle2, tint: 'bg-primary' },
  ];
  return <div><Heading eyebrow="Make the work visible" title="Project board" description="Move work forward at your own pace. Every small step counts." action={<Button onClick={onCreate} className="h-10 gap-2 rounded-xl px-4 text-xs font-bold" data-testid="button-board-add-task"><Plus size={15} /> New task</Button>} />
    <div className="mb-5 flex flex-wrap items-center gap-2"><Select value={filter} onValueChange={setFilter}><SelectTrigger className="h-9 w-[190px] rounded-lg bg-card text-xs" data-testid="select-board-project"><SelectValue placeholder="All projects" /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{data.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><span className="text-[11px] text-muted-foreground">{tasks.length} tasks in view</span></div>
    <div className="grid items-start gap-4 lg:grid-cols-3">{columns.map(column => {
      const Icon = column.icon, columnTasks = tasks.filter(task => task.status === column.status);
      return <section key={column.status} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const task = data.tasks.find(item => item.id === dragging); if (task) setTask({ ...task, status: column.status }); setDragging(null); }} className={`min-h-[430px] rounded-2xl border border-border bg-muted/45 p-3 transition-colors ${dragging ? 'hover:bg-accent/50' : ''}`} data-testid={`board-column-${column.status}`}>
        <div className="mb-3 flex items-center justify-between px-1 py-1"><div className="flex items-center gap-2"><span className={`grid size-6 place-items-center rounded-md text-white ${column.tint}`}><Icon size={13} /></span><h2 className="text-xs font-bold">{column.label}</h2><span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-muted-foreground">{columnTasks.length}</span></div><button onClick={onCreate} aria-label={`Add task to ${column.label}`} className="rounded-md p-1 text-muted-foreground hover:bg-card" data-testid={`button-add-${column.status}`}><Plus size={15} /></button></div>
        <div className="space-y-2.5">{columnTasks.map(task => <TaskCard key={task.id} task={task} project={data.projects.find(p => p.id === task.projectId)} onEdit={() => onEdit(task)} onDragStart={() => setDragging(task.id)} setStatus={status => setTask({ ...task, status })} />)}
        {!columnTasks.length && <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-border bg-background/50 px-5 text-center"><div><span className="mx-auto grid size-8 place-items-center rounded-lg bg-card text-muted-foreground"><Icon size={15} /></span><p className="mt-2 text-[11px] font-semibold text-muted-foreground">Nothing here just yet</p><p className="mt-1 text-[10px] text-muted-foreground">Drop a task here or add one.</p></div></div>}</div>
      </section>;
    })}</div>
  </div>;
}
function TaskCard({ task, project, onEdit, onDragStart, setStatus }: { task: Task; project?: Project; onEdit: () => void; onDragStart: () => void; setStatus: (status: Status) => void }) {
  return <article draggable onDragStart={onDragStart} className="group rounded-xl border border-border bg-card p-3.5 shadow-[0_6px_18px_-16px_rgba(33,42,36,.5)] transition-all hover:-translate-y-0.5 hover:shadow-md" data-testid={`task-card-${task.id}`}>
    <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground"><span className="size-1.5 rounded-full" style={{ background: project?.color }} />{project?.name}</span><button onClick={onEdit} className="rounded p-1 text-muted-foreground opacity-60 hover:bg-muted hover:opacity-100" aria-label={`Edit ${task.title}`} data-testid={`button-edit-task-${task.id}`}><MoreHorizontal size={15} /></button></div>
    <button className="block w-full text-left" onClick={onEdit} data-testid={`button-open-task-${task.id}`}><h3 className="text-[12px] font-bold leading-snug">{task.title}</h3>{task.description && <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{task.description}</p>}</button>
    <div className="mt-3 flex items-center justify-between"><PriorityTag priority={task.priority} /><span className="flex items-center gap-1 text-[9px] text-muted-foreground"><CalendarDays size={11} />{dateLabel(task.deadline)}</span></div>
    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5"><span className="flex items-center gap-1.5"><span className="grid size-5 place-items-center rounded-full bg-secondary text-[8px] font-bold">{initials(task.assignee)}</span><span className="max-w-[90px] truncate text-[9px] text-muted-foreground">{task.assignee}</span></span><Select value={task.status} onValueChange={value => setStatus(value as Status)}><SelectTrigger className="h-7 w-[112px] border-0 bg-muted/70 px-2 text-[9px]" aria-label="Change task status" data-testid={`select-status-${task.id}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todo">To do</SelectItem><SelectItem value="in-progress">In progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select></div>
  </article>;
}

function Projects({ data, tasks, filter, setFilter, openProject, onCreateTask }: { data: Store; tasks: Task[]; filter: string; setFilter: (id: string) => void; openProject: () => void; onCreateTask: () => void }) {
  const visible = data.projects.filter(project => filter === 'all' || project.id === filter);
  return <div><Heading eyebrow="Your work, in context" title="Projects" description="A home for every outcome you’re working toward." action={<Button onClick={openProject} variant="outline" className="h-10 gap-2 rounded-xl bg-card text-xs font-bold" data-testid="button-create-project"><Plus size={15} /> New project</Button>} />
    <div className="mb-5 flex flex-wrap items-center gap-2"><button onClick={() => setFilter('all')} className={`rounded-full px-3.5 py-2 text-[11px] font-bold transition ${filter === 'all' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:text-foreground'}`} data-testid="filter-project-all">All projects <span className="ml-1 opacity-60">{data.projects.length}</span></button>{data.projects.map(project => <button key={project.id} onClick={() => setFilter(project.id)} className={`rounded-full px-3.5 py-2 text-[11px] font-bold transition ${filter === project.id ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:text-foreground'}`} data-testid={`filter-project-${project.id}`}>{project.name}</button>)}</div>
    {visible.length ? <div className="grid gap-4 lg:grid-cols-2">{visible.map(project => {
      const projectTasks = data.tasks.filter(t => t.projectId === project.id), completed = projectTasks.filter(t => t.status === 'done').length, percent = projectTasks.length ? Math.round(completed / projectTasks.length * 100) : 0, taskList = projectTasks.filter(t => t.status !== 'done').slice(0, 3);
      return <article key={project.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_32px_-24px_rgba(42,51,45,.3)]" data-testid={`project-card-${project.id}`}><div className="h-1.5" style={{ background: project.color }} /><div className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><span className="mb-3 inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em]" style={{ background: `${project.color}18`, color: project.color }}>Active project</span><h2 className="font-display text-[20px] font-extrabold tracking-[-.04em]">{project.name}</h2><p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">{project.description || 'A focused space for the work ahead.'}</p></div><span className="grid size-10 place-items-center rounded-xl" style={{ background: `${project.color}18`, color: project.color }}><FolderKanban size={19} /></span></div><div className="mt-6"><div className="mb-2 flex justify-between text-[10px]"><span className="font-semibold">Overall progress</span><span className="text-muted-foreground">{completed} of {projectTasks.length} complete</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: project.color }} /></div></div><div className="mt-5 space-y-1.5">{taskList.length ? taskList.map(task => <div key={task.id} className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2" data-testid={`project-task-${task.id}`}><span className={`size-1.5 rounded-full ${task.status === 'in-progress' ? 'bg-[#7187b5]' : 'bg-muted-foreground/40'}`} /><span className="flex-1 truncate text-[10px] font-semibold">{task.title}</span><span className="text-[9px] text-muted-foreground">{dateLabel(task.deadline)}</span></div>) : <p className="rounded-lg bg-muted/50 px-3 py-3 text-[10px] text-muted-foreground">No open tasks. Enjoy the breathing room.</p>}</div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-[10px] text-muted-foreground">{projectTasks.length} tasks · {projectTasks.filter(t => t.status !== 'done').length} open</span><button onClick={onCreateTask} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:gap-2 transition-all" data-testid={`button-add-task-${project.id}`}>Add task <ArrowRight size={12} /></button></div></div></article>;
    })}</div> : <EmptyState title="No projects yet" text="Start with one clear outcome. You can add tasks as soon as it’s created." onAction={openProject} actionLabel="Create a project" />}
  </div>;
}

function Settings({ data, update }: { data: Store; update: (patch: Partial<Store>) => void }) {
  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: data.profile });
  useEffect(() => { form.reset(data.profile); }, [data.profile.name, data.profile.email]);
  const submit = form.handleSubmit(profile => { update({ profile }); });
  return <div><Heading eyebrow="Make it yours" title="Settings" description="A few details to make this workspace feel like home." />
    <div className="grid gap-5 lg:grid-cols-[1fr_.78fr]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-6"><h2 className="font-display text-[16px] font-extrabold">Your profile</h2><p className="mt-1 text-xs text-muted-foreground">Update the name and email associated with your workspace.</p></div>
        <Form {...form}><form onSubmit={submit} className="space-y-5">
          <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Full name</FormLabel><FormControl><Input {...field} className="h-11 rounded-xl bg-background text-sm" placeholder="Your name" data-testid="input-profile-name" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Email address</FormLabel><FormControl><Input {...field} type="email" className="h-11 rounded-xl bg-background text-sm" placeholder="you@example.com" data-testid="input-profile-email" /></FormControl><FormMessage /></FormItem>} />
          <div className="pt-1"><Button type="submit" className="rounded-xl px-5 text-xs font-bold" data-testid="button-save-profile">Save profile</Button></div>
        </form></Form>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-6"><h2 className="font-display text-[16px] font-extrabold">Appearance</h2><p className="mt-1 text-xs text-muted-foreground">Choose the atmosphere that works for you.</p></div>
        <div className="flex items-center justify-between rounded-xl border border-border p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">{data.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}</span><span><span className="block text-xs font-bold">Dark mode</span><span className="mt-1 block text-[10px] text-muted-foreground">A softer view for quieter hours.</span></span></div><Switch checked={data.theme === 'dark'} onCheckedChange={checked => update({ theme: checked ? 'dark' : 'light' })} aria-label="Toggle dark mode" data-testid="switch-dark-mode" /></div>
        <div className="mt-5 overflow-hidden rounded-xl border border-border"><div className="flex h-24 gap-2 bg-[#f3f0e7] p-3 dark:bg-[#202a2a]"><span className="w-1/4 rounded-lg bg-[#e5e0d4] dark:bg-[#172020]" /><span className="flex-1 rounded-lg bg-[#fbfaf6] p-2 dark:bg-[#293535]"><span className="block h-2 w-1/2 rounded bg-[#b9c6bb] dark:bg-[#48695d]" /><span className="mt-2 block h-2 w-3/4 rounded bg-[#e5e0d4] dark:bg-[#3d4a49]" /></span></div><p className="border-t border-border px-3 py-2 text-[9px] font-semibold text-muted-foreground">Theme preview · {data.theme} workspace</p></div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:col-span-2"><div className="mb-5"><h2 className="font-display text-[16px] font-extrabold">Workspace details</h2><p className="mt-1 text-xs text-muted-foreground">Your work, saved on this device.</p></div><div className="grid gap-3 sm:grid-cols-3"><InfoTile label="Projects" value={data.projects.length.toString().padStart(2, '0')} icon={FolderKanban} /><InfoTile label="Total tasks" value={data.tasks.length.toString().padStart(2, '0')} icon={ListTodo} /><InfoTile label="Storage" value="On this device" icon={CheckCircle2} /></div></section>
    </div>
  </div>;
}
function InfoTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ListTodo }) { return <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3.5"><span className="grid size-9 place-items-center rounded-lg bg-card text-primary"><Icon size={16} /></span><span><span className="block text-[10px] text-muted-foreground">{label}</span><span className="mt-0.5 block text-xs font-bold">{value}</span></span></div>; }

function EmptyState({ title, text, onAction, actionLabel = 'Create a task' }: { title: string; text: string; onAction: () => void; actionLabel?: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center"><span className="mx-auto grid size-10 place-items-center rounded-xl bg-card text-primary shadow-sm"><ListTodo size={18} /></span><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{text}</p><Button onClick={onAction} variant="outline" size="sm" className="mt-4 rounded-lg bg-card text-[11px] font-bold" data-testid="button-empty-action"><Plus size={13} className="mr-1" />{actionLabel}</Button></div>;
}
function NotFound() { return <div className="grid min-h-[55vh] place-items-center"><div className="text-center"><p className="font-display text-5xl font-extrabold text-primary">404</p><p className="mt-2 text-sm font-semibold">This page wandered off.</p><Link className="mt-4 inline-flex text-xs font-bold text-primary" href="/" data-testid="link-back-home">Back to overview</Link></div></div>; }

function TaskDialog({ open, onOpenChange, task, projects, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; task: Task | null; projects: Project[]; onSave: (task: Task) => void }) {
  const form = useForm<TaskForm>({ resolver: zodResolver(taskSchema), defaultValues: { title: '', description: '', projectId: projects[0]?.id ?? '', priority: 'medium', deadline: '', assignee: 'You', status: 'todo' } });
  useEffect(() => {
    form.reset(task ? { title: task.title, description: task.description, projectId: task.projectId, priority: task.priority, deadline: task.deadline, assignee: task.assignee, status: task.status } : { title: '', description: '', projectId: projects[0]?.id ?? '', priority: 'medium', deadline: '', assignee: 'You', status: 'todo' });
  }, [task, open, projects.length]);
  const submit = form.handleSubmit(values => { onSave({ ...values, id: task?.id ?? `task-${Date.now()}` }); onOpenChange(false); });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-border bg-card sm:max-w-[520px]"><DialogHeader><DialogTitle className="font-display text-xl font-extrabold tracking-tight">{task ? 'Edit task' : 'Create a task'}</DialogTitle><DialogDescription className="text-xs">Make the next step clear, and give it an owner.</DialogDescription></DialogHeader>
    {!projects.length ? <div className="rounded-xl bg-muted p-4 text-xs text-muted-foreground">Create a project first, then you can add tasks to it.</div> : <Form {...form}><form onSubmit={submit} className="space-y-4">
      <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Task title</FormLabel><FormControl><Input {...field} autoFocus className="h-10 rounded-lg text-sm" placeholder="What needs to happen?" data-testid="input-task-title" /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Description <span className="font-normal text-muted-foreground">(optional)</span></FormLabel><FormControl><Textarea {...field} className="min-h-[72px] resize-y rounded-lg text-xs" placeholder="Add a little context..." data-testid="input-task-description" /></FormControl><FormMessage /></FormItem>} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField control={form.control} name="projectId" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Project</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-10 rounded-lg text-xs" data-testid="select-task-project"><SelectValue placeholder="Choose a project" /></SelectTrigger></FormControl><SelectContent>{projects.map(project => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
        <FormField control={form.control} name="priority" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Priority</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-10 rounded-lg text-xs" data-testid="select-task-priority"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
        <FormField control={form.control} name="deadline" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Deadline</FormLabel><FormControl><Input {...field} type="date" className="h-10 rounded-lg text-xs" data-testid="input-task-deadline" /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="assignee" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Assignee</FormLabel><FormControl><Input {...field} className="h-10 rounded-lg text-xs" placeholder="Name" data-testid="input-task-assignee" /></FormControl><FormMessage /></FormItem>} />
        {task && <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-10 rounded-lg text-xs" data-testid="select-task-edit-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="todo">To do</SelectItem><SelectItem value="in-progress">In progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />}
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg text-xs" data-testid="button-cancel-task">Cancel</Button><Button type="submit" className="rounded-lg px-5 text-xs font-bold" data-testid="button-save-task">{task ? 'Save changes' : 'Create task'}</Button></div>
    </form></Form>}
  </DialogContent></Dialog>;
}

function ProjectDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (project: Project) => void }) {
  const form = useForm<ProjectForm>({ resolver: zodResolver(projectSchema), defaultValues: { name: '', description: '' } });
  useEffect(() => { if (!open) form.reset({ name: '', description: '' }); }, [open]);
  const submit = form.handleSubmit(values => { const colors = ['#2f8067', '#d28a4e', '#7187b5', '#9a729f', '#bc6c5e']; onSave({ ...values, id: `project-${Date.now()}`, color: colors[Math.floor(Math.random() * colors.length)] }); onOpenChange(false); });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-2xl border-border bg-card sm:max-w-[460px]"><DialogHeader><DialogTitle className="font-display text-xl font-extrabold tracking-tight">Start a project</DialogTitle><DialogDescription className="text-xs">Give a meaningful outcome its own space.</DialogDescription></DialogHeader><Form {...form}><form onSubmit={submit} className="space-y-4"><FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Project name</FormLabel><FormControl><Input {...field} autoFocus className="h-10 rounded-lg text-sm" placeholder="e.g. Customer stories" data-testid="input-project-name" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel className="text-xs font-bold">Description</FormLabel><FormControl><Textarea {...field} className="min-h-[82px] rounded-lg text-xs" placeholder="What are you hoping to accomplish?" data-testid="input-project-description" /></FormControl><FormMessage /></FormItem>} /><div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg text-xs" data-testid="button-cancel-project">Cancel</Button><Button type="submit" className="rounded-lg px-5 text-xs font-bold" data-testid="button-save-project">Create project</Button></div></form></Form></DialogContent></Dialog>;
}

export default App;
