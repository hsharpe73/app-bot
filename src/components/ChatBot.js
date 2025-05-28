import React, { useState, useEffect } from 'react';
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
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import axios from 'axios';

const WEBHOOK_URL = 'https://sharpe-asistente.app.n8n.cloud/webhook/consulta-ventas-v3';

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: '¡Hola! Soy tu asistente de ventas. ¿En qué puedo ayudarte hoy? 🧾',
      },
    ]);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(WEBHOOK_URL, { pregunta: input });
      let respuesta = typeof res.data === 'string' && res.data.trim() !== ''
        ? res.data
        : 'Sin respuesta del asistente';

      respuesta = respuesta.replace(/\$\d{1,3}(?:\.\d{3})+/g, (match) => {
        const limpio = match.replace(/\./g, '').replace('$', '');
        return `<strong>${formatCLP(limpio)}</strong>`;
      });

      respuesta = respuesta.replace(/(\d{1,3}(?:[.,]\d{1,2})?)%/g, '<strong>$1%</strong>');

      const mensaje = respuesta.toLowerCase().includes('no hay datos disponibles')
        ? '⚠️ No se encontró información para esa factura.'
        : respuesta;

      setMessages((prev) => [...prev, { sender: 'bot', text: mensaje }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Error al conectar con el asistente' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: 'bot',
        text: '¡Hola! Soy tu asistente de ventas. ¿En qué puedo ayudarte hoy? 🧾',
      },
    ]);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #e0c3fc, #8ec5fc)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 700,
          borderRadius: 4,
          p: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ bgcolor: '#ff7043' }}>
              <SmartToyIcon />
            </Avatar>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: '#ff5722' }}
            >
              Asistente de Ventas
            </Typography>
          </Stack>
          <Tooltip title="Limpiar conversación">
            <IconButton color="error" onClick={handleClear}>
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            height: isMobile ? 350 : 450,
            overflowY: 'auto',
            border: '2px solid #ffe0b2',
            borderRadius: 3,
            p: 2,
            backgroundColor: '#ffffffdd',
          }}
        >
          <Stack spacing={2}>
            {messages.map((msg, index) => (
              <Slide
                direction="up"
                in
                mountOnEnter
                unmountOnExit
                key={index}
                timeout={{ enter: 250 }}
              >
                <Box
                  sx={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#ff7043' : '#26c6da',
                    color: '#fff',
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    maxWidth: '85%',
                    boxShadow: 3,
                  }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    {msg.sender === 'user' ? 'Tú' : 'Asistente'}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="div"
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                </Box>
              </Slide>
            ))}
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="textSecondary">
                  Procesando...
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} mt={2}>
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
            sx={{
              backgroundColor: '#ff5722',
              '&:hover': {
                backgroundColor: '#e64a19',
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease-in-out',
              },
              minWidth: 110,
            }}
          >
            Enviar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ChatBot;
