import { Button, Grid, MenuItem, MenuList, Paper, Stack } from '@mui/material';
import Header from '../components/header/header';

const AppPage = (props: any) => {
  return (
    <Grid
      container
      direction="column"
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}
    >
      <Grid
        size={12}
        sx={{ justifyContent: 'center', alignSelf: 'center', maxWidth: 1440 }}
      >
        <Header />
      </Grid>
      <Grid sx={{ maxWidth: 1440 }} container size={12}>
        <Grid size={2} sx={{ py: 3 }}>
          <Stack sx={{ height: 300 }} direction="column" spacing={2}>
            <Paper>
              <MenuList>
                <MenuItem>Home</MenuItem>
                <MenuItem>Historic data</MenuItem>
                <MenuItem>Stress test</MenuItem>
                <MenuItem>Pre merger checks</MenuItem>
                <MenuItem>Post merger checks</MenuItem>
              </MenuList>
            </Paper>
          </Stack>
        </Grid>
        <Grid size={10}>{props.children}</Grid>
      </Grid>
    </Grid>
  );
};

export default AppPage;
