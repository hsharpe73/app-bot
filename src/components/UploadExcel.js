import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const WEBHOOK_EXCEL_URL = 'https://app-bot.app.n8n.cloud/webhook/subir-excel';

const UploadExcel = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor selecciona un archivo Excel.');
      setOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(WEBHOOK_EXCEL_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(response.data?.mensaje || 'Archivo procesado correctamente.');
    } catch (error) {
      setMessage('⚠️ Error al subir el archivo.');
    } finally {
      setOpen(true);
    }
  };

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Subir Archivo Excel
      </Typography>

      <Stack spacing={2} direction="row" alignItems="center">
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
        >
          Seleccionar Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={handleFileChange}
          />
        </Button>

        <Typography variant="body2">
          {selectedFile ? selectedFile.name : 'Ningún archivo seleccionado'}
        </Typography>

        <Button
          variant="contained"
          color="success"
          onClick={handleUpload}
          disabled={!selectedFile}
        >
          Subir
        </Button>
      </Stack>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setOpen(false)}>
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UploadExcel;
