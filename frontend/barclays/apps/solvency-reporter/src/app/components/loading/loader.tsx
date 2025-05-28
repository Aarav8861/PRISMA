import { Grid, useTheme } from "@mui/material";
import ReactSpeedometer, { Transition } from "react-d3-speedometer";


const LoadingScreen = () => {

  const useThemeVar = useTheme();

  return (

    <Grid
      container
      direction="column"
      sx={{
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
      }}
    >
      <ReactSpeedometer width={500} needleHeightRatio={0.7} value={777} customSegmentStops={[0, 250, 750, 1000]} segmentColors={[useThemeVar.palette.primary.light, useThemeVar.palette.primary.dark, '#00bbf0']} currentValueText="Loading..." customSegmentLabels={[{
        color: '#d8dee9'
      }, {
        color: '#d8dee9'
      }, {
        color: '#d8dee9'
      }]} ringWidth={47} needleTransitionDuration={4000} needleTransition={Transition.easeElastic} needleColor={'#a7ff83'} textColor={'#d8dee9'} />
    </Grid>

  )
}

export default LoadingScreen;