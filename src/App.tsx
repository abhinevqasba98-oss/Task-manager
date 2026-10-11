import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Container, Divider, FormControl,
  InputAdornment, InputLabel, List, ListItemButton, ListItemIcon, ListItemText, MenuItem,
  Paper, Select, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { Add, CalendarMonth, CheckCircleOutline, Close, DashboardOutlined, FilterList,
  FolderOutlined, Search, TaskAlt, Timelapse, ViewKanban, ViewList } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { taskApi } from './api/tasks';
import TaskCard from './components/TaskCard';
import TaskDialog from './components/TaskDialog';
import { statusChipStyles } from './taskStyles';
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from './types/task';

type ViewMode = 'list' | 'board';
type SortOrder = 'asc' | 'desc';
type SidebarSection = 'work' | 'projects' | 'filters';

function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function MetricCard({ label, value, detail, icon, tone = 'default' }: { label: string; value: string | number; detail: string; icon: ReactNode; tone?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 3, minWidth: 0, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary" fontWeight={550}>{label}</Typography>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: tone === 'primary' ? 'rgba(139,131,255,.14)' : tone === 'green' ? 'rgba(67,185,149,.13)' : tone === 'orange' ? 'rgba(230,154,56,.13)' : 'rgba(154,166,187,.1)', color: tone === 'primary' ? 'primary.main' : tone === 'green' ? 'success.main' : tone === 'orange' ? 'warning.main' : 'text.secondary', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
      </Stack>
      <Typography variant="h4" sx={{ mt: 1.2, fontSize: { xs: '1.75rem', sm: '2rem' } }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{detail}</Typography>
    </Paper>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [view, setView] = useState<ViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>('projects');
  const overviewRef = useRef<HTMLDivElement>(null);
  const issuesRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskApi.getAll();
      setTasks(data);
    } catch {
      setError('Could not load tasks. Make sure the mock API is running on port 3001, then try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTasks(); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim().toLocaleLowerCase()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const today = localDateString();
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const pending = tasks.filter((task) => task.status !== 'Completed').length;
  const overdue = tasks.filter((task) => task.status !== 'Completed' && task.dueDate < today).length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => tasks
    .filter((task) => task.title.toLocaleLowerCase().includes(debouncedSearch))
    .filter((task) => statusFilter === 'All statuses' || task.status === statusFilter)
    .filter((task) => priorityFilter === 'All priorities' || task.priority === priorityFilter)
    .sort((a, b) => sortOrder === 'asc' ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate)),
  [tasks, debouncedSearch, statusFilter, priorityFilter, sortOrder]);

  const openCreate = () => { setSelectedTask(null); setDialogOpen(true); };
  const openEdit = (task: Task) => { setSelectedTask(task); setDialogOpen(true); };
  const saveTask = async (input: TaskInput) => {
    setSaving(true);
    setError('');
    try {
      if (selectedTask) {
        const updated = await taskApi.update(selectedTask.id, input);
        setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
        toast.success('Issue updated successfully.');
      } else {
        const created = await taskApi.create(input);
        setTasks((current) => [...current, created]);
        toast.success('Issue created successfully.');
      }
      setDialogOpen(false);
      setSelectedTask(null);
    } catch {
      setError('Your changes could not be saved. Please check the API connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (task: Task) => {
    const confirmed = window.confirm(`Delete issue “${task.title}”? This action cannot be undone.`);
    if (!confirmed) return;
    setError('');
    try {
      await taskApi.remove(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      toast.success('Issue deleted successfully.');
    } catch {
      setError('The issue could not be deleted. Please try again.');
    }
  };

  const clearFilters = () => { setSearch(''); setStatusFilter('All statuses'); setPriorityFilter('All priorities'); setSortOrder('asc'); };
  const hasFilters = Boolean(search || statusFilter !== 'All statuses' || priorityFilter !== 'All priorities' || sortOrder !== 'asc');
  const navigateSidebar = (section: SidebarSection) => {
    setActiveSection(section);
    const target = section === 'work' ? overviewRef.current : section === 'filters' ? filtersRef.current : issuesRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (section === 'filters') window.setTimeout(() => document.getElementById('issue-search')?.focus(), 450);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box component="aside" sx={{ display: { xs: 'none', md: 'flex' }, width: 248, flexShrink: 0, flexDirection: 'column', bgcolor: '#0c1322', borderRight: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, height: '100vh' }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2.5, py: 2.25 }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#090d18', width: 36, height: 36, borderRadius: 1.5, display: 'grid', placeItems: 'center' }}><TaskAlt /></Box>
          <Box><Typography fontWeight={750} sx={{ lineHeight: 1.2 }}>Task Manager</Typography><Typography variant="caption" color="text.secondary"> My Workspace</Typography></Box>
        </Stack>
        <Divider />
        <List component="nav" aria-label="Workspace navigation" sx={{ px: 1.25, py: 1.5 }}>
          <ListItemButton selected={activeSection === 'work'} onClick={() => navigateSidebar('work')} sx={{ borderRadius: 1.5, mb: 0.5 }}><ListItemIcon sx={{ minWidth: 38 }}><DashboardOutlined fontSize="small" /></ListItemIcon><ListItemText primary="Your work" /></ListItemButton>
          <ListItemButton selected={activeSection === 'projects'} onClick={() => navigateSidebar('projects')} sx={{ borderRadius: 1.5, mb: 0.5 }}><ListItemIcon sx={{ minWidth: 38 }}><FolderOutlined fontSize="small" /></ListItemIcon><ListItemText primary="Projects" /></ListItemButton>
          <ListItemButton selected={activeSection === 'filters'} onClick={() => navigateSidebar('filters')} sx={{ borderRadius: 1.5 }}><ListItemIcon sx={{ minWidth: 38 }}><FilterList fontSize="small" /></ListItemIcon><ListItemText primary="Filters" /></ListItemButton>
        </List>
        </Box>

      <Box sx={{ minWidth: 0, flex: 1, pb: 6 }}>
        <Box component="header" sx={{ bgcolor: 'rgba(17,24,39,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
              <Box sx={{ display: { xs: 'grid', md: 'none' }, bgcolor: 'primary.main', color: '#090d18', width: 34, height: 34, borderRadius: 1.5, placeItems: 'center' }}><TaskAlt fontSize="small" /></Box>
              <Box sx={{ minWidth: 0 }}><Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Projects / Website refresh</Typography><Typography fontWeight={650} noWrap>Website refresh</Typography></Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 1.5, px: { xs: 1.5, sm: 2 } }}>Create issue</Button>
              <Avatar sx={{ display: { xs: 'none', sm: 'flex' }, width: 34, height: 34, bgcolor: '#344563', fontSize: 13 }}>AQ</Avatar>
            </Stack>
          </Box>
        </Box>

      <Container component="main" maxWidth="xl" sx={{ pt: { xs: 3, md: 3.5 } }}>
        <Stack ref={overviewRef} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'flex-end' }} justifyContent="space-between" spacing={2} sx={{ mb: 3, scrollMarginTop: 90 }}>
          <Box><Typography variant="caption" color="primary.light" fontWeight={650}>SOFTWARE PROJECT</Typography><Typography variant="h4" sx={{ mt: 0.4, fontSize: { xs: '1.8rem', sm: '2.15rem' } }}>Website refresh</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>Track issues, priorities, and delivery progress in one place.</Typography></Box>
          <Typography variant="body2" color="text.secondary">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2.5 }} action={<Button color="inherit" size="small" onClick={() => void loadTasks()}>Retry</Button>}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5, mb: 3 }}>
          <MetricCard label="Total issues" value={tasks.length} detail="Across all statuses" icon={<CalendarMonth fontSize="small" />} />
          <MetricCard label="Completed" value={completed} detail={`${completion}% completion rate`} icon={<CheckCircleOutline fontSize="small" />} tone="green" />
          <MetricCard label="Open issues" value={pending} detail="To do and in progress" icon={<Timelapse fontSize="small" />} tone="primary" />
          <MetricCard label="Overdue" value={overdue} detail="Past due, not completed" icon={<CalendarMonth fontSize="small" />} tone="orange" />
        </Box>

        <Paper ref={issuesRef} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, scrollMarginTop: 90 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
            <Box><Typography variant="h6">Issues</Typography><Typography variant="body2" color="text.secondary">Search, filter, and review project work.</Typography></Box>
            <Tabs value={view} onChange={(_, value: ViewMode) => setView(value)} aria-label="Task view" variant="fullWidth" sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, px: 1.5, minWidth: 90 } }}>
              <Tab value="list" icon={<ViewList fontSize="small" />} iconPosition="start" label="List" />
              <Tab value="board" icon={<ViewKanban fontSize="small" />} iconPosition="start" label="Board" />
            </Tabs>
          </Stack>

          <Box ref={filtersRef} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'minmax(220px, 1.7fr) repeat(3, minmax(135px, 1fr))' }, gap: 1.25, mb: 2.5, scrollMarginTop: 90 }}>
            <TextField id="issue-search" placeholder="Search issues" value={search} onChange={(e) => setSearch(e.target.value)} size="small" fullWidth inputProps={{ 'aria-label': 'Search issues' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>, endAdornment: search ? <InputAdornment position="end"><Button aria-label="Clear search" size="small" onClick={() => setSearch('')} sx={{ minWidth: 0, p: 0.5 }}><Close fontSize="small" /></Button></InputAdornment> : undefined }} />
            <FormControl size="small" fullWidth><InputLabel id="status-filter-label">Status</InputLabel><Select labelId="status-filter-label" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{['All statuses', ...TASK_STATUSES].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
            <FormControl size="small" fullWidth><InputLabel id="priority-filter-label">Priority</InputLabel><Select labelId="priority-filter-label" label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>{['All priorities', ...TASK_PRIORITIES].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
            <FormControl size="small" fullWidth><InputLabel id="sort-label">Due date</InputLabel><Select labelId="sort-label" label="Due date" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}><MenuItem value="asc">Soonest first</MenuItem><MenuItem value="desc">Latest first</MenuItem></Select></FormControl>
          </Box>

          {loading ? <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}><CircularProgress size={30} /><Typography color="text.secondary" variant="body2">Loading your tasks…</Typography></Box> : filteredTasks.length === 0 ? (
            <Box sx={{ py: 7, px: 2, textAlign: 'center' }}><Box sx={{ mx: 'auto', mb: 1.5, width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(139,131,255,.14)', color: 'primary.main', display: 'grid', placeItems: 'center' }}><TaskAlt /></Box><Typography fontWeight={650}>{tasks.length === 0 ? 'No issues yet' : 'No matching issues'}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>{tasks.length === 0 ? 'Create your first issue to get things moving.' : 'Try adjusting your search or filters.'}</Typography>{tasks.length === 0 ? <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create issue</Button> : <Button color="inherit" onClick={clearFilters}>Clear filters</Button>}</Box>
          ) : view === 'list' ? (
            <Stack spacing={1}>
              <Box sx={{ display: { xs: 'none', xl: 'grid' }, gridTemplateColumns: 'minmax(220px, 2fr) minmax(180px, 1.5fr) 120px 110px 180px 136px', gap: 1, px: 1.5, py: 1, color: 'text.secondary' }}><Typography variant="caption">TASK</Typography><Typography variant="caption">DESCRIPTION</Typography><Typography variant="caption">STATUS</Typography><Typography variant="caption">PRIORITY</Typography><Typography variant="caption">DUE DATE</Typography><Typography variant="caption" sx={{ textAlign: 'right' }}>ACTIONS</Typography></Box>
              {filteredTasks.map((task) => {
                const isOverdue = task.status !== 'Completed' && task.dueDate < today;
                return <Paper key={task.id} variant="outlined" sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto', xl: 'minmax(220px, 2fr) minmax(180px, 1.5fr) 120px 110px 180px 136px' }, gap: { xs: 1, xl: 1 }, alignItems: 'center', p: 1.5, borderRadius: 2.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={650} sx={{ overflowWrap: 'anywhere' }}>{task.title}</Typography>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center" sx={{ display: { xl: 'none' }, mt: 0.75 }}>
                      <Chip size="small" label={task.status} variant="outlined" sx={statusChipStyles(task.status)} />
                      <Chip size="small" label={task.priority} color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'} variant={task.priority === 'Low' ? 'outlined' : 'filled'} />
                      <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'}>{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{isOverdue ? ' · Overdue' : ''}</Typography>
                    </Stack>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', xl: '-webkit-box' }, overflow: 'hidden', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{task.description || '—'}</Typography>
                  <Box sx={{ display: { xs: 'none', xl: 'block' } }}><Chip size="small" label={task.status} variant="outlined" sx={statusChipStyles(task.status)} /></Box>
                  <Box sx={{ display: { xs: 'none', xl: 'block' } }}><Chip size="small" label={task.priority} color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'} variant={task.priority === 'Low' ? 'outlined' : 'filled'} /></Box>
                  <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.secondary'} sx={{ display: { xs: 'none', xl: 'block' }, whiteSpace: 'nowrap' }}>{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{isOverdue ? ' · Overdue' : ''}</Typography>
                  <Box sx={{ justifySelf: { xs: 'start', sm: 'end' }, display: 'flex', gap: 0.5, whiteSpace: 'nowrap' }}><Button size="small" onClick={() => openEdit(task)} aria-label={`Edit ${task.title}`}>Edit</Button><Button size="small" color="error" onClick={() => void deleteTask(task)} aria-label={`Delete ${task.title}`}>Delete</Button></Box>
                </Paper>;
              })}
            </Stack>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, alignItems: 'start' }}>
              {TASK_STATUSES.map((status: TaskStatus) => {
                const columnTasks = filteredTasks.filter((task) => task.status === status);
                return <Box key={status} sx={{ bgcolor: '#0b1220', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 1.25, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, pb: 1.25 }}><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status === 'Completed' ? 'success.main' : status === 'In Progress' ? 'primary.main' : '#a0a6b5' }} /><Typography fontWeight={650} variant="body2">{status}</Typography></Stack><Chip size="small" label={columnTasks.length} /></Stack>
                  <Stack spacing={1.1}>{columnTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={(item) => void deleteTask(item)} />)}{columnTasks.length === 0 && <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography variant="caption">No tasks here</Typography></Box>}</Stack>
                </Box>;
              })}
            </Box>
          )}
          {!loading && filteredTasks.length > 0 && <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, mt: 2, borderTop: '1px solid', borderColor: 'divider' }}><Typography variant="caption" color="text.secondary">Showing {filteredTasks.length} of {tasks.length} issues</Typography>{hasFilters && <Button size="small" onClick={clearFilters}>Reset filters</Button>}</Stack>}
        </Paper>
       </Container>
      </Box>

      <TaskDialog open={dialogOpen} task={selectedTask} saving={saving} onClose={() => { setDialogOpen(false); setSelectedTask(null); }} onSave={saveTask} />
    </Box>
  );
}
