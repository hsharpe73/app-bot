import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const InformeChart = ({ data }) => {
  if (!data || !data.length) return null;

  const posiblesEtiquetas = ['cliente', 'nombre_cliente', 'categoria_doc', 'direccion_destino'];
  const posiblesValores = ['total', 'monto', 'saldo', 'neto', 'iva'];

  const primeraFila = data[0];
  const etiquetaKey = posiblesEtiquetas.find(k => k in primeraFila) || Object.keys(primeraFila)[0];
  const valorKey = posiblesValores.find(k => k in primeraFila) || Object.keys(primeraFila).find(k => typeof primeraFila[k] === 'number');

  const etiquetas = data.map(r => r[etiquetaKey]?.toString() || 'Sin nombre');
  const valores = data.map(r => parseFloat(r[valorKey]) || 0);

  
  const tipoGrafico = etiquetas.length <= 6 ? 'pie' : 'bar';

  const chartData = {
    labels: etiquetas,
    datasets: [
      {
        label: valorKey,
        data: valores,
        backgroundColor: [
          '#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'
        ],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: tipoGrafico === 'pie' ? `Distribución por ${etiquetaKey}` : `Valores por ${etiquetaKey}`,
      },
    },
  };

  return tipoGrafico === 'pie'
    ? <Pie data={chartData} options={options} />
    : <Bar data={chartData} options={options} />;
};

export default InformeChart;
