import React, { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement,
  Filler,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, parseISO, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { supabase } from '../lib/supabase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ApplicantsByDay {
  date: string;
  count: number;
}

export function ApplicantChart() {
  const [chartData, setChartData] = useState<ApplicantsByDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicantsByDay();
  }, []);

  const fetchApplicantsByDay = async () => {
    try {
      setLoading(true);
      
      // Get profiles data from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at, role_type')
        .eq('role_type', 'applicant')
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      // Calculate date range (last 14 days)
      const endDate = new Date();
      const startDate = subDays(endDate, 14);
      
      // Generate all days in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Initialize counts for each day
      const dailyCounts = dateRange.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        count: 0
      }));
      
      // Count applicants by day
      data.forEach(profile => {
        if (profile.created_at) {
          const profileDate = startOfDay(parseISO(profile.created_at));
          const dateStr = format(profileDate, 'yyyy-MM-dd');
          
          // Find this date in our array and increment the count
          const dayIndex = dailyCounts.findIndex(day => day.date === dateStr);
          if (dayIndex >= 0) {
            dailyCounts[dayIndex].count++;
          }
        }
      });
      
      setChartData(dailyCounts);
    } catch (err) {
      console.error('Error fetching applicant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        cornerRadius: 4,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45,
          callback: function(value) {
            const label = this.getLabelForValue(value as number);
            return format(parseISO(label), 'MMM d');
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          precision: 0
        }
      }
    }
  };

  const data = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        label: 'New Applicants',
        data: chartData.map(d => d.count),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(102, 126, 234, 0.9)',
      }
    ]
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg w-full h-80 animate-pulse flex items-center justify-center">
        <div className="text-white text-lg">Loading chart data...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-4 mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Applicant Activity</h2>
      <div className="h-64">
        <Bar options={chartOptions} data={data} />
      </div>
      <div className="mt-3 flex justify-between text-white text-sm opacity-80">
        <div>Total Applicants: {chartData.reduce((sum, day) => sum + day.count, 0)}</div>
        <div>Last 14 Days</div>
      </div>
    </div>
  );
}