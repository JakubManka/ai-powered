import { useState, useEffect } from 'react';
import { Statistics } from '../types/book';
import { bookService } from '../services/bookService';

export const useStatistics = () => {
    const [statistics, setStatistics] = useState<Statistics>({
        total: 0,
        read: 0,
        unread: 0,
    });
    const [loading, setLoading] = useState(false);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const data = await bookService.getStatistics();
            setStatistics(data);
        } catch (err) {
            console.error('Failed to fetch statistics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    return { statistics, loading, refetch: fetchStatistics };
};
