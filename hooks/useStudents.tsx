import { useQuery } from '@tanstack/react-query';
import { getStudent } from '../api/students';

export const useStudent = (studentId: number) => {
    return useQuery({
        queryKey: ['student', studentId],
        queryFn: () => getStudent(studentId),
        enabled: !!studentId,
        staleTime: 1000 * 60 * 5,
    });
};
