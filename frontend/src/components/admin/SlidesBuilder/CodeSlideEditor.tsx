import React, { useState, memo, useCallback } from "react";
import {
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ContentCopy,
  PlayArrow,
  Code,
  Fullscreen,
  Download,
  Upload,
  Settings,
  Visibility,
  Edit,
  BugReport,
} from "@mui/icons-material";
import { Slide, SlideContent } from "../../../types/slide.types";

interface CodeSlideEditorProps {
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
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const CodeSlideEditor: React.FC<CodeSlideEditorProps> = memo(
  ({ slide, index, onUpdateContent }) => {
    const { content } = slide;
    const [tabValue, setTabValue] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const codeContent = content.content || {};
    const codeSettings = codeContent.settings || {};

    const updateCodeContent = useCallback(
      (updates: any) => {
        onUpdateContent(index, {
          content: { ...codeContent, ...updates },
        });
      },
      [index, codeContent, onUpdateContent]
    );

    const updateCodeSettings = useCallback(
      (newSettings: any) => {
        updateCodeContent({
          settings: { ...codeSettings, ...newSettings },
        });
      },
      [codeSettings, updateCodeContent]
    );

    const languages = [
      {
        value: "javascript",
        label: "JavaScript",
        example: 'console.log("Hello, World!");',
      },
      { value: "python", label: "Python", example: 'print("Hello, World!")' },
      {
        value: "java",
        label: "Java",
        example: 'System.out.println("Hello, World!");',
      },
      {
        value: "cpp",
        label: "C++",
        example:
          '#include <iostream>\nstd::cout << "Hello, World!" << std::endl;',
      },
      {
        value: "csharp",
        label: "C#",
        example: 'Console.WriteLine("Hello, World!");',
      },
      { value: "html", label: "HTML", example: "<h1>Hello, World!</h1>" },
      { value: "css", label: "CSS", example: "h1 { color: blue; }" },
      { value: "sql", label: "SQL", example: 'SELECT "Hello, World!";' },
      {
        value: "json",
        label: "JSON",
        example: '{\n  "message": "Hello, World!"\n}',
      },
      {
        value: "typescript",
        label: "TypeScript",
        example:
          'const message: string = "Hello, World!";\nconsole.log(message);',
      },
      { value: "php", label: "PHP", example: '<?php echo "Hello, World!"; ?>' },
      { value: "ruby", label: "Ruby", example: 'puts "Hello, World!"' },
      { value: "go", label: "Go", example: 'fmt.Println("Hello, World!")' },
      { value: "rust", label: "Rust", example: 'println!("Hello, World!");' },
    ];

    const themes = [
      { value: "vs-dark", label: "ダーク", color: "#1e1e1e" },
      { value: "vs-light", label: "ライト", color: "#ffffff" },
      { value: "github-dark", label: "GitHub Dark", color: "#0d1117" },
      { value: "monokai", label: "Monokai", color: "#272822" },
      { value: "dracula", label: "Dracula", color: "#282a36" },
    ];

    const selectedLanguage = languages.find(
      (lang) => lang.value === (codeContent.language || "javascript")
    );
    const selectedTheme = themes.find(
      (theme) => theme.value === (codeSettings.theme || "vs-dark")
    );

    const handleRunCode = () => {
      setIsRunning(true);
      // Simulate code execution
      setTimeout(() => {
        setIsRunning(false);
      }, 2000);
    };

    return (
      <Stack spacing={3}>
        {/* Basic Code Info */}
        <TextField
          fullWidth
          label="タイトル"
          defaultValue={content.title || ""}
          onBlur={(e) => onUpdateContent(index, { title: e.target.value })}
          placeholder="例：はじめてのスクリプト"
        />

        <TextField
          fullWidth
          label="説明"
          defaultValue={content.subtitle || ""}
          onBlur={(e) => onUpdateContent(index, { subtitle: e.target.value })}
          placeholder="このコードで何を見せるか、短く書きます"
          multiline
          rows={2}
        />

        {/* Language Selection */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>言語</InputLabel>
              <Select
                value={codeContent.language || "javascript"}
                label="言語"
                onChange={(e) =>
                  updateCodeContent({
                    language: e.target.value,
                    // Set example code if current code is empty or default
                    ...((!codeContent.code ||
                      codeContent.code.includes("Enter your code here") ||
                      codeContent.code.includes("ここにコードを入力します")) && {
                      code:
                        languages.find((lang) => lang.value === e.target.value)
                          ?.example || "",
                    }),
                  })
                }
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Code fontSize="small" />
                      <Typography>{lang.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>配色</InputLabel>
              <Select
                value={codeSettings.theme || "vs-dark"}
                label="配色"
                onChange={(e) => updateCodeSettings({ theme: e.target.value })}
              >
                {themes.map((theme) => (
                  <MenuItem key={theme.value} value={theme.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: theme.color,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Typography>{theme.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Code Editor Tabs */}
        <Card variant="outlined">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
            >
              <Tab label="コード" icon={<Edit />} iconPosition="start" />
              <Tab label="プレビュー" icon={<Visibility />} iconPosition="start" />
              <Tab label="設定" icon={<Settings />} iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={2}>
              {/* Code Editor Header */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight={600}>
                    {selectedLanguage?.label || "JavaScript"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(codeContent.code || "").split("\n").length} 行
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Tooltip title="コードをコピー">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigator.clipboard.writeText(codeContent.code || "")
                      }
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ファイルから読み込む">
                    <IconButton size="small">
                      <Upload />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ダウンロード">
                    <IconButton size="small">
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="全画面で編集">
                    <IconButton size="small">
                      <Fullscreen />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {/* Code Input */}
              <TextField
                fullWidth
                multiline
                rows={15}
                label="コード"
                defaultValue={codeContent.code || ""}
                onBlur={(e) => updateCodeContent({ code: e.target.value })}
                error={!codeContent.code?.trim()}
                helperText={
                  !codeContent.code?.trim()
                    ? "コードを入力してください"
                    : `${selectedLanguage?.label} のコード`
                }
                sx={{
                  "& .MuiInputBase-input": {
                    fontFamily:
                      'Monaco, Menlo, "Ubuntu Mono", "Fira Code", Consolas, monospace',
                    fontSize: codeSettings.fontSize || "14px",
                    lineHeight: 1.5,
                    bgcolor: selectedTheme?.color,
                    color: selectedTheme?.value.includes("dark")
                      ? "#ffffff"
                      : "#000000",
                  },
                  "& .MuiOutlinedInput-root": {
                    bgcolor: selectedTheme?.color,
                  },
                }}
                placeholder={
                  selectedLanguage?.example || "// ここにコードを入力します"
                }
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={2}>
              {/* Preview Header */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">コードのプレビュー</Typography>
                <Stack direction="row" spacing={1}>
                  {(selectedLanguage?.value === "javascript" ||
                    selectedLanguage?.value === "python") && (
                    <Button
                      variant="outlined"
                      startIcon={isRunning ? <BugReport /> : <PlayArrow />}
                      onClick={handleRunCode}
                      disabled={isRunning}
                      size="small"
                    >
                      {isRunning ? "実行中…" : "実行"}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<Fullscreen />}
                    size="small"
                  >
                    全画面で見る
                  </Button>
                </Stack>
              </Stack>

              {/* Code Preview */}
              <Box
                sx={{
                  bgcolor: selectedTheme?.color || "#1e1e1e",
                  color: selectedTheme?.value.includes("dark")
                    ? "#ffffff"
                    : "#000000",
                  p: 2,
                  borderRadius: 1,
                  fontFamily:
                    'Monaco, Menlo, "Ubuntu Mono", "Fira Code", Consolas, monospace',
                  fontSize: codeSettings.fontSize || "14px",
                  lineHeight: 1.5,
                  overflowX: "auto",
                  minHeight: 200,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {codeContent.code || "// コードがありません"}
                </pre>
              </Box>

              {/* Output Preview */}
              {isRunning ? (
                <Alert severity="info">
                  <Typography variant="body2">実行中…</Typography>
                </Alert>
              ) : (
                <Box
                  sx={{
                    bgcolor: "#23211D",
                    color: "#F4F1EB",
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: "13px",
                    minHeight: 60,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#A8A296", mb: 1 }}>
                    出力
                  </Typography>
                  <pre style={{ margin: 0 }}>
                    {selectedLanguage?.value === "javascript" &&
                    codeContent.code?.includes("console.log")
                      ? "Hello, World!"
                      : selectedLanguage?.value === "python" &&
                        codeContent.code?.includes("print")
                      ? "Hello, World!"
                      : "「実行」を押すと、ここに結果が出ます"}
                  </pre>
                </Box>
              )}
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Stack spacing={3}>
              <Typography variant="h6">表示の設定</Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="文字の大きさ"
                    value={codeSettings.fontSize || "14px"}
                    onChange={(e) =>
                      updateCodeSettings({ fontSize: e.target.value })
                    }
                    placeholder="14px"
                    helperText="CSS の値（例：14px、1rem）"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>タブの幅</InputLabel>
                    <Select
                      value={codeSettings.tabSize || 2}
                      label="タブの幅"
                      onChange={(e) =>
                        updateCodeSettings({ tabSize: e.target.value })
                      }
                    >
                      <MenuItem value={2}>スペース2つ</MenuItem>
                      <MenuItem value={4}>スペース4つ</MenuItem>
                      <MenuItem value={8}>スペース8つ</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={codeSettings.showLineNumbers !== false}
                        onChange={(e) =>
                          updateCodeSettings({
                            showLineNumbers: e.target.checked,
                          })
                        }
                      />
                    }
                    label="行番号を表示"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={codeSettings.wordWrap || false}
                        onChange={(e) =>
                          updateCodeSettings({ wordWrap: e.target.checked })
                        }
                      />
                    }
                    label="折り返す"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={codeSettings.highlightActiveLines || false}
                        onChange={(e) =>
                          updateCodeSettings({
                            highlightActiveLines: e.target.checked,
                          })
                        }
                      />
                    }
                    label="選択中の行を強調"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={codeSettings.allowCopy !== false}
                        onChange={(e) =>
                          updateCodeSettings({ allowCopy: e.target.checked })
                        }
                      />
                    }
                    label="コピーを許可"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3 }}>
                受講者の操作
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={codeSettings.allowEditing || false}
                        onChange={(e) =>
                          updateCodeSettings({ allowEditing: e.target.checked })
                        }
                      />
                    }
                    label="受講者がコードを編集できる"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={codeSettings.allowExecution || false}
                        onChange={(e) =>
                          updateCodeSettings({
                            allowExecution: e.target.checked,
                          })
                        }
                      />
                    }
                    label="コードの実行を許可"
                  />
                </Grid>
              </Grid>

              {codeSettings.allowExecution && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    実行は、信頼できるコードだけで許可してください。受講者が書いたコードを動かすなら、サンドボックスを使うのが安全です。
                  </Typography>
                </Alert>
              )}
            </Stack>
          </TabPanel>
        </Card>

        {/* Code Comments/Notes */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="コードの解説"
          defaultValue={codeContent.explanation || ""}
          onBlur={(e) => updateCodeContent({ explanation: e.target.value })}
          placeholder="このコードが何をしているか、要点は何かを書きます"
          helperText="コードの横に表示されます"
        />
      </Stack>
    );
  }
);

CodeSlideEditor.displayName = "CodeSlideEditor";
