import React, { useRef } from 'react';
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
import { Box, Button, Paper, useMediaQuery } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

const formateaTitulo = (texto) =>
  texto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const colores = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#8BC34A', '#E91E63',
  '#00ACC1', '#FF5722', '#9C27B0', '#CDDC39',
  '#03A9F4', '#673AB7', '#F44336', '#009688',
  '#FFA726', '#BA68C8', '#81C784', '#64B5F6'
];

const InformeChart = ({ data }) => {
  const chartRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const rawData = Array.isArray(data) ? (data[0]?.rows || data[0]?.resultados || data) : [];
  if (!rawData || !rawData.length) return null;

  const primeraFila = rawData[0];
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
      const columnasNumericas = columnas.filter(k => {
        const val = parseFloat(primeraFila[k]);
        const key = normaliza(k);
        return !isNaN(val) && val > 0 && key !== 'id';
      });

      const preferida = posiblesValores
        .map(v => columnas.find(k => normaliza(k).includes(v)))
        .find(Boolean);

      return preferida || columnasNumericas[0];
    } else {
      return columnas.find(k => normaliza(k) !== 'id');
    }
  };

  const etiquetaKey = encontrarColumna(posiblesEtiquetas, 'texto');
  const valorKey = columnas.includes('total') ? 'total' : encontrarColumna(posiblesValores, 'numero');

  const mesKey = columnas.find(k => normaliza(k) === 'mes');
  const clienteKey = columnas.find(k => k !== mesKey && normaliza(k).includes('cliente'));

  const etiquetas = [];
  const valores = [];

  rawData.forEach(r => {
    const valor = parseFloat(r[valorKey]) || 0;

    let mes = r[mesKey];
    if (mesKey && /^[0-9]+$/.test(mes)) {
      mes = nombreMes(mes);
    }

    const cliente = r[clienteKey]?.toString() || 'Sin cliente';
    const etiqueta = mes && cliente ? `${mes} (${cliente})` : cliente || mes || 'Sin nombre';

    etiquetas.push(etiqueta);
    valores.push(valor);
  });

  const total = valores.reduce((acc, val) => acc + val, 0);
  const tipoGrafico = etiquetas.length <= 4 ? 'pie' : 'bar';
  const maxValor = Math.max(...valores);

  const chartData = {
    labels: etiquetas,
    datasets: [
      {
        label: formateaTitulo(valorKey || 'Valores'),
        data: valores,
        backgroundColor: etiquetas.map((_, i) => colores[i % colores.length]),
        borderRadius: 4,
        barThickness: 30,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: tipoGrafico === 'pie' ? 'bottom' : 'top',
        labels: {
          font: {
            size: isMobile ? 9 : 12,
          },
        },
      },
      title: {
        display: true,
        text: tipoGrafico === 'pie'
          ? `Distribución por ${formateaTitulo(etiquetaKey)}`
          : `Valores por ${formateaTitulo(etiquetaKey)}`,
        font: { size: isMobile ? 14 : 18 },
      },
      datalabels: tipoGrafico === 'bar' ? {
        display: (ctx) => {
          const value = ctx.dataset.data[ctx.dataIndex];
          return value === maxValor || value > 10000000;
        },
        color: '#000',
        anchor: 'end',
        align: 'top',
        clamp: true,
        clip: true,
        formatter: (value) => formatCLP(value),
        font: {
          weight: 'bold',
          size: etiquetas.length > 10 ? 7 : isMobile ? 8 : 10,
        },
      } : {
        color: '#fff',
        align: 'center',
        anchor: 'center',
        formatter: (value, ctx) => {
          const label = ctx.chart.data.labels[ctx.dataIndex] || '';
          const porcentaje = ((value / total) * 100).toFixed(1);
          return `${label}\n${formatCLP(value)} (${porcentaje}%)`;
        },
        font: {
          weight: 'bold',
          size: isMobile ? 8 : 10,
        },
      },
    },
    scales: tipoGrafico === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCLP(value),
          font: { size: isMobile ? 9 : 11 },
        },
      },
      x: {
        ticks: {
          font: { size: etiquetas.length > 10 ? 7 : isMobile ? 9 : 11 },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    } : {},
  };

  const exportarPDF = async () => {
    const chartCanvas = chartRef.current;
    const canvas = chartCanvas.querySelector('canvas');
    const image = await html2canvas(canvas, { scale: 2 });
    const imgData = image.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.addImage(imgData, 'PNG', 20, 20, 250, 120);
    pdf.save('informe-grafico.pdf');
  };

  return (
    <Paper elevation={3} sx={{
      padding: 2,
      marginTop: 3,
      borderRadius: 3,
      backgroundColor: '#fff',
      width: '100%',
      overflowX: 'auto',
    }}>
      <Box
        ref={chartRef}
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 700,
          height: isMobile ? 250 : 300,
          margin: 'auto',
        }}
      >
        {tipoGrafico === 'pie' ? (
          <Pie data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </Box>
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button
          variant="contained"
          onClick={exportarPDF}
          sx={{
            borderRadius: 2,
            backgroundColor: '#1976d2',
            fontWeight: 'bold',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          Descargar PDF
        </Button>
      </Box>
    </Paper>
  );
};

export default InformeChart;
