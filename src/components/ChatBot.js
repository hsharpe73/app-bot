import React, { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, Button, Typography, Paper, Stack, CircularProgress, Slide,
  IconButton, Divider, Tooltip, useMediaQuery, useTheme, Switch, FormControlLabel,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import axios from 'axios';
import Lottie from 'lottie-react';
import botAnimation from '../assets/bot.json';
import * as XLSX from 'xlsx';

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

  useEffect(() => speechSynthesis.getVoices(), []);

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

  const speak = (text) => {
    if (!vozActiva) {
      setTextoPendiente(text);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
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
        const mensaje = '🧾 Informe recibido correctamente. Puedes descargarlo abajo.';
        speechSynthesis.cancel();
        setTextoPendiente('');
        setMessages((prev) => [...prev, { sender: 'bot', text: mensaje }]);
        speak(mensaje);
      } else {
        const respuesta = res.data?.message?.content || res.data || 'Sin respuesta del asistente';
        speechSynthesis.cancel();
        setTextoPendiente('');
        setMessages((prev) => [...prev, { sender: 'bot', text: respuesta }]);
        speak(respuesta);
      }
    } catch {
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
    if (!informeData?.resultados?.length) return;
    const ws = XLSX.utils.json_to_sheet(informeData.resultados);
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-CL';
      recognitionRef.current.onresult = (e) => {
        const voiceInput = e.results[0][0].transcript;
        setInput(voiceInput);
        setTimeout(handleSend, 100);
      };
    }
    recognitionRef.current.start();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to right, #e0c3fc, #8ec5fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper elevation={10} sx={{ width: '100%', maxWidth: 700, borderRadius: 4, p: 3, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 50 }}><Lottie animationData={botAnimation} loop /></Box>
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
                <Box sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'user' ? '#ff7043' : '#26c6da', color: '#fff', px: 2, py: 1.5, borderRadius: 2, maxWidth: '85%' }}>
                  <Typography variant="caption" fontWeight="bold">{msg.sender === 'user' ? 'Tú' : 'Asistente'}</Typography>
                  <Typography variant="body2" dangerouslySetInnerHTML={{ __html: msg.text }} />
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
            <Typography variant="h6" gutterBottom>📊 Informe generado</Typography>
            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
              Pregunta: {informeData.pregunta}
            </Typography>
            <Button onClick={descargarExcel} variant="outlined" color="secondary">
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
            sx={{ backgroundColor: '#ff5722', '&:hover': { backgroundColor: '#e64a19' }, minWidth: 110 }}
          >Enviar</Button>
          <Tooltip title="Hablar">
            <IconButton onClick={handleVoice} sx={{ backgroundColor: '#ffcc80', ml: 1 }}>
              <KeyboardVoiceIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <FormControlLabel
          control={<Switch checked={vozActiva} onChange={(e) => setVozActiva(e.target.checked)} color="primary" />}
          label="Voz activa"
          sx={{ mt: 2 }}
        />
      </Paper>
    </Box>
  );
};

export default ChatBot;
