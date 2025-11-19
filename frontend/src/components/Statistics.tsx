import React from 'react';
import { Statistics as StatsType } from '../types/book';

interface StatisticsProps {
    statistics: StatsType;
    loading: boolean;
}

export const Statistics: React.FC<StatisticsProps> = ({
    statistics,
    loading,
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-6 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-20 mb-2" />
                        <div className="h-8 bg-white/10 rounded w-12" />
                    </div>
                ))}
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Books',
            value: statistics.total,
            icon: '📚',
            color: 'from-primary-500 to-primary-600',
        },
        {
            label: 'Read',
            value: statistics.read,
            icon: '✅',
            color: 'from-green-500 to-green-600',
        },
        {
            label: 'Unread',
            value: statistics.unread,
            icon: '📖',
            color: 'from-yellow-500 to-yellow-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className="glass-card p-6 hover:scale-105 transition-transform duration-200 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-dark-400 text-sm font-medium mb-1">
                                {stat.label}
                            </p>
                            <p className="text-4xl font-bold text-gradient bg-gradient-to-r ${stat.color}">
                                {stat.value}
                            </p>
                        </div>
                        <div className="text-4xl">{stat.icon}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
