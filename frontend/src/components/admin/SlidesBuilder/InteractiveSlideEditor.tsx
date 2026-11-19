import React, { useState, memo, useCallback } from "react";
import { Box, Tabs, Tab, Stack, TextField, Badge } from "@mui/material";
import { Slide, SlideContent } from "../../../types/slide.types";
import { InteractiveContent } from "../../../types/interactive.types";
import {
  FeedbackSettings,
  InteractiveTypeSelector,
  ValidationAlerts,
  InteractiveItemsManager,
  InteractiveSettings,
  InteractivePreview,
} from "./InteractiveEditor";

interface InteractiveSlideEditorProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
  onUpdateContent: (
    index: number,
    contentUpdates: Partial<SlideContent>
  ) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const InteractiveSlideEditor: React.FC<InteractiveSlideEditorProps> =
  memo(({ slide, index, onUpdateContent }) => {
    const [tabValue, setTabValue] = useState(0);
    const [previewItem, setPreviewItem] = useState<number | null>(null);

    const interactiveContent = (slide.content
      .content as InteractiveContent) || {
      type: "drag-drop",
      instruction: "問題に答えてください。",
      items: [],
      settings: {},
      feedback: {
        correct: "正解です。",
        incorrect: "ちがいます。もう一度考えてみましょう。",
      },
    };

    const updateInteractiveContent = useCallback(
      (updates: Partial<InteractiveContent>) => {
        onUpdateContent(index, {
          content: {
            ...interactiveContent,
            ...updates,
          },
        });
      },
      [index, interactiveContent, onUpdateContent]
    );

    const updateSettings = useCallback(
      (newSettings: any) => {
        updateInteractiveContent({
          settings: { ...interactiveContent.settings, ...newSettings },
        });
      },
      [interactiveContent.settings, updateInteractiveContent]
    );

    const getValidationStatus = () => {
      const errors = [];
      const warnings = [];

      if (!interactiveContent.instruction?.trim()) {
        errors.push("説明文を入力してください");
      }

      if (!interactiveContent.items?.length) {
        errors.push("項目を1つ以上追加してください");
      }

      if (
        interactiveContent.items?.length &&
        interactiveContent.items.length < 2
      ) {
        warnings.push("項目が1つだけです。2つ以上あると取り組みやすくなります");
      }

      return { errors, warnings };
    };

    const { errors, warnings } = getValidationStatus();

    return (
      <Box>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="種類" />
          <Tab
            label={
              <Badge badgeContent={errors.length} color="error">
                内容
              </Badge>
            }
          />
          <Tab label="設定" />
          <Tab label="プレビュー" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <InteractiveTypeSelector
            interactiveContent={interactiveContent}
            onUpdateContent={updateInteractiveContent}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <ValidationAlerts errors={errors} warnings={warnings} />

            <TextField
              fullWidth
              label="説明文"
              multiline
              rows={3}
              defaultValue={interactiveContent.instruction || ""}
              onBlur={(e) =>
                updateInteractiveContent({ instruction: e.target.value })
              }
              helperText="受講者に何をすればよいかを伝えます"
              error={!interactiveContent.instruction?.trim()}
            />

            <FeedbackSettings
              interactiveContent={interactiveContent}
              onUpdateContent={updateInteractiveContent}
            />

            <InteractiveItemsManager
              interactiveContent={interactiveContent}
              onUpdateContent={updateInteractiveContent}
              previewItem={previewItem}
              onSetPreviewItem={setPreviewItem}
            />
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <InteractiveSettings
            type={interactiveContent.type}
            settings={interactiveContent.settings || {}}
            onUpdate={updateSettings}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <InteractivePreview interactiveContent={interactiveContent} />
        </TabPanel>
      </Box>
    );
  });

InteractiveSlideEditor.displayName = "InteractiveSlideEditor";
