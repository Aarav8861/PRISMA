import { Box, Button, Card, CardActionArea, CardContent, Chip, Fab, Grid, Input, List, ListItem, ListItemText, Paper, TextField, Typography, useTheme } from "@mui/material"
import AppPage from "../app-page"
import ReplyIcon from "@mui/icons-material/Reply"
import { useEffect, useState } from "react";
import TypeIt from "typeit-react";
const AnalysisPage = () => {
    let event: EventSource;

    const theme = useTheme();

    const [prismaText, setPrismText] = useState<string[]>(["Hello"]);
    const [prismaRef, setPrismRefText] = useState<string>();    
    const updateMessage = (message:any) => {
        setPrismRefText(message.data)
    }

    const runAnalysis = () => {
        event = new EventSource("http://127.0.0.1:8000/run-analysis-stream");
        event.onmessage = (message) => {
            updateMessage(message)
        }
        event.onerror = (err) => {
            console.error(new Error("Failed to call the API"), err);
            updateMessage({data:"Unable to reach out to server"})
        }

        event.addEventListener("close", ()=>{updateMessage(event);event.close()})
    }

    useEffect(() => {
        runAnalysis()
        return () => { event?.close(); }
    }, [])

    useEffect(() => {
        prismaRef && setPrismText([...prismaText, prismaRef])
    }, [prismaRef])

    return (
        <>
            <AppPage>
                <Grid container
                    direction="row"
                    sx={{
                        flex: 1,
                    }} height={800} width={1400} bgcolor={'#F8F8F8'} margin={1}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100vh',
                            padding: 2,
                            width: 1400
                        }}
                    >
                        <List>
                            <ListItem
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    justifySelf: 'flex-end'
                                }}
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
                                                justifySelf: 'flex-end'
                                            }}
                                        >
                                            {'Run Analysis'}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            <ListItem
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'end',
                                    justifySelf: 'flex-start'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    paddingX: 2,
                                                    paddingY: 1,
                                                    justifySelf: 'flex-start'

                                                }}
                                            >
                                                {'PRISMA'}
                                            </Typography>
                                            {prismaText.map((text) => (
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        backgroundColor: '#F5F5F5',
                                                        paddingX: 2,
                                                        paddingY: 1,
                                                        borderRadius: 5,
                                                        justifySelf: 'flex-start'

                                                    }}
                                                ><TypeIt options={{speed:1, cursor:false}}>{text}</TypeIt>
                                                </Typography>
                                            )

                                            )}
                                        </>
                                    }
                                />
                            </ListItem>

                        </List>
                    </Box>

                </Grid>
                <Card sx={{ position: 'absolute', left: 320, right: 320, bottom: 50, backgroundColor: '#F5F5F5' }}>
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
                            <TextField color={"primary"} variant="filled" size="medium" sx={{ width: '90%' }} label={<Typography variant="overline">Ask me anything</Typography>} />
                            <Fab variant="extended" sx={{ backgroundColor: theme.palette.secondary.main }}>
                                <ReplyIcon sx={{ color: "white" }} />
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