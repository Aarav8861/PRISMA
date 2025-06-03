import React from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import { AutoGraph, ShowChart, Assessment, Send } from '@mui/icons-material';
import AppPage from '../app-page';
import { useNavigate } from 'react-router-dom';

const PRISMAVisual = () => {
  const blueColor = '#00aeef';
  const darkBlue = '#1e3a8a';

  const navigate = useNavigate();
    const runAnalysis = () => {
        navigate("/analysis")
    }
    
  return (
    <AppPage>
    <Box sx={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      p: 6,
      marginTop: '15px',
      textAlign: 'center'
    }}>
      {/* PRISMA Header */}
      <Typography variant="h3" sx={{
        fontWeight: 'bold',
        color: darkBlue,
        mb: 4,
        textTransform: 'uppercase'
      }}>
        PRISMA AI SOLVENCY PLATFORM
      </Typography>

      {/* AI Features Grid */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center" sx={{ mb: 6 }}>
        {/* Feature 1 */}
        <Paper elevation={3} sx={{
          p: 4,
          borderRadius: 2,
          width: 300,
          backgroundColor: 'white'
        }}>
          <AutoGraph sx={{ fontSize: 50, color: blueColor, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: darkBlue, mb: 2 }}>
            ANOMALY DETECTION
          </Typography>
          <Typography sx={{ color: '#4b5563' }}>
            Graph neural networks identify hidden liabilities and interconnected risks
          </Typography>
        </Paper>

        {/* Feature 2 */}
        <Paper elevation={3} sx={{
          p: 4,
          borderRadius: 2,
          width: 300,
          backgroundColor: 'white'
        }}>
          <ShowChart sx={{ fontSize: 50, color: blueColor, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: darkBlue, mb: 2 }}>
            MITIGATION STRATEGIES
          </Typography>
          <Typography sx={{ color: '#4b5563' }}>
            Reinforcement learning generates optimal intervention plans
          </Typography>
        </Paper>

        {/* Feature 3 */}
        <Paper elevation={3} sx={{
          p: 4,
          borderRadius: 2,
          width: 300,
          backgroundColor: 'white'
        }}>
          <Assessment sx={{ fontSize: 50, color: blueColor, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: darkBlue, mb: 2 }}>
            COMPLIANCE ASSURANCE
          </Typography>
          <Typography sx={{ color: '#4b5563' }}>
            Automated vetting of all actions against regulatory requirements
          </Typography>
        </Paper>
      </Stack>

      {/* Generate Report Button */}
      <Button
        variant="contained"
        size="large"
        onClick={runAnalysis}
        endIcon={<Send />}
        sx={{
          backgroundColor: blueColor,
          color: 'white',
          px: 6,
          py: 2,
          fontSize: 18,
          fontWeight: 'bold',
          margin: '20px',
          borderRadius: 2,
          '&:hover': {
            backgroundColor: darkBlue
          }
        }}
      >
        GENERATE RISK REPORT
      </Button>


      {/* PRISMA Process Visualization */}
      <Box sx={{
        border: `50px solid ${blueColor}`,
        borderRadius: 0,
        p: 4,
        margin:'20px',
        maxWidth: 800,
        mx: 'auto',
        mb: 6,

        backgroundColor: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* AI Network Visualization Placeholder */}
        <Box sx={{
          height: 300,
          background: 'linear-gradient(145deg, #f0f4f8 0%, #d0e0f0 100%)',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          position: 'relative'
        }}>
          {/* Simulated AI network visualization */}
          <Box sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: 'radial-gradient(circle, #00aeef 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.3
          }} />
          <Typography variant="h6" sx={{ 
            color: darkBlue,
            zIndex: 1,
            fontWeight: 'bold',
            textAlign: 'center',
            px: 2
          }}>
            AI-Powered Solvency Risk Network Analysis
          </Typography>
          
          {/* Simulated nodes */}
          {[20, 50, 80].map((perc, i) => (
            <Box key={i} sx={{
              position: 'absolute',
              left: `${perc}%`,
              top: i % 2 === 0 ? '30%' : '70%',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: i === 1 ? blueColor : darkBlue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              transform: `scale(${1 + i*0.2})`,
              zIndex: 2
            }}>
              {['Risk', 'AI', 'Data'][i]}
            </Box>
          ))}
        </Box>

        <Typography variant="body1" sx={{ color: '#4b5563', mb: 3 }}>
          PRISMA continuously monitors financial health across multiple dimensions, 
          predicting solvency risks before they escalate.
        </Typography>
      </Box>

      
      {/* Footer */}
      <Typography variant="body2" sx={{ color: '#6b7280', mt: 6 }}>
        © 2025 Barclays PRISMA AI Solvency Platform
      </Typography>
    </Box>
    </AppPage>
  );
};
export default PRISMAVisual;