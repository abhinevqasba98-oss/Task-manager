import { useEffect, useState, type FormEvent } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  FormHelperText, InputLabel, MenuItem, Stack, TextField, Select, type SelectChangeEvent,
} from '@mui/material';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types/task';
import { TASK_PRIORITIES, TASK_STATUSES } from '../types/task';

interface TaskDialogProps {
  open: boolean;
  task: Task | null;
  saving: boolean;
  onClose: () => void;
  onSave: (task: TaskInput) => Promise<void>;
}

const emptyTask: TaskInput = {
  title: '', description: '', status: 'To Do', priority: 'Medium', dueDate: '',
};

export default function TaskDialog({ open, task, saving, onClose, onSave }: TaskDialogProps) {
  const [form, setForm] = useState<TaskInput>(emptyTask);
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});

  useEffect(() => {
    if (open) {
      setForm(task ? {
        title: task.title, description: task.description, status: task.status,
        priority: task.priority, dueDate: task.dueDate,
      } : emptyTask);
      setErrors({});
    }
  }, [open, task]);

  const setField = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'title' || key === 'dueDate') setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { title?: string; dueDate?: string } = {};
    if (!form.title.trim()) nextErrors.title = 'Enter a task title.';
    if (!form.dueDate || Number.isNaN(Date.parse(`${form.dueDate}T00:00:00`))) {
      nextErrors.dueDate = 'Choose a valid due date.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSave({ ...form, title: form.title.trim(), description: form.description.trim() });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{task ? 'Edit issue' : 'Create issue'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.2} sx={{ pt: 1 }}>
            <TextField label="Issue title" value={form.title} onChange={(e) => setField('title', e.target.value)} error={Boolean(errors.title)} helperText={errors.title} required autoFocus fullWidth inputProps={{ maxLength: 120 }} />
            <TextField label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} multiline minRows={3} fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="task-status-label">Status</InputLabel>
                <Select labelId="task-status-label" label="Status" value={form.status} onChange={(e: SelectChangeEvent) => setField('status', e.target.value as TaskStatus)}>
                  {TASK_STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="task-priority-label">Priority</InputLabel>
                <Select labelId="task-priority-label" label="Priority" value={form.priority} onChange={(e: SelectChangeEvent) => setField('priority', e.target.value as TaskPriority)}>
                  {TASK_PRIORITIES.map((priority) => <MenuItem key={priority} value={priority}>{priority}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <FormControl error={Boolean(errors.dueDate)} fullWidth>
              <TextField label="Due date" type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} error={Boolean(errors.dueDate)} required fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: '1900-01-01' }} />
              {errors.dueDate && <FormHelperText>{errors.dueDate}</FormHelperText>}
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Create issue'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
