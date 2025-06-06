import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const WEBHOOK_EXCEL_URL = 'https://app-bot.app.n8n.cloud/webhook/subir-excel';

const UploadExcel = ({ open, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor selecciona un archivo Excel.');
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(WEBHOOK_EXCEL_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(response.data?.mensaje || 'Archivo procesado correctamente.');
      setSelectedFile(null);
      onClose(); // Cierra el modal al subir exitosamente
    } catch (error) {
      setMessage('⚠️ Error al subir el archivo.');
    } finally {
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Subir Archivo Excel
          <IconButton
            aria-label="cerrar"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
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
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleUpload} variant="contained" color="success" disabled={!selectedFile}>
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setSnackbarOpen(false)}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UploadExcel;
