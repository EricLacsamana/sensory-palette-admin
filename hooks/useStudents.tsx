import { useQuery } from '@tanstack/react-query';
import { getStudent } from '../api/students';

export const useStudent = (studentId: number | null) => {
    return useQuery({
        queryKey: ['student', studentId],
        queryFn: getStudent,
        enabled: !!studentId,
        staleTime: 1000 * 60 * 5,
    });
};
