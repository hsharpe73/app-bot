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

const agruparDatos = (etiquetas, valores) => {
  const mapa = new Map();
  etiquetas.forEach((etiqueta, index) => {
    const valor = valores[index];
    if (mapa.has(etiqueta)) {
      mapa.set(etiqueta, mapa.get(etiqueta) + valor);
    } else {
      mapa.set(etiqueta, valor);
    }
  });
  return {
    etiquetas: Array.from(mapa.keys()),
    valores: Array.from(mapa.values())
  };
};

const InformeChart = ({ data }) => {
  const chartRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');

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
      const columnasNumericas = columnas.filter(k => {
        const val = parseFloat(primeraFila[k]);
        const key = normaliza(k);
        return !isNaN(val) && val > 0 && key !== 'id' && key !== 'mes';
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

  let etiquetas = data.map(r => {
    const valor = r[etiquetaKey];
    return etiquetaKey.toLowerCase().includes('mes')
      ? nombreMes(valor)
      : valor?.toString() || 'Sin nombre';
  });

  let valores = data.map(r => parseFloat(r[valorKey]) || 0);

  const agrupado = agruparDatos(etiquetas, valores);
  etiquetas = agrupado.etiquetas;
  valores = agrupado.valores;

  const total = valores.reduce((acc, val) => acc + val, 0);
  const tipoGrafico = etiquetas.length <= 6 ? 'pie' : 'bar';
  const mostrarCLP = etiquetas.length <= 3 && etiquetas.length === data.length;

  const chartData = {
    labels: etiquetas,
    datasets: [
      {
        label: formateaTitulo(valorKey || 'Valores'),
        data: valores,
        backgroundColor: '#ff6384',
        borderColor: '#fff',
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: tipoGrafico === 'bar' ? 'x' : undefined,
    scales: tipoGrafico === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => formatCLP(value),
          font: {
            size: isMobile ? 9 : 11,
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 9 : 11,
          }
        }
      }
    } : {},
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: tipoGrafico === 'pie'
          ? `Distribución por ${formateaTitulo(etiquetaKey)}`
          : `Valores por ${formateaTitulo(etiquetaKey)}`,
        font: {
          size: isMobile ? 14 : 18
        }
      },
      datalabels: tipoGrafico === 'bar' ? {
        color: '#000',
        anchor: 'end',
        align: 'top',
        formatter: (value) => formatCLP(value),
        font: {
          weight: 'bold',
          size: isMobile ? 9 : 11,
        }
      } : tipoGrafico === 'pie' ? {
        color: '#fff',
        align: 'center',
        anchor: 'center',
        clamp: true,
        formatter: (value) => {
          const porcentaje = ((value / total) * 100).toFixed(1);
          return `${formatCLP(value)} (${porcentaje}%)`;
        },
        font: {
          weight: 'bold',
          size: isMobile ? 9 : 12,
        },
      } : null,
    },
  };

  const exportarPDF = async () => {
    const chartCanvas = chartRef.current;
    const canvas = chartCanvas.querySelector('canvas');
    const image = await html2canvas(canvas, { scale: 1.5 });
    const imgData = image.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait' });
    pdf.addImage(imgData, 'PNG', 20, 20, 160, 120);
    pdf.save('informe-grafico.pdf');
  };

  return (
    <Paper elevation={3} sx={{
      padding: 2,
      marginTop: 3,
      borderRadius: 3,
      backgroundColor: '#fff',
      maxWidth: isMobile ? '100%' : 520,
      mx: 'auto',
    }}>
      <Box ref={chartRef} sx={{
        position: 'relative',
        padding: 1,
        width: isMobile ? 320 : 480,
        mx: 'auto'
      }}>
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
