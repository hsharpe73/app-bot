import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Fade,
  Chip,
  Zoom,
  LinearProgress,
  Backdrop,
  Paper,
  Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const WEBHOOK_EXCEL_URL = 'https://app-bot.app.n8n.cloud/webhook/excel-mensajes';

const UploadExcel = ({ open, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('info');
  const [showAlert, setShowAlert] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showUserMessage('⚠️ Por favor selecciona un archivo Excel.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);

    try {
      const response = await axios.post(WEBHOOK_EXCEL_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      const backendMessage = response?.data?.mensaje || '✅ Archivo subido exitosamente.';
      const tipo =
        backendMessage.includes('✅') && backendMessage.includes('⚠️') ? 'warning' :
        backendMessage.includes('⚠️') ? 'warning' :
        backendMessage.includes('❌') ? 'error' :
        'success';

      showUserMessage(backendMessage, tipo);

      setSelectedFile(null);
      onClose();
    } catch (error) {
      showUserMessage('❌ Error al subir el archivo. Intenta nuevamente.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const showUserMessage = (text, severity) => {
    setMessage(text);
    setUploadStatus(severity);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={uploading ? null : onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 10,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            fontSize: '1.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 5,
          }}
        >
          📄 Subir Archivo Excel
          <Tooltip title="Cerrar">
            <IconButton
              aria-label="cerrar"
              onClick={onClose}
              disabled={uploading}
              sx={{ color: 'grey.500' }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ flexWrap: 'wrap' }}
            >
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                disabled={uploading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 2,
                }}
              >
                Seleccionar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {selectedFile ? (
                  <Chip
                    label={selectedFile.name}
                    color="primary"
                    variant="outlined"
                    sx={{ maxWidth: 200 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Ningún archivo seleccionado
                  </Typography>
                )}
              </Box>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              ✅ Solo se permiten archivos .xlsx o .xls
            </Typography>

            {uploading && (
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ mt: 1, borderRadius: 1 }}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={uploading} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>

          <Zoom in={!!selectedFile && !uploading}>
            <span>
              <Button
                onClick={handleUpload}
                variant="contained"
                color="success"
                disabled={!selectedFile || uploading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: selectedFile ? 4 : 'none',
                  opacity: selectedFile ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  pointerEvents: selectedFile ? 'auto' : 'none',
                }}
              >
                Subir
              </Button>
            </span>
          </Zoom>
        </DialogActions>
      </Dialog>

      <Backdrop open={showAlert} sx={{ zIndex: 1500, color: '#fff' }}>
        <Paper elevation={4} sx={{ p: 2, minWidth: 400, borderRadius: 2 }}>
          <Alert severity={uploadStatus} variant="filled" sx={{ fontSize: '1rem' }}>
            {message}
          </Alert>
        </Paper>
      </Backdrop>
    </>
  );
};

export default UploadExcel;
