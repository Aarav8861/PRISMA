import { Button, Grid, Paper, Typography } from "@mui/material";
import { Send } from "@mui/icons-material"
import AppPage from "../app-page";
import ReactSpeedometer from "react-d3-speedometer";
import softArch from "../../../assets/images/architectural-diagram-2.png";
import { useNavigate } from "react-router-dom";

const HomePage = () => {

    const navigate = useNavigate();
    const runAnalysis = () => {
        navigate("/analysis")
    }
    return (
        <AppPage>
            <Grid sx={{ padding: 10 }}>
                <ReactSpeedometer height={175} needleHeightRatio={0.7} maxSegmentLabels={5} segments={1000} value={666} textColor={'gray'} />
            </Grid>
            <Button onClick={runAnalysis} endIcon={<Send />} sx={{ alignSelf: 'center' }} color="secondary" variant="contained" size="large">
                Generate report for today
            </Button>
            <Grid
                container
                direction="row"
                sx={{
                    justifyContent: "flex-start",
                    alignItems: "start",
                    width:1440,
                    marginTop:10
                }}
            >
                <Grid size={5}>
                <img src={softArch} width={620}/>
                </Grid>
                <Grid size={5} padding={10}>
                    <Paper elevation={4} sx={{padding:10}}>
                        <Typography variant="h4">How it works?</Typography>
                    </Paper>
                </Grid>
            </Grid>

        </AppPage>
    )
}

export default HomePage;