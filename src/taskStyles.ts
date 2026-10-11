import type { TaskStatus } from './types/task';

export function statusChipStyles(status: TaskStatus) {
  if (status === 'Completed') {
    return {
      bgcolor: 'rgba(67, 185, 149, 0.16)',
      borderColor: 'rgba(67, 185, 149, 0.58)',
      color: '#72dfbd',
    };
  }

  if (status === 'In Progress') {
    return {
      bgcolor: 'rgba(96, 165, 250, 0.16)',
      borderColor: 'rgba(96, 165, 250, 0.58)',
      color: '#93c5fd',
    };
  }

  return {
    bgcolor: 'rgba(167, 139, 250, 0.16)',
    borderColor: 'rgba(167, 139, 250, 0.58)',
    color: '#c4b5fd',
  };
}
