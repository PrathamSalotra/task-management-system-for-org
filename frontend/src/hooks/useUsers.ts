'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsersApi } from '../lib/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getUsersApi(),
  });
}
