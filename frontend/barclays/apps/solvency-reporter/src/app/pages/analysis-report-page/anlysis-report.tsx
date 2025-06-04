import { Box, Grid, Skeleton, Typography } from "@mui/material";
import AppPage from "../app-page"
import { useEffect, useState } from "react";
import { AnalysisResponse } from "./reports-types";


const AnalysisReportPage = () => {
    const darkBlue = '#1e3a8a';

    const [reportStatus, setReportStatus] = useState<null | "loading" | "error" | "success">(null);


    const runAnalysis = () => {
        setReportStatus("loading")
        // const url = "http://127.0.0.1:8000/run-analysis"
        const url = "/run-analysis.json"
        fetch(url,{method:"POST"}).then(res=>{
            console.log(res);
            if(res.ok){
                return res.json()
            }
            throw new Error("API call failed")
        }).then((res:AnalysisResponse) =>{
            console.log(res);
        })    
    }

    useEffect(() => {
        runAnalysis()
    }, [])
    return (
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
                        width: 1400,
                        textAlign: 'center',
                        alignItems: 'center'
                    }}

                >
                    <Typography variant="h3" sx={{
                        fontWeight: 'normal',
                        color: darkBlue,
                        mb: 4,
                        textTransform: 'uppercase'
                    }}>
                        PRISMA AI SOLVENCY PLATFORM
                    </Typography>

                    {reportStatus === 'loading' && <>
                        <Skeleton variant="text" sx={{ fontSize: '1rem' }} width={110} />
                        <Skeleton variant="text" sx={{ fontSize: '1rem' }} width={150} />

                        <Grid container spacing={2} sx={{marginTop:5, marginBottom:5}}>
                            <Grid size={4}>
                                <Skeleton variant="circular" width={100} height={100} />
                            </Grid>
                            <Grid size={8}>
                                <Skeleton variant="rectangular" width={210} height={110} />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{marginBottom:5}}>
                            <Grid size={10}>
                                <Skeleton variant="rectangular" width={280} height={20} />
                            </Grid>
                            <Grid size={2}>
                                <Skeleton variant="rectangular" width={40} height={20} />
                            </Grid>
                        </Grid>
                        {/* For other variants, adjust the size with `width` and `height` */}
                    </>}

                    {reportStatus === 'loading' && <>
                        <Skeleton variant="text" sx={{ fontSize: '1rem' }} width={110} />
                        <Skeleton variant="text" sx={{ fontSize: '1rem' }} width={150} />

                        <Grid container spacing={2} sx={{marginTop:5, marginBottom:5}}>
                            <Grid size={4}>
                                <Skeleton variant="circular" width={100} height={100} />
                            </Grid>
                            <Grid size={8}>
                                <Skeleton variant="rectangular" width={210} height={110} />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{marginBottom:5}}>
                            <Grid size={10}>
                                <Skeleton variant="rectangular" width={280} height={20} />
                            </Grid>
                            <Grid size={2}>
                                <Skeleton variant="rectangular" width={40} height={20} />
                            </Grid>
                        </Grid>
                        {/* For other variants, adjust the size with `width` and `height` */}
                    </>}
                </Box>
            </Grid>

        </AppPage>
    )
}

export default AnalysisReportPage;
