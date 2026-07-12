import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { customFetch } from './custom-fetch';
import type { 
  LichTrinhResponse, 
  ListLichTrinhResponse, 
  UpsertLichTrinhBodyType,
  ListLichTrinhQueryParams,
  LichTrinhResponseType,
  ListLichTrinhResponseType
} from '@workspace/api-zod';

// Fetch multiple
export const getListLichTrinhQueryKey = (params?: { startDate?: string; endDate?: string }) => 
  [`/api/lich-trinh`, params] as const;

export const useListLichTrinh = <TData = ListLichTrinhResponseType, TError = unknown>(
  params?: { startDate?: string; endDate?: string },
  options?: Omit<UseQueryOptions<ListLichTrinhResponseType, TError, TData>, 'queryKey'>
) => {
  return useQuery<ListLichTrinhResponseType, TError, TData>({
    queryKey: getListLichTrinhQueryKey(params),
    queryFn: async () => {
      let url = `/api/lich-trinh`;
      if (params) {
        const urlParams = new URLSearchParams();
        if (params.startDate) urlParams.append('startDate', params.startDate);
        if (params.endDate) urlParams.append('endDate', params.endDate);
        const searchString = urlParams.toString();
        if (searchString) {
          url += `?${searchString}`;
        }
      }
      return customFetch<ListLichTrinhResponseType>(url, { method: 'GET' });
    },
    ...options
  });
};

// Upsert
export const useUpsertLichTrinh = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<LichTrinhResponseType, TError, UpsertLichTrinhBodyType, TContext>
) => {
  return useMutation<LichTrinhResponseType, TError, UpsertLichTrinhBodyType, TContext>({
    mutationFn: (data) => customFetch<LichTrinhResponseType>(`/api/lich-trinh`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    ...options
  });
};

// Delete
export const useDeleteLichTrinh = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<void, TError, { ngay: string }, TContext>
) => {
  return useMutation<void, TError, { ngay: string }, TContext>({
    mutationFn: ({ ngay }) => customFetch<void>(`/api/lich-trinh/${ngay}`, {
      method: 'DELETE'
    }),
    ...options
  });
};
