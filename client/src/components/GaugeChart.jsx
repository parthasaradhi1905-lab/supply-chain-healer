import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function GaugeChart({ value, label, max = 100, unit = '%' }) {
    // Determine color based on value
    const getColor = () => {
        if (value >= 75) return '#ff3366'; // Danger (red)
        if (value >= 50) return '#ffaa00'; // Warning (amber)
        return '#00ff88'; // Success (green)
    };

    const data = [
        { name: 'value', value: value },
        { name: 'remaining', value: max - value },
    ];

    const COLORS = [getColor(), '#1a2234'];

    return (
        <div className="glass-card-light p-6 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={0}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div className="text-center -mt-12">
                <div className="text-3xl font-bold font-mono" style={{ color: getColor() }}>
                    {value}{unit}
                </div>
                <p className="text-sm text-text-secondary mt-1 uppercase tracking-wider">
                    {label}
                </p>
            </div>
        </div>
    );
}
