import { MoreHoriz, CalendarToday } from '@mui/icons-material';
import { Box, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { Task } from '../types/task';
import { statusChipStyles } from '../taskStyles';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const priorityColor = task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default';
  const due = new Date(`${task.dueDate}T00:00:00`);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const overdue = task.status !== 'Completed' && task.dueDate < today;
  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
  const closeMenu = () => setAnchor(null);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', borderRadius: 2.5, '&:hover': { borderColor: 'primary.main', boxShadow: '0 10px 28px rgba(0,0,0,.24)' } }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography fontWeight={650} sx={{ overflowWrap: 'anywhere' }}>{task.title}</Typography>
          <IconButton size="small" aria-label={`Actions for ${task.title}`} onClick={openMenu}><MoreHoriz fontSize="small" /></IconButton>
        </Stack>
        {task.description && <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36 }}>{task.description}</Typography>}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={task.priority} color={priorityColor} variant={task.priority === 'Low' ? 'outlined' : 'filled'} />
          <Chip size="small" label={task.status} variant="outlined" sx={statusChipStyles(task.status)} />
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: overdue ? 'error.main' : 'text.secondary' }}>
          <CalendarToday sx={{ fontSize: 14 }} />
          <Typography variant="caption">Due {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{overdue ? ' · Overdue' : ''}</Typography>
        </Box>
      </Stack>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        <MenuItem onClick={() => { closeMenu(); onEdit(task); }}>Edit issue</MenuItem>
        <MenuItem onClick={() => { closeMenu(); onDelete(task); }} sx={{ color: 'error.main' }}>Delete issue</MenuItem>
      </Menu>
    </Paper>
  );
}
