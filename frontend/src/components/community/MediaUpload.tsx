import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Alert,
  Card,
  CardMedia,
  CardActions,
  Tooltip,
  Fade,
  Collapse,
  Divider,
  Badge,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import {
  PhotoCamera,
  VideoCall,
  Delete,
  Image as ImageIcon,
  Movie as MovieIcon,
  Error as ErrorIcon,
  Close,
  Add,
  ExpandMore,
  ExpandLess,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import heic2any from 'heic2any';

export interface SelectedMedia {
  file: File;
  preview: string;
  id: string;
  error?: string;
}

interface MediaUploadProps {
  onMediaChange: (mediaFiles: SelectedMedia[]) => void;
  selectedMedia?: SelectedMedia[];
  maxFiles?: number;
  disabled?: boolean;
  compact?: boolean;
  showPreview?: boolean;
  removeButtonDisabled?:boolean;
}

const SUPPORTED_FORMATS = {
  images: ['JPEG', 'PNG', 'GIF', 'WebP', 'HEIC'],
  videos: ['MP4', 'MOV', 'AVI', 'WebM'],
};

const MAX_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
};

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaChange,
  selectedMedia = [],
  maxFiles = 5,
  disabled = false,
  compact = false,
  showPreview = true,
  removeButtonDisabled,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [expanded, setExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.type)) {
      return `この形式のファイルは添付できません。使える形式は ${SUPPORTED_FORMATS.images.join('、')}、${SUPPORTED_FORMATS.videos.join('、')} です。`;
    }

    const maxSize = file.type.startsWith('image/') ? MAX_SIZES.image : MAX_SIZES.video;
    if (file.size > maxSize) {
      const maxSizeLabel = file.type.startsWith('image/') ? '10MB' : '100MB';
      return `ファイルが大きすぎます。${maxSizeLabel}までにしてください。`;
    }

    return null;
  }, []);

  const createPreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  const generateFileId = useCallback((): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentTotal = selectedMedia.length;

    setErrors({});

    if (fileArray.length + currentTotal > maxFiles) {
      setErrors({
        fileLimit: `添付できるのは${maxFiles}件までです。いまは${currentTotal}件添付しています。`
      });
      return;
    }

    const validFiles: SelectedMedia[] = [];
    const newErrors: { [key: string]: string } = {};

    for (const file of fileArray) {
      const fileId = generateFileId();
      let fileToProcess = file;
      const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');

      if (isHeic) {
        try {
          const conversionResult: any = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
          fileToProcess = new File([conversionResult], fileName, { type: 'image/jpeg' });
        } catch (error) {
          newErrors[fileId] = `${file.name}：HEIC の画像を変換できませんでした。`;
          continue;
        }
      }
      const error = validateFile(fileToProcess);

      if (error) {
        newErrors[fileId] = `${fileToProcess.name}：${error}`;
      } else {
        const fileWithPreview: SelectedMedia = {
          file: fileToProcess,
          preview: createPreview(fileToProcess),
          id: fileId,
        };
        validFiles.push(fileWithPreview);
      }
    };

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors({}), 8000);
    }

    if (validFiles.length > 0) {
      const updatedMedia = [...selectedMedia, ...validFiles];
      onMediaChange(updatedMedia);
    }
  }, [selectedMedia, maxFiles, validateFile, createPreview, generateFileId, onMediaChange]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFileSelect(event.target.files);
      event.target.value = '';
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = Array.from(event.dataTransfer.files);
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOver(false);
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    const updatedMedia = selectedMedia.filter(item => {
      if (item.id === id) {
        URL.revokeObjectURL(item.preview);
        return false;
      }
      return true;
    });

    onMediaChange(updatedMedia);

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, [selectedMedia, onMediaChange]);

  const canAddMore = selectedMedia.length < maxFiles && !disabled;
  const hasFiles = selectedMedia.length > 0;

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      selectedMedia.forEach(item => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, []);

  // Compact version for inline usage
  if (compact) {
    return (
      <Box>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,video/*,.heic,.heif"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled || !canAddMore}
        />

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Tooltip title="画像や動画を添付">
            <IconButton
              color="primary"
              disabled={!canAddMore}
              onClick={() => fileInputRef.current?.click()}
              aria-label="画像や動画を添付"
              sx={{ width: 44, height: 44 }}
            >
              <Badge badgeContent={selectedMedia.length || null} color="secondary">
                <PhotoCamera />
              </Badge>
            </IconButton>
          </Tooltip>

          {hasFiles && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {selectedMedia.slice(0, 3).map((item) => (
                <Chip
                  key={item.id}
                  label={item.file.name.length > 10 ? `${item.file.name.substring(0, 10)}...` : item.file.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => handleRemoveFile(item.id)}
                  deleteIcon={<Close />}
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
              {selectedMedia.length > 3 && (
                <Chip
                  label={`ほか${selectedMedia.length - 3}件`}
                  size="small"
                  color="primary"
                  variant="filled"
                />
              )}
            </Stack>
          )}
        </Stack>

        {/* Error messages */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert severity="error" sx={{ mt: 1, fontSize: '0.875rem' }}>
                {Object.values(errors).map((error, index) => (
                  <Typography key={index} variant="caption" display="block">
                    • {error}
                  </Typography>
                ))}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    );
  }

  // Full version
  const getUploadAreaContent = () => {
    if (!canAddMore && selectedMedia.length >= maxFiles) {
      return (
        <Stack alignItems="center" spacing={1}>
          <ImageIcon sx={{ fontSize: 32, color: 'text.secondary' }} aria-hidden />
          <Typography variant="body1" fontWeight={700}>
            {maxFiles}件まで添付しました
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ほかのファイルを添付するときは、どれかを外してください。
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack alignItems="center" spacing={2}>
        <Add
          color={dragOver ? 'primary' : 'action'}
          sx={{ fontSize: 36 }}
          aria-hidden
        />
        <Box textAlign="center">
          <Typography variant="subtitle1" component="p" fontWeight={700} gutterBottom>
            {dragOver ? 'ここにファイルを置いてください' : '画像や動画を添付する'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ここにドラッグするか、ボタンから選んでください。投稿するときにアップロードします。
          </Typography>

          <Button variant="outlined" startIcon={<PhotoCamera />} tabIndex={-1}>
            ファイルを選ぶ
          </Button>
        </Box>

        <Button
          variant="text"
          color="inherit"
          startIcon={showHelp ? <ExpandLess /> : <Info />}
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(!showHelp);
          }}
          aria-expanded={showHelp}
          sx={{ color: 'text.secondary' }}
        >
          使えるファイルの形式
        </Button>
      </Stack>
    );
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*,.heic,.heif"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled || !canAddMore}
      />

      {/* Upload area */}
      <Paper
        role="button"
        tabIndex={canAddMore ? 0 : -1}
        aria-label="画像や動画を選ぶ"
        aria-disabled={!canAddMore}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 2,
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'primary.light' : 'background.default',
          borderRadius: 2.5,
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          cursor: canAddMore ? 'pointer' : 'default',
          '&:hover': canAddMore ? {
            borderColor: 'primary.main',
          } : {},
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'secondary.main',
            outlineOffset: 2,
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canAddMore && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (canAddMore && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {getUploadAreaContent()}

        <Collapse in={showHelp}>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }} justifyContent="center">
            <Box textAlign="center">
              <PhotoCamera color="action" sx={{ mb: 0.5 }} aria-hidden />
              <Typography variant="caption" display="block" fontWeight={700}>
                画像
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {SUPPORTED_FORMATS.images.join(', ')}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {formatFileSize(MAX_SIZES.image)}まで
              </Typography>
            </Box>
            <Box textAlign="center">
              <VideoCall color="action" sx={{ mb: 0.5 }} aria-hidden />
              <Typography variant="caption" display="block" fontWeight={700}>
                動画
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {SUPPORTED_FORMATS.videos.join(', ')}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {formatFileSize(MAX_SIZES.video)}まで
              </Typography>
            </Box>
          </Stack>
        </Collapse>
      </Paper>

      {/* Error messages */}
      <AnimatePresence>
        {Object.keys(errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <IconButton
                  onClick={() => setErrors({})}
                  aria-label="閉じる"
                  color="inherit"
                >
                  <Close fontSize="small" />
                </IconButton>
              }
            >
              <Typography variant="subtitle2" gutterBottom>
                添付できないファイルがあります
              </Typography>
              {Object.entries(errors).map(([key, error]) => (
                <Typography key={key} variant="body2">
                  • {error}
                </Typography>
              ))}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media grid */}
      {showPreview && hasFiles && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}
        >
          {selectedMedia.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardMedia
                  sx={{
                    height: 120,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {item.file.type.startsWith('image/') ? (
                    <Box
                      component="img"
                      src={item.preview}
                      alt={`選んだ画像：${item.file.name}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={1} sx={{ p: 2 }}>
                      <MovieIcon sx={{ fontSize: 36, color: 'text.secondary' }} aria-hidden />
                      <Typography variant="caption" textAlign="center" noWrap sx={{ maxWidth: '100%' }}>
                        {item.file.name.length > 15 ? `${item.file.name.substring(0, 15)}...` : item.file.name}
                      </Typography>
                    </Stack>
                  )}

                </CardMedia>

                <CardActions sx={{ p: 1, minHeight: 60 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                      {item.file.type.startsWith('image/') ? '画像' : '動画'}・{formatFileSize(item.file.size)}
                    </Typography>

                    <Tooltip title="外す">
                      <IconButton
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={removeButtonDisabled}
                        aria-label={`${item.file.name} を外す`}
                        sx={{ width: 44, height: 44, color: 'text.secondary' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardActions>
              </Card>
            </motion.div>
          ))}
        </Box>
      )}
    </Box>
  );
};