import { Box, Card, CardContent, Fab, Grid, List, TextField, Typography, useTheme } from "@mui/material"
import AppPage from "../app-page"
import ReplyIcon from "@mui/icons-material/Reply"
import ChatThread from "../../components/chat/chat-thread";
import { useState } from "react";
import CircularProgress from '@mui/material/CircularProgress';

const AnalysisPage = () => {
    const [promptArr, setPromptArr] = useState<{ action: string, message: string }[]>([{ action: 'analysis', message: 'Run analysis' }])
    const [isloading, setLoading] = useState(true);
    const [chatPromt, setChatPrompt] = useState('');
    const theme = useTheme();

    const addNewPrompt = () => {
        // setLoading(true);
        setPromptArr([...promptArr, {action:'prompt', message:chatPromt}])
        // setChatPrompt("")
    }

    return (
        <>
            <AppPage>
                <Grid container
                    direction="row"
                    sx={{
                        flex: 1,
                    }} width={1400} bgcolor={'#F8F8F8'} margin={1}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '90vh',
                            padding: 2,
                            width: 1400
                        }}
                    >
                        <List sx={{ paddingBottom: 50 }}>
                            {promptArr.map((prompt) => ChatThread({...prompt, setLoading, isloading}))}
                        </List>
                    </Box>

                </Grid>
                <Card sx={{ position: 'fixed', left: 320, right: 320, bottom: 50, backgroundColor: '#F5F5F5' }}>
                    <CardContent>
                        <Grid
                            container
                            direction="row"
                            sx={{
                                justifyContent: "space-around",
                                alignItems: "center",
                                flex: 1,
                            }}
                        >
                            <TextField
                                color={"primary"}
                                variant="filled" size="medium"
                                sx={{ width: '90%' }}
                                onChange={event=>setChatPrompt(event.target.value)}
                                disabled={isloading}
                                label={
                                    <Typography
                                        variant="overline">
                                        {isloading ? 'please wait...' : 'Ask me anything'}
                                    </Typography>
                                }
                            />
                            <Fab onClick={addNewPrompt} variant="extended" sx={{ backgroundColor: theme.palette.secondary.main }}>
                                {isloading ? <CircularProgress size={'20px'}/> : <ReplyIcon sx={{ color: "white" }} />}
                            </Fab>

                        </Grid>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        </Typography>
                    </CardContent>
                </Card>
            </AppPage>
        </>
    )
}

export default AnalysisPage