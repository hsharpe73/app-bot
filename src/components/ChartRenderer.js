import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#A020F0', '#FF4444'];

const ChartRenderer = ({ tipo, datos }) => {
  if (!datos || datos.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      {tipo === 'barra' ? (
        <BarChart data={datos}>
          <XAxis dataKey="etiqueta" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="valor" fill="#8884d8" />
        </BarChart>
      ) : tipo === 'torta' ? (
        <PieChart>
          <Pie
            data={datos}
            dataKey="valor"
            nameKey="etiqueta"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {datos.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ) : null}
    </ResponsiveContainer>
  );
};

export default ChartRenderer;
