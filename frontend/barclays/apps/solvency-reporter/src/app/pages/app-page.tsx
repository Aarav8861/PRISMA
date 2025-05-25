import { Grid } from "@mui/material";
import Header from "../components/header/header";

const AppPage = (props: any) => {
   

    return (
            <Grid
                container
                direction="column"
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    flex:1,
                }}
            >
                <Grid size={12} sx={{justifyContent:'center', alignSelf:'center', maxWidth:1440}}>
                    <Header />
                </Grid>
                    {props.children}
            </Grid>
    )
}

export default AppPage;