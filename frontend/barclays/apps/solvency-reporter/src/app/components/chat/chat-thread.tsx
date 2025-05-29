import { ListItem, ListItemText, Typography } from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import TypeIt from "typeit-react";


const ChatThread = (props: { action: string, message: string, setLoading: Dispatch<SetStateAction<boolean>>, isloading: boolean }) => {
    const [prismaText, setPrismText] = useState<string[]>(["Hello"]);
    const [prismaRef, setPrismRefText] = useState<string>();
    const { action, message, setLoading, isloading } = props;
    let event: EventSource;
    const updateMessage = (message: any) => {
        setPrismRefText(message.data)
    }

    useEffect(() => {
        prismaRef && setPrismText([...prismaText, prismaRef])
    }, [prismaRef])


    useEffect(() => {
        switch (action) {
            case "analysis":
                runAnalysis()
                break;

            default:
                console.log("action not available");
                setLoading(false)
                break;
        }

        return () => {
            event?.close();
            setLoading(false)
        }
    }, [])


    const runAnalysis = () => {
        event = new EventSource("http://127.0.0.1:8000/run-analysis-stream");
        event.onmessage = (message) => {
            updateMessage(message)
        }
        event.onerror = (err) => {
            updateMessage({ data: "Unable to reach out to server" })
            console.error(new Error("Failed to call the API"), err);
            setTimeout(() => {
                updateMessage({ data: "Closing the connection" })
                event.close()
                setLoading(false)
            }, 3000);
        }

        event.addEventListener("close", () => { updateMessage(event); event.close(); setLoading(false) })
    }

    return (
        <>
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
                            {message}
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
                                        backgroundColor: '#E8E8E8',
                                        paddingX: 2,
                                        paddingY: 1,
                                        marginBottom:3,
                                        borderRadius: 5,
                                        justifySelf: 'flex-start'

                                    }}
                                ><TypeIt options={{ speed: 1, cursor: false }}>{text}</TypeIt>
                                </Typography>
                            )
                            )}
                            {isloading &&
                                <Typography
                                    variant="body1"
                                    sx={{
                                        paddingX: 2,
                                        paddingY: 1,
                                        borderRadius: 5,
                                        justifySelf: 'flex-start'

                                    }}
                                >
                                    <TypeIt as="h3" options={{ loop: true, cursor:false, speed:100 }}>......</TypeIt>
                                </Typography>
                            }
                        </>
                    }
                />
            </ListItem>
        </>
    )
}

export default ChatThread;