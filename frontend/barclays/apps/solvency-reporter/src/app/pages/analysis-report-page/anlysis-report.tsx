import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fab,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import AppPage from '../app-page';
import { useEffect, useRef, useState } from 'react';
import { AnalysisResponse, ChatMessage } from './reports-types';
import ReplyIcon from '@mui/icons-material/Reply';
import DownloadIcon from '@mui/icons-material/Download';

const StreamMessage = (props: { prompt: string }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    fetch(
      `http://127.0.0.1:8000/stream-response?prompt=${encodeURIComponent(
        props.prompt
      )}`
    ).then(async (res) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        if (reader) {
          const { value, done } = await reader.read();
          if (done) break;
          if (spanRef.current)
            spanRef.current.innerText += decoder.decode(value);
        }
      }
    });
  }, []);

  return (
    <Typography ref={spanRef} sx={{ mb: 3, maxWidth: '90%' }}></Typography>
  );
};

const AnalysisReportPage = () => {
  const darkBlue = '#1e3a8a';
  const blueColor = '#00aeef';

  const [messages, setMessages] = useState<ChatMessage[]>([
    { message: 'Run Analysis', personna: 'user', key: '01' },
  ]);

  const [chatPromt, setChatPrompt] = useState('');
  const runAnalysis = () => {
    const url = 'http://127.0.0.1:8000/run-analysis';
    const key = Math.random().toString();
    setMessages([
      ...messages,
      { key: key, message: '', status: 'loading', personna: 'prisma' },
    ]);
    // const url = '/run-analysis.json';
    fetch(url, { method: 'POST' })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('API call failed');
      })
      .then((res: AnalysisResponse) => {
        setMessages((prev) =>
          prev.map((obj) =>
            obj.key === key
              ? {
                  ...obj,
                  ...{
                    status: 'success',
                    message: res.analysis_summary,
                    suggestions: res.suggested_questions,
                  },
                }
              : obj
          )
        );
        // setReportData(res);
      });
  };

  const downloadPdf = () => {
    fetch('http://127.0.0.1:8000/generate-report', { method: 'POST' }).then(
      async (res) => {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Optional: set the file name
        a.download = `Solvency Report[${new Date().getDate()}].pdf`;

        // Append, trigger click, and remove
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Revoke the URL after download
        window.URL.revokeObjectURL(url);
      }
    );
  };
  const addPrompt = (textToPromot?: string) => {
    const chatPrompt = chatPromt;
    const key = Math.random().toString();

    setMessages([
      ...messages,
      {
        key: Math.random().toString(),
        personna: 'user',
        message: textToPromot ? textToPromot : chatPrompt,
      },
      {
        key: key,
        message: '',
        status: 'success',
        personna: 'prisma',
        stream: (
          <StreamMessage prompt={textToPromot ? textToPromot : chatPrompt} />
        ),
      },
    ]);

    setChatPrompt('');
    callPrompt(textToPromot ? textToPromot : chatPrompt);
  };

  const callPrompt = (prompt: string) => {};
  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {}, [messages]);
  return (
    <AppPage>
      <Grid
        container
        direction="row"
        sx={{
          flex: 1,
        }}
        width={1400}
        bgcolor={'#F8F8F8'}
        margin={1}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '90vh',
            padding: 2,
            width: 1400,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'normal',
              color: darkBlue,
              mb: 4,
              textTransform: 'uppercase',
            }}
          >
            PRISMA AI SOLVENCY PLATFORM
          </Typography>
          <List sx={{ paddingBottom: 50 }}>
            {messages.map((message: ChatMessage) => {
              if (message.personna === 'user')
                return (
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      justifySelf: 'flex-end',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              backgroundColor: 'white',
                              paddingX: 2,
                              paddingY: 1,
                              borderRadius: 5,
                            }}
                          >
                            {message.message}
                          </Typography>
                        }
                      />
                      <Avatar
                        sx={{
                          bgcolor: darkBlue,
                          width: 32,
                          height: 32,
                          fontSize: 16,
                          mt: 1,
                        }}
                      >
                        V
                      </Avatar>
                    </Box>
                  </ListItem>
                );

              if (message.personna === 'prisma' && message.status === 'loading')
                return (
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: blueColor,
                          width: 32,
                          height: 32,
                          fontSize: 16,
                        }}
                      >
                        P
                      </Avatar>
                    </Box>
                    <Skeleton variant="rectangular" width={400} height={40} />
                  </ListItem>
                );

              if (message.personna === 'prisma' && message.status === 'success')
                return (
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      justifySelf: 'flex-start',
                      mr: 3,
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: blueColor,
                          width: 32,
                          height: 32,
                          fontSize: 16,
                          mt: 1,
                        }}
                      >
                        P
                      </Avatar>
                      <ListItemText
                        primary={
                          <>
                            <Typography
                              variant="body1"
                              sx={{
                                backgroundColor: '#E8E8E8',
                                paddingX: 2,
                                paddingY: 1,
                                maxWidth: '80%',
                                borderRadius: 5,
                                justifySelf: 'flex-start',
                              }}
                            >
                              {typeof message.message === 'string' &&
                                message.message
                                  .split('\n\n')
                                  .map((text) => (
                                    <Typography sx={{ mb: 3 }}>
                                      {text}
                                    </Typography>
                                  ))}
                              {!message.stream && (
                                <Button
                                  onClick={downloadPdf}
                                  sx={{ color: blueColor }}
                                  startIcon={<DownloadIcon />}
                                  variant="text"
                                >
                                  Download Report
                                </Button>
                              )}
                              {message.stream && message.stream}
                            </Typography>
                            {message.suggestions && (
                              <Typography variant="body1" sx={{ mt: 2, p: 1 }}>
                                Suggested questions
                              </Typography>
                            )}
                            {message.suggestions &&
                              message.suggestions.map((suggestion) => (
                                <Button
                                  sx={{
                                    color: blueColor,
                                    borderColor: blueColor,
                                    m: 1,
                                    borderRadius: '20px',
                                  }}
                                  variant="outlined"
                                  size="small"
                                  onClick={() => addPrompt(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                          </>
                        }
                      />
                    </Box>
                  </ListItem>
                );
            })}
          </List>
        </Box>
      </Grid>
      <Card
        sx={{
          position: 'fixed',
          left: 320,
          right: 320,
          bottom: 50,
          backgroundColor: '#F5F5F5',
        }}
      >
        <CardContent>
          <Grid
            container
            direction="row"
            sx={{
              justifyContent: 'space-around',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <TextField
              color={'primary'}
              variant="filled"
              size="medium"
              sx={{ width: '90%' }}
              value={chatPromt}
              onChange={(event) => setChatPrompt(event.target.value)}
              label={<Typography variant="overline"></Typography>}
            />
            <Fab
              onClick={() => addPrompt()}
              variant="extended"
              sx={{ backgroundColor: blueColor }}
            >
              <ReplyIcon sx={{ color: 'white' }} />
            </Fab>
          </Grid>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary' }}
          ></Typography>
        </CardContent>
      </Card>
    </AppPage>
  );
};

export default AnalysisReportPage;
