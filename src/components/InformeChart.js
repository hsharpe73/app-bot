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
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Box } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

const nombreMes = (num) => {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const index = parseInt(num, 10);
  return index >= 1 && index <= 12 ? meses[index - 1] : num;
};

const formatCLP = (num) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

const normaliza = (texto) =>
  texto.toString().toLowerCase().replace(/\s|_/g, '');

const InformeChart = ({ data }) => {
  if (!data || !data.length) return null;

  const primeraFila = data[0];
  const columnas = Object.keys(primeraFila);

  const normalizadas = columnas.map(col => ({
    original: col,
    clean: normaliza(col),
  }));

  const posiblesEtiquetas = ['cliente', 'nombrecliente', 'categoria', 'mes', 'periodo'];
  const posiblesValores = ['total', 'monto', 'valor', 'neto', 'iva'];

  const encontrarColumna = (posibles, tipo = 'texto') => {
    const encontrado = normalizadas.find(n => posibles.includes(n.clean));
    if (encontrado) return encontrado.original;

    if (tipo === 'numero') {
      // Excluir columnas como "mes", "id", etc.
      const columnasNumericas = columnas.filter(k => {
        const val = parseFloat(primeraFila[k]);
        const key = normaliza(k);
        return !isNaN(val) && val > 0 && key !== 'id' && key !== 'mes';
      });

      // Priorizar columnas que tengan coincidencia parcial con 'total', 'neto', etc.
      const preferida = posiblesValores
        .map(v => columnas.find(k => normaliza(k).includes(v)))
        .find(Boolean);

      return preferida || columnasNumericas[0];
    } else {
      return columnas.find(k => normaliza(k) !== 'id');
    }
  };

  const etiquetaKey = encontrarColumna(posiblesEtiquetas, 'texto');
  const valorKey = encontrarColumna(posiblesValores, 'numero');

  const etiquetas = data.map(r => {
    const valor = r[etiquetaKey];
    return etiquetaKey.toLowerCase().includes('mes')
      ? nombreMes(valor)
      : valor?.toString() || 'Sin nombre';
  });

  const valores = data.map(r => parseFloat(r[valorKey]) || 0);
  const total = valores.reduce((acc, val) => acc + val, 0);
  const tipoGrafico = etiquetas.length <= 6 ? 'pie' : 'bar';
  const mostrarCLP = etiquetas.length <= 3 && etiquetas.length === data.length;

  const chartData = {
    labels: etiquetas,
    datasets: [
      {
        label: valorKey || 'Valores',
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
        text: tipoGrafico === 'pie'
          ? `Distribución por ${etiquetaKey}`
          : `Valores por ${etiquetaKey}`,
      },
      datalabels: tipoGrafico === 'pie' ? {
        color: '#fff',
        formatter: (value) =>
          mostrarCLP ? formatCLP(value) : `${((value / total) * 100).toFixed(1)}%`,
        font: {
          weight: 'bold',
          size: 14,
        },
      } : null,
    },
  };

  return tipoGrafico === 'pie' ? (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
      <Pie data={chartData} options={options} />
    </Box>
  ) : (
    <Bar data={chartData} options={options} />
  );
};

export default InformeChart;
