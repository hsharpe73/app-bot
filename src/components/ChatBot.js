import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Slide,
  IconButton,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import axios from 'axios';
import Lottie from 'lottie-react';
import * as XLSX from 'xlsx';
import botAnimation from '../assets/bot.json';

const WEBHOOK_URL = 'https://sharpe-asistente-app.app.n8n.cloud/webhook/consulta-ventas-v3';

const formatCLP = (num) => {
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return num;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const numeroATexto = (num) => {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta',
    'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const seccion = (n) => {
    if (n < 20) return unidades[n];
    if (n < 100) return decenas[Math.floor(n / 10)] + (n % 10 ? ' y ' + unidades[n % 10] : '');
    if (n < 1000) return centenas[Math.floor(n / 100)] + (n % 100 ? ' ' + seccion(n % 100) : '');
    if (n < 1000000) {
      const miles = Math.floor(n / 1000);
      const resto = n % 1000;
      return (miles === 1 ? 'mil' : seccion(miles) + ' mil') + (resto ? ' ' + seccion(resto) : '');
    }
    const millones = Math.floor(n / 1000000);
    const resto = n % 1000000;
    return (
      (millones === 1 ? 'un millón' : seccion(millones) + ' millones') +
      (resto ? ' ' + seccion(resto) : '')
    );
  };

  return seccion(num);
};

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vozActiva, setVozActiva] = useState(true);
  const [textoPendiente, setTextoPendiente] = useState('');
  const [informeData, setInformeData] = useState(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    if (!vozActiva && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setTextoPendiente(utteranceRef.current?.text || '');
    }
  }, [vozActiva]);

  useEffect(() => {
    if (vozActiva && textoPendiente) {
      speak(textoPendiente);
      setTextoPendiente('');
    }
  }, [vozActiva]);

  const getSpanishVoice = () => {
    const voices = speechSynthesis.getVoices();
    return voices.find((voice) =>
      voice.lang.startsWith('es') &&
      (voice.name.toLowerCase().includes('google') ||
        voice.name.toLowerCase().includes('helena') ||
        voice.name.toLowerCase().includes('microsoft'))
    );
  };

  const speak = (text) => {
    if (!vozActiva) {
      setTextoPendiente(text);
      return;
    }
    let cleaned = text.replace(/<[^>]*>?/gm, '');
    cleaned = cleaned.replace(/\$([\d.]+)/g, (_, rawNumber) => {
      const numeric = parseInt(rawNumber.replace(/\./g, ''));
      return `${numeroATexto(numeric)} pesos`;
    });
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utteranceRef.current = utterance;
    const selectedVoice = getSpanishVoice();
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = 'es-CL';
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const welcome = '¡Hola! Soy tu asistente de ventas. ¿En qué puedo ayudarte hoy?';
    setMessages([{ sender: 'bot', text: welcome }]);
    speak(welcome);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(WEBHOOK_URL, { pregunta: input });

      const esInforme = res.data?.esInforme === true;
      setInformeData(esInforme ? res.data : null);

      if (esInforme) {
        const mensaje = '📜 Informe disponible para descargar.';
        speechSynthesis.cancel();
        setTextoPendiente('');
        setMessages((prev) => [...prev, { sender: 'bot', text: mensaje }]);
        speak(mensaje);
      } else {
        let respuesta = '';

        if (typeof res.data === 'string') {
          respuesta = res.data;
        } else if (res.data?.message?.content) {
          respuesta = res.data.message.content;
        } else {
          respuesta = 'Sin respuesta del asistente';
        }

        respuesta = respuesta.replace(/\$\d{1,3}(?:\.\d{3})+/g, (match) => {
          const limpio = match.replace(/\./g, '').replace('$', '');
          return `<strong>${formatCLP(limpio)}</strong>`;
        });
        respuesta = respuesta.replace(/(\d{1,3}(?:[.,]\d{1,2})?)%/g, '<strong>$1%</strong>');

        const mensaje = respuesta.toLowerCase().includes('no hay datos disponibles')
          ? '⚠️ No se encontró información para esa factura.' : respuesta;

        speechSynthesis.cancel();
        setTextoPendiente('');
        setMessages((prev) => [...prev, { sender: 'bot', text: mensaje }]);
        speak(mensaje);
      }
    } catch (err) {
      const errorMsg = '⚠️ Error al conectar con el asistente';
      speechSynthesis.cancel();
      setTextoPendiente('');
      setMessages((prev) => [...prev, { sender: 'bot', text: errorMsg }]);
      speak(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const descargarExcel = () => {
    if (!informeData || !informeData.resultados) return;

    const resultados = informeData.resultados;
    const formattedData = resultados.map((row) => {
      const newRow = {};
      Object.keys(row).forEach((key) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());

        let value = row[key];

        if (
          typeof value === 'number' &&
          /total|neto|iva|compra/i.test(formattedKey)
        ) {
          value = formatCLP(value).toString(); // <--- aquí está la conversión
        }

        newRow[formattedKey] = value;
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, 'informe-ventas.xlsx');
  };

  const handleClear = () => {
    const welcome = '¡Hola! Soy tu asistente de ventas. ¿En qué puedo ayudarte hoy?';
    speechSynthesis.cancel();
    setTextoPendiente('');
    setMessages([{ sender: 'bot', text: welcome }]);
    speak(welcome);
    setInformeData(null);
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-CL';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.onresult = (event) => {
        const voiceInput = event.results[0][0].transcript;
        setInput(voiceInput);
        setTimeout(handleSend, 100);
      };
    }
    recognitionRef.current.start();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to right, #e0c3fc, #8ec5fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={10} sx={{ width: '100%', maxWidth: 700, borderRadius: 4, p: 3, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 50 }}><Lottie animationData={botAnimation} loop={true} /></Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#ff5722' }}>Asistente de Ventas</Typography>
          </Stack>
          <Tooltip title="Limpiar conversación">
            <IconButton color="error" onClick={handleClear}><DeleteSweepIcon /></IconButton>
          </Tooltip>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ height: isMobile ? 350 : 450, overflowY: 'auto', border: '2px solid #ffe0b2', borderRadius: 3, p: 2, backgroundColor: '#ffffffdd' }}>
          <Stack spacing={2}>
            {messages.map((msg, index) => (
              <Slide direction="up" in mountOnEnter unmountOnExit key={index} timeout={{ enter: 250 }}>
                <Box sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'user' ? '#ff7043' : '#26c6da', color: '#fff', px: 2, py: 1.5, borderRadius: 2, maxWidth: '85%', boxShadow: 3 }}>
                  <Typography variant="caption" fontWeight="bold">{msg.sender === 'user' ? 'Tú' : 'Asistente'}</Typography>
                  <Typography variant="body2" component="div" dangerouslySetInnerHTML={{ __html: msg.text }} />
                </Box>
              </Slide>
            ))}
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="textSecondary">Procesando...</Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        {informeData && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#ffffffee', borderRadius: 2, border: '1px solid #ccc' }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Pregunta: {informeData.pregunta}
            </Typography>
            <Button onClick={descargarExcel} variant="outlined" color="success" sx={{ mt: 2 }}>
              Descargar Excel
            </Button>
          </Box>
        )}

        <Stack direction="row" spacing={1} mt={2} alignItems="center">
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            variant="outlined"
            sx={{ backgroundColor: '#fff', borderRadius: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSend}
            sx={{ backgroundColor: '#ff5722', '&:hover': { backgroundColor: '#e64a19', transform: 'scale(1.05)', transition: 'all 0.2s ease-in-out' }, minWidth: 110 }}
          >Enviar</Button>
          <Tooltip title="Hablar">
            <IconButton onClick={handleVoice} sx={{ backgroundColor: '#ffcc80', ml: 1 }}>
              <KeyboardVoiceIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={vozActiva}
              onChange={(e) => setVozActiva(e.target.checked)}
              color="primary"
            />
          }
          label="Voz activa"
          sx={{ mt: 2 }}
        />
      </Paper>
    </Box>
  );
};

export default ChatBot;
