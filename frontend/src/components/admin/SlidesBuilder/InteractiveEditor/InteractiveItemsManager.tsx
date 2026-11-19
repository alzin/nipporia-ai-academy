import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  ContentCopy,
  DragIndicator,
  Preview,
  ExpandMore,
  Psychology,
  Refresh,
} from '@mui/icons-material';
import { InteractiveContent } from '../../../../types/interactive.types';
import { interactiveTypes } from '../../../../utils/interactiveTypes';
import { getDefaultInteractiveItem } from '../../../../utils/lideDefaults';
import { InteractiveItemEditor } from './InteractiveItemEditor';

interface InteractiveItemsManagerProps {
  interactiveContent: InteractiveContent;
  onUpdateContent: (updates: Partial<InteractiveContent>) => void;
  previewItem: number | null;
  onSetPreviewItem: (index: number | null) => void;
  slideSettings?: Record<string, any>;
  onSlideSettingsUpdate?: (settings: Record<string, any>) => void;
}

export const InteractiveItemsManager: React.FC<InteractiveItemsManagerProps> = ({
  interactiveContent,
  onUpdateContent,
  previewItem,
  onSetPreviewItem,
  slideSettings,
  onSlideSettingsUpdate,
}) => {
  const currentTypeConfig = interactiveTypes.find(t => t.value === interactiveContent.type);
  const isSentenceBuilder = interactiveContent.type === 'sentence-builder';

  // For sentence builder, ensure we have exactly one item
  React.useEffect(() => {
    if (isSentenceBuilder) {
      if (!interactiveContent.items || interactiveContent.items.length === 0) {
        // Initialize with one default item
        const defaultItem = getDefaultInteractiveItem(interactiveContent.type);
        onUpdateContent({ items: [defaultItem] });
      } else if (interactiveContent.items.length > 1) {
        // Keep only the first item
        onUpdateContent({ items: [interactiveContent.items[0]] });
      }
    }
  }, [isSentenceBuilder, interactiveContent.items, interactiveContent.type, onUpdateContent]);

  const addInteractiveItem = () => {
    if (isSentenceBuilder) return; // Don't allow adding items for sentence builder
    
    const currentItems = interactiveContent.items || [];
    const newItem = getDefaultInteractiveItem(interactiveContent.type, currentItems.length);
    onUpdateContent({
      items: [...currentItems, newItem]
    });
  };

  const updateInteractiveItem = (itemIndex: number, updates: any) => {
    const newItems = [...(interactiveContent.items || [])];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
    onUpdateContent({ items: newItems });
  };

  const removeInteractiveItem = (itemIndex: number) => {
    if (isSentenceBuilder) return; // Don't allow removing items for sentence builder
    
    const newItems = (interactiveContent.items || []).filter((_, i) => i !== itemIndex);
    onUpdateContent({ items: newItems });
  };

  const duplicateInteractiveItem = (itemIndex: number) => {
    if (isSentenceBuilder) return; // Don't allow duplicating items for sentence builder
    
    const item = interactiveContent.items[itemIndex];
    const duplicatedItem = { ...item, id: Date.now() + Math.random() };
    const newItems = [...interactiveContent.items];
    newItems.splice(itemIndex + 1, 0, duplicatedItem);
    onUpdateContent({ items: newItems });
  };

  const moveItem = (itemIndex: number, direction: 'up' | 'down') => {
    if (isSentenceBuilder) return; // Don't allow moving items for sentence builder
    
    const newItems = [...interactiveContent.items];
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[itemIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[itemIndex]];
      onUpdateContent({ items: newItems });
    }
  };

  const resetSentenceItem = () => {
    if (!isSentenceBuilder) return;
    
    const newItem = getDefaultInteractiveItem(interactiveContent.type);
    onUpdateContent({ items: [newItem] });
  };

  const clearAllItems = () => {
    if (isSentenceBuilder) {
      resetSentenceItem();
    } else {
      onUpdateContent({ items: [] });
    }
  };

  // Get current items
  const items = interactiveContent.items || [];
  const hasItems = items.length > 0;

  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSentenceBuilder && <Psychology color="primary" />}
            {currentTypeConfig?.label} {isSentenceBuilder ? '' : `の項目（${items.length}）`}
          </Typography>
          {isSentenceBuilder && (
            <Typography variant="body2" color="text.secondary">
              1つの文を組み立てる問題です
            </Typography>
          )}
        </Box>
        
        <Stack direction="row" spacing={1}>
          {isSentenceBuilder ? (
            <>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={() => onSetPreviewItem(previewItem === 0 ? null : 0)}
                size="small"
                color={previewItem === 0 ? 'primary' : 'inherit'}
                sx={{ borderRadius: 2 }}
              >
                {previewItem === 0 ? 'プレビューを閉じる' : 'プレビュー'}
              </Button>
              {hasItems && (
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetSentenceItem}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  リセット
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addInteractiveItem}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              項目を追加
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Special notice for sentence builder */}
      {isSentenceBuilder && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            この種類では、文を1つだけ作ります。言葉の並びと、文の意味を入力してください。
          </Typography>
        </Alert>
      )}

      {/* Empty State */}
      {!hasItems ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <Box sx={{ mb: 2 }}>
            {currentTypeConfig?.icon}
          </Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {isSentenceBuilder ? '文を作りましょう' : '項目はまだありません'}
          </Typography>
          <Typography color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            {isSentenceBuilder 
              ? '受講者は言葉をドラッグして、正しい順に並べます。'
              : '「項目を追加」から始めてください。'
            }
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
            例：{currentTypeConfig?.example}
          </Typography>
          {isSentenceBuilder && (
            <Button
              variant="contained"
              onClick={() => {
                const newItem = getDefaultInteractiveItem(interactiveContent.type);
                onUpdateContent({ items: [newItem] });
              }}
              size="large"
              sx={{ borderRadius: 2, px: 4 }}
            >
              文を作る
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={3}>
          {items.map((item: any, itemIndex: number) => (
            <Card 
              key={item.id || itemIndex} 
              variant="outlined" 
              sx={{
                border: '2px solid',
                borderColor: previewItem === itemIndex ? 'primary.main' : 'divider',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2
                }
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {isSentenceBuilder ? <Psychology color="action" fontSize="small" /> : <DragIndicator color="action" fontSize="small" />}
                    <Typography variant="subtitle2" fontWeight={600}>
                      {isSentenceBuilder ? '文の設定' : `項目 ${itemIndex + 1}`}
                    </Typography>
                  </Stack>
                  
                  {/* Action buttons - different for sentence builder */}
                  <Stack direction="row" spacing={1}>
                    {!isSentenceBuilder && (
                      <>
                        <Tooltip title="上へ">
                          <IconButton
                            size="small"
                            onClick={() => moveItem(itemIndex, 'up')}
                            disabled={itemIndex === 0}
                          >
                            <Box sx={{ transform: 'rotate(180deg)' }}>
                              <ExpandMore fontSize="small" />
                            </Box>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="下へ">
                          <IconButton
                            size="small"
                            onClick={() => moveItem(itemIndex, 'down')}
                            disabled={itemIndex === items.length - 1}
                          >
                            <ExpandMore fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    <Tooltip title="プレビュー">
                      <IconButton
                        size="small"
                        onClick={() => onSetPreviewItem(previewItem === itemIndex ? null : itemIndex)}
                        color={previewItem === itemIndex ? 'primary' : 'default'}
                      >
                        <Preview fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {!isSentenceBuilder && (
                      <>
                        <Tooltip title="複製">
                          <IconButton
                            size="small"
                            onClick={() => duplicateInteractiveItem(itemIndex)}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="削除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeInteractiveItem(itemIndex)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Stack>

                <InteractiveItemEditor
                  type={interactiveContent.type}
                  item={item}
                  itemIndex={itemIndex}
                  onUpdate={updateInteractiveItem}
                  currentTypeConfig={currentTypeConfig}
                  slideSettings={slideSettings}
                  onSlideSettingsUpdate={onSlideSettingsUpdate}
                  allItems={interactiveContent.items}
                />

                {previewItem === itemIndex && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={600} color="primary.main" gutterBottom>
                      受講者の画面
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isSentenceBuilder 
                        ? '受講者には言葉がばらばらの順で表示され、ドラッグして正しい順に並べます。'
                        : '受講者には、この項目がこのように表示されます。'
                      }
                    </Typography>
                    
                    {/* Mini preview for sentence builder */}
                    {isSentenceBuilder && item.words && item.words.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          使う言葉
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {item.words.map((word: string, i: number) => (
                            <Chip
                              key={i}
                              label={word}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Quick Actions - Different for sentence builder vs other types */}
      {hasItems && (
        <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default', mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>まとめて操作</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {isSentenceBuilder ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={resetSentenceItem}
                  startIcon={<Refresh />}
                >
                  文をリセット
                </Button>
                {/* Quick Stats for sentence builder */}
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    言葉の数：<strong>{items[0]?.words?.length || 0}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    文の意味：<strong>{items[0]?.translation ? '入力済み' : '未入力'}</strong>
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    // Add 3 more default items with proper indices
                    const newItems = [];
                    for (let i = 0; i < 3; i++) {
                      newItems.push(getDefaultInteractiveItem(interactiveContent.type, items.length + i));
                    }
                    onUpdateContent({
                      items: [...items, ...newItems]
                    });
                  }}
                >
                  項目を3つ追加
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={clearAllItems}
                  color="error"
                >
                  すべての項目を消す
                </Button>
              </>
            )}
          </Stack>
        </Card>
      )}

      {/* Tips section */}
      {isSentenceBuilder && hasItems && (
        <Card variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            作るときのコツ
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              ・言葉は2つ以上にします
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ・文の意味を書いておくと、受講者が答えを考えやすくなります
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ・言葉は、自然な文になる順に入力します
            </Typography>
          </Stack>
        </Card>
      )}
    </Card>
  );
};