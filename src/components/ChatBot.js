import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Slide,
} from '@mui/material';
import axios from 'axios';

const WEBHOOK_URL = 'https://sharpe-asistente.app.n8n.cloud/webhook/consulta-ventas-v3';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    console.log('📤 Enviando al webhook:', input);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(WEBHOOK_URL, { pregunta: input });
      console.log('📥 Respuesta completa:', res);
      console.log('🧾 Tipo de res.data:', typeof res.data);
      console.log('📄 Contenido crudo:', res.data);

      
      const respuesta = res.data?.respuesta || 'Sin respuesta del asistente';
      console.log('📌 Respuesta recibida:', respuesta);

      const mensaje = respuesta?.toLowerCase().includes('no hay datos disponibles')
        ? '⚠️ No se encontró información para esa factura.'
        : respuesta;

      setMessages((prev) => [...prev, { sender: 'bot', text: mensaje }]);
    } catch (err) {
      console.error('❌ Error al conectar con el webhook:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Error al conectar con el asistente' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 650,
          borderRadius: 4,
          p: 3,
          backgroundColor: '#ffffffdd',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
        }}
      >
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          gutterBottom
          sx={{ color: '#ff5722' }}
        >
          💬 Asistente Inteligente de Ventas
        </Typography>

        <Box
          sx={{
            height: 450,
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
            border: '2px solid #ffccbc',
            borderRadius: 3,
            p: 2,
            mb: 2,
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
                timeout={{ enter: 300 }}
              >
                <Box
                  sx={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#ff7043' : '#4dd0e1',
                    color: '#fff',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: '85%',
                    boxShadow: 3,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {msg.sender === 'user' ? 'Tú' : 'Asistente'}
                  </Typography>
                  <Typography variant="body2">{msg.text}</Typography>
                </Box>
              </Slide>
            ))}
            {loading && (
              <Typography variant="body2" color="textSecondary">
                <CircularProgress size={16} sx={{ mr: 1 }} /> Procesando...
              </Typography>
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta aquí..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            variant="outlined"
            sx={{ backgroundColor: 'white', borderRadius: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            sx={{
              backgroundColor: '#ff5722',
              '&:hover': { backgroundColor: '#e64a19' },
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
